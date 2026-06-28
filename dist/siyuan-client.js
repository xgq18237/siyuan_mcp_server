import { readFile } from "node:fs/promises";
import path from "node:path";
export class SiyuanApiError extends Error {
    endpoint;
    code;
    status;
    constructor(message, endpoint, code, status) {
        super(message);
        this.endpoint = endpoint;
        this.code = code;
        this.status = status;
        this.name = "SiyuanApiError";
    }
}
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
function parseBoolean(value, fallback = false) {
    if (value === undefined)
        return fallback;
    return value === "1" || value.toLowerCase() === "true";
}
function parsePositiveInt(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
function isLoopback(hostname) {
    const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return normalized === "localhost"
        || normalized === "127.0.0.1"
        || normalized === "::1";
}
function normalizeBaseUrl(value) {
    return value.replace(/\/+$/, "");
}
function configuredBaseUrl() {
    if (process.env.SIYUAN_URL)
        return normalizeBaseUrl(process.env.SIYUAN_URL);
    const host = process.env.SIYUAN_HOST || "127.0.0.1";
    const port = process.env.SIYUAN_PORT || "6806";
    return `http://${host}:${port}`;
}
function configuredUploadRoots() {
    const raw = process.env.SIYUAN_MCP_UPLOAD_ROOTS;
    if (!raw)
        return [process.cwd()];
    return raw
        .split(path.delimiter)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => path.resolve(item));
}
function isEnvelope(value) {
    return typeof value === "object"
        && value !== null
        && typeof value.code === "number";
}
export class SiyuanClient {
    baseUrl;
    token;
    timeoutMs;
    maxResponseBytes;
    debug;
    uploadRoots;
    constructor(options = {}) {
        this.baseUrl = normalizeBaseUrl(options.baseUrl || configuredBaseUrl());
        this.token = options.token ?? process.env.SIYUAN_TOKEN ?? "";
        this.timeoutMs = options.timeoutMs
            ?? parsePositiveInt(process.env.SIYUAN_MCP_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
        this.maxResponseBytes = options.maxResponseBytes
            ?? parsePositiveInt(process.env.SIYUAN_MCP_MAX_RESPONSE_BYTES, DEFAULT_MAX_RESPONSE_BYTES);
        this.debug = options.debug
            ?? parseBoolean(process.env.SIYUAN_MCP_DEBUG);
        this.uploadRoots = (options.uploadRoots ?? configuredUploadRoots()).map((item) => path.resolve(item));
        const url = new URL(this.baseUrl);
        const allowInsecure = options.allowInsecureRemote
            ?? parseBoolean(process.env.SIYUAN_MCP_ALLOW_INSECURE_REMOTE);
        if (url.protocol !== "https:" && !isLoopback(url.hostname) && !allowInsecure) {
            throw new Error("拒绝通过明文 HTTP 连接远程思源。请使用 HTTPS，或显式设置 SIYUAN_MCP_ALLOW_INSECURE_REMOTE=1。");
        }
    }
    connectionInfo() {
        const url = new URL(this.baseUrl);
        return {
            baseUrl: this.baseUrl,
            host: url.hostname,
            port: url.port || (url.protocol === "https:" ? "443" : "80"),
            protocol: url.protocol.replace(":", ""),
            tokenConfigured: this.token.length > 0,
            timeoutMs: this.timeoutMs,
            maxResponseBytes: this.maxResponseBytes,
            uploadRoots: this.uploadRoots,
        };
    }
    async json(endpoint, body = {}) {
        const response = await this.request(endpoint, {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const bytes = await this.readBytes(response, endpoint);
        let parsed;
        try {
            parsed = JSON.parse(new TextDecoder().decode(bytes));
        }
        catch {
            throw new SiyuanApiError("思源返回了无效 JSON", endpoint, undefined, response.status);
        }
        return this.unwrap(parsed, endpoint, response.status);
    }
    async multipart(endpoint, fields, files) {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields))
            form.append(key, value);
        for (const file of files) {
            if (file.filePath) {
                const absolute = this.assertUploadPath(file.filePath);
                const bytes = await readFile(absolute);
                form.append(file.field, new Blob([bytes], { type: file.mimeType }), file.fileName || path.basename(absolute));
            }
            else if (file.data) {
                const copied = new ArrayBuffer(file.data.byteLength);
                new Uint8Array(copied).set(file.data);
                form.append(file.field, new Blob([copied], { type: file.mimeType }), file.fileName || "file");
            }
            else {
                throw new Error(`Multipart 字段 ${file.field} 缺少 filePath 或 data`);
            }
        }
        const response = await this.request(endpoint, { body: form });
        const bytes = await this.readBytes(response, endpoint);
        let parsed;
        try {
            parsed = JSON.parse(new TextDecoder().decode(bytes));
        }
        catch {
            throw new SiyuanApiError("思源返回了无效 JSON", endpoint, undefined, response.status);
        }
        return this.unwrap(parsed, endpoint, response.status);
    }
    async file(endpoint, body) {
        const response = await this.request(endpoint, {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }, [200, 202]);
        const bytes = await this.readBytes(response, endpoint);
        const mimeType = (response.headers.get("content-type") || "application/octet-stream")
            .split(";")[0]
            .trim();
        if (response.status === 202 || mimeType.includes("json")) {
            let parsed;
            try {
                parsed = JSON.parse(new TextDecoder().decode(bytes));
            }
            catch {
                if (response.status === 202) {
                    throw new SiyuanApiError("读取文件失败，且错误响应不是有效 JSON", endpoint, undefined, 202);
                }
                parsed = null;
            }
            if (parsed !== null) {
                const data = this.unwrap(parsed, endpoint, response.status);
                return { kind: "json", mimeType, byteLength: bytes.byteLength, data };
            }
        }
        if (mimeType.startsWith("text/")) {
            return {
                kind: "text",
                mimeType,
                byteLength: bytes.byteLength,
                data: new TextDecoder().decode(bytes),
            };
        }
        return {
            kind: "binary",
            mimeType,
            byteLength: bytes.byteLength,
            encoding: "base64",
            data: Buffer.from(bytes).toString("base64"),
        };
    }
    assertUploadPath(filePath) {
        const absolute = path.resolve(filePath);
        const allowed = this.uploadRoots.some((root) => {
            const relative = path.relative(root, absolute);
            return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
        });
        if (!allowed) {
            throw new Error(`本地文件不在允许上传的目录中：${absolute}。请通过 SIYUAN_MCP_UPLOAD_ROOTS 配置允许目录。`);
        }
        return absolute;
    }
    async request(endpoint, init, acceptedStatuses = [200]) {
        const started = Date.now();
        const headers = new Headers(init.headers);
        if (this.token)
            headers.set("Authorization", `Token ${this.token}`);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: "POST",
                headers,
                body: init.body,
                signal: controller.signal,
            });
            if (this.debug) {
                console.error(`[siyuan-mcp] ${endpoint} -> ${response.status} (${Date.now() - started}ms)`);
            }
            if (!acceptedStatuses.includes(response.status)) {
                throw new SiyuanApiError(`HTTP ${response.status} ${response.statusText}`, endpoint, undefined, response.status);
            }
            return response;
        }
        catch (error) {
            if (error instanceof SiyuanApiError)
                throw error;
            if (error instanceof Error && error.name === "AbortError") {
                throw new SiyuanApiError(`请求超时（${this.timeoutMs}ms）`, endpoint);
            }
            throw new SiyuanApiError(error instanceof Error ? error.message : String(error), endpoint);
        }
        finally {
            clearTimeout(timer);
        }
    }
    async readBytes(response, endpoint) {
        const contentLength = Number(response.headers.get("content-length"));
        if (Number.isFinite(contentLength) && contentLength > this.maxResponseBytes) {
            throw new SiyuanApiError(`响应过大（${contentLength} bytes），上限为 ${this.maxResponseBytes} bytes`, endpoint, undefined, response.status);
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.byteLength > this.maxResponseBytes) {
            throw new SiyuanApiError(`响应过大（${bytes.byteLength} bytes），上限为 ${this.maxResponseBytes} bytes`, endpoint, undefined, response.status);
        }
        return bytes;
    }
    unwrap(parsed, endpoint, status) {
        if (!isEnvelope(parsed))
            return parsed;
        if (parsed.code !== 0) {
            throw new SiyuanApiError(parsed.msg || `思源 API 返回错误码 ${parsed.code}`, endpoint, parsed.code, status);
        }
        return parsed.data;
    }
}
export function createNodeId(now = new Date()) {
    const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
    ].join("");
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    let suffix = "";
    for (let index = 0; index < 7; index += 1) {
        suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `${timestamp}-${suffix}`;
}
export function normalizeReadOnlySql(sql, maxRows) {
    let normalized = sql.trim().replace(/;+\s*$/, "");
    if (!/^(select|with)\b/i.test(normalized)) {
        throw new Error("默认仅允许 SELECT/CTE 查询。危险 SQL 需要 SIYUAN_MCP_ALLOW_UNSAFE_SQL=1。");
    }
    const forbidden = /\b(insert|update|delete|drop|alter|attach|detach|pragma|vacuum|reindex|replace|create)\b/i;
    if (forbidden.test(normalized)) {
        throw new Error("查询包含写入或管理语句，已拒绝执行。");
    }
    if (!/\blimit\s+\d+/i.test(normalized))
        normalized += ` LIMIT ${maxRows}`;
    return normalized;
}
