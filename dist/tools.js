import { createNodeId, SiyuanApiError } from "./siyuan-client.js";
const readOnly = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
};
const mutating = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
};
const destructive = {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
};
const string = (description, extra = {}) => ({
    type: "string",
    description,
    ...extra,
});
const boolean = (description) => ({ type: "boolean", description });
const number = (description, extra = {}) => ({
    type: "number",
    description,
    ...extra,
});
const array = (description, items) => ({
    type: "array",
    description,
    items,
});
const object = (description, additionalProperties = true) => ({
    type: "object",
    description,
    additionalProperties,
});
const schema = (properties = {}, required = [], extra = {}) => ({
    type: "object",
    properties,
    required,
    additionalProperties: false,
    ...extra,
});
const id = string("思源块、文档、笔记本或数据库 ID", {
    pattern: "^\\d{14}-[a-z0-9]{7}$",
});
const dataType = string("输入格式", { enum: ["markdown", "dom"], default: "markdown" });
function define(name, description, inputSchema, annotations = readOnly) {
    return { name, description, inputSchema, annotations };
}
export const toolDefinitions = [
    define("list_notebooks", "列出所有思源笔记本及其打开状态", schema()),
    define("open_notebook", "打开指定笔记本", schema({ notebook: id }, ["notebook"]), mutating),
    define("close_notebook", "关闭指定笔记本", schema({ notebook: id }, ["notebook"]), mutating),
    define("rename_notebook", "重命名笔记本", schema({ notebook: id, name: string("新名称") }, ["notebook", "name"]), mutating),
    define("create_notebook", "创建新笔记本", schema({ name: string("笔记本名称") }, ["name"]), mutating),
    define("remove_notebook", "删除笔记本及其内容；可通过保护开关禁用", schema({ notebook: id }, ["notebook"]), destructive),
    define("get_notebook_conf", "获取笔记本配置", schema({ notebook: id }, ["notebook"])),
    define("set_notebook_conf", "保存笔记本配置", schema({ notebook: id, conf: object("完整配置对象") }, ["notebook", "conf"]), mutating),
    define("create_doc", "在指定笔记本中新建 Markdown 文档", schema({
        notebook: id,
        path: string("文档路径，例如 /daily/2026-06-28"),
        markdown: string("Markdown 内容"),
    }, ["notebook", "path", "markdown"]), mutating),
    define("rename_doc", "按存储路径重命名文档", schema({
        notebook: id,
        path: string("文档存储路径"),
        title: string("新标题"),
    }, ["notebook", "path", "title"]), mutating),
    define("rename_doc_by_id", "按 ID 重命名文档", schema({ id, title: string("新标题") }, ["id", "title"]), mutating),
    define("remove_doc", "按路径删除文档", schema({ notebook: id, path: string("文档路径") }, ["notebook", "path"]), destructive),
    define("remove_doc_by_id", "按 ID 删除文档", schema({ id }, ["id"]), destructive),
    define("move_docs", "移动一组文档", schema({
        fromPaths: array("源文档路径", string("路径")),
        toNotebook: id,
        toPath: string("目标路径"),
    }, ["fromPaths", "toNotebook", "toPath"]), mutating),
    define("move_docs_by_id", "按 ID 移动一组文档", schema({
        fromIDs: array("源文档 ID", id),
        toID: id,
    }, ["fromIDs", "toID"]), mutating),
    define("search_docs", "按标题搜索文档", schema({
        query: string("搜索关键词"),
        flashcard: boolean("是否只搜索闪卡相关文档"),
        excludeIDs: array("排除的文档 ID", id),
    }, ["query"])),
    define("list_docs", "列出指定笔记本路径下的文档", schema({
        notebook: id,
        path: string("路径，根目录使用 /"),
        sort: number("思源排序模式"),
        flashcard: boolean("是否只列出闪卡相关文档"),
        showHidden: boolean("是否显示隐藏文档"),
        maxListCount: number("最大数量", { minimum: 1, maximum: 1000, default: 200 }),
    }, ["notebook", "path"])),
    define("get_hpath_by_path", "根据存储路径获取人类可读路径", schema({ notebook: id, path: string("存储路径") }, ["notebook", "path"])),
    define("get_hpath_by_id", "根据 ID 获取人类可读路径", schema({ id }, ["id"])),
    define("get_path_by_id", "根据 ID 获取存储路径", schema({ id }, ["id"])),
    define("get_ids_by_hpath", "根据人类可读路径获取 ID", schema({ notebook: id, path: string("人类可读路径") }, ["notebook", "path"])),
    define("insert_block", "在指定锚点插入块；nextID、previousID、parentID 至少提供一个", schema({
        dataType,
        data: string("块内容"),
        nextID: id,
        previousID: id,
        parentID: id,
    }, ["data"], {
        anyOf: [{ required: ["nextID"] }, { required: ["previousID"] }, { required: ["parentID"] }],
    }), mutating),
    define("prepend_block", "在父块开头插入子块", schema({ dataType, data: string("块内容"), parentID: id }, ["data", "parentID"]), mutating),
    define("append_block", "在父块末尾插入子块", schema({ dataType, data: string("块内容"), parentID: id }, ["data", "parentID"]), mutating),
    define("update_block", "更新块内容", schema({ dataType, data: string("新内容"), id }, ["data", "id"]), mutating),
    define("delete_block", "删除块", schema({ id }, ["id"]), destructive),
    define("move_block", "移动块；previousID 或 parentID 至少提供一个", schema({
        id,
        previousID: id,
        parentID: id,
    }, ["id"], { anyOf: [{ required: ["previousID"] }, { required: ["parentID"] }] }), mutating),
    define("batch_insert_blocks", "批量插入块", schema({
        blocks: array("待插入块", schema({
            dataType,
            data: string("块内容"),
            nextID: id,
            previousID: id,
            parentID: id,
        }, ["data"], { anyOf: [{ required: ["nextID"] }, { required: ["previousID"] }, { required: ["parentID"] }] })),
    }, ["blocks"]), mutating),
    define("batch_update_blocks", "批量更新块", schema({
        blocks: array("待更新块", schema({ id, dataType, data: string("新内容") }, ["id", "data"])),
    }, ["blocks"]), mutating),
    define("get_block_info", "获取块的元数据", schema({ id }, ["id"])),
    define("get_block_breadcrumb", "获取块的面包屑路径", schema({
        id,
        excludeTypes: array("排除的块类型", string("块类型")),
    }, ["id"])),
    define("get_block_kramdown", "获取块 Kramdown 源码", schema({ id }, ["id"])),
    define("get_child_blocks", "获取直接子块", schema({ id }, ["id"])),
    define("fold_block", "折叠块", schema({ id }, ["id"]), mutating),
    define("unfold_block", "展开块", schema({ id }, ["id"]), mutating),
    define("transfer_block_ref", "转移块引用", schema({
        fromID: id,
        toID: id,
        refIDs: array("指定引用块 ID；省略表示全部", id),
    }, ["fromID", "toID"]), mutating),
    define("set_block_attrs", "设置块属性", schema({ id, attrs: object("属性键值") }, ["id", "attrs"]), mutating),
    define("get_block_attrs", "获取块属性", schema({ id }, ["id"])),
    define("search_blocks", "使用思源全文搜索查找内容块", schema({
        query: string("搜索词、查询语法或正则"),
        page: number("页码", { minimum: 1, default: 1 }),
        pageSize: number("每页数量", { minimum: 1, maximum: 100, default: 32 }),
        paths: array("限定笔记本/文档路径", string("路径")),
        types: object("块类型开关，例如 {\"d\":true,\"p\":true}", { type: "boolean" }),
        method: number("0 关键词、1 查询语法、3 正则；不开放 SQL 模式", { enum: [0, 1, 3], default: 0 }),
        orderBy: number("排序模式", { minimum: 0, maximum: 7, default: 0 }),
        groupBy: number("0 不分组、1 按文档分组", { enum: [0, 1], default: 0 }),
    }, ["query"])),
    define("sql_query", "执行 SQL 语句；调用方应自行确认写入类语句的影响", schema({
        sql: string("SQL 语句"),
    }, ["sql"]), destructive),
    define("flush_transaction", "等待思源事务队列落盘", schema(), mutating),
    define("create_database", "创建并初始化原生思源数据库，可同时创建字段", schema({
        parentID: id,
        name: string("数据库名称"),
        columns: array("附加字段", schema({
            name: string("字段名称"),
            type: string("字段类型", {
                enum: ["text", "number", "date", "select", "mSelect", "url", "email", "phone", "mAsset", "template", "created", "updated", "checkbox", "lineNumber"],
            }),
            icon: string("字段图标"),
        }, ["name", "type"])),
    }, ["parentID"]), mutating),
    define("get_database", "分页渲染数据库", schema({
        avID: id,
        blockID: id,
        viewID: id,
        query: string("数据库内搜索词"),
        page: number("页码", { minimum: 1, default: 1 }),
        pageSize: number("每页数量", { minimum: 1, maximum: 200, default: 50 }),
        createIfNotExist: boolean("数据库文件缺失时是否创建"),
    }, ["avID"])),
    define("get_database_keys", "获取数据库字段定义", schema({ avID: id }, ["avID"])),
    define("rename_database", "重命名数据库", schema({ avID: id, name: string("新名称") }, ["avID", "name"]), mutating),
    define("add_database_column", "添加数据库字段", schema({
        avID: id,
        name: string("字段名称"),
        type: string("字段类型", {
            enum: ["text", "number", "date", "select", "mSelect", "url", "email", "phone", "mAsset", "template", "created", "updated", "checkbox", "lineNumber"],
        }),
        icon: string("字段图标"),
        previousKeyID: id,
    }, ["avID", "name", "type"]), mutating),
    define("remove_database_column", "删除数据库字段", schema({
        avID: id,
        keyID: id,
        removeRelationDest: boolean("同时删除关联目标"),
    }, ["avID", "keyID"]), destructive),
    define("append_database_rows", "以标题批量添加非绑定数据库条目", schema({
        avID: id,
        titles: array("条目标题", string("标题")),
        blockID: id,
        viewID: id,
    }, ["avID", "titles"]), mutating),
    define("set_database_cell", "设置单个数据库单元格；value 使用思源 AV Value JSON 结构", schema({
        avID: id,
        keyID: id,
        itemID: id,
        value: object("AV Value 对象"),
    }, ["avID", "keyID", "itemID", "value"]), mutating),
    define("batch_set_database_cells", "批量设置数据库单元格；values 使用思源批量 AV Value 结构", schema({
        avID: id,
        values: array("单元格更新对象", object("单元格更新")),
    }, ["avID", "values"]), mutating),
    define("remove_database_rows", "删除数据库条目", schema({
        avID: id,
        itemIDs: array("条目 ID", id),
    }, ["avID", "itemIDs"]), destructive),
    define("get_file", "读取工作空间文件；文本/JSON直接返回，二进制以 Base64 返回", schema({
        path: string("以工作空间为根的路径"),
    }, ["path"])),
    define("put_file", "通过 Multipart 写入工作空间文件", schema({
        path: string("目标工作空间路径"),
        isDir: boolean("是否创建目录"),
        modTime: number("Unix 修改时间"),
        filePath: string("要上传的本地文件路径"),
        file: string("兼容字段：UTF-8 文本内容"),
        contentBase64: string("Base64 文件内容"),
        fileName: string("Multipart 文件名"),
        mimeType: string("MIME 类型"),
    }, ["path"], {
        oneOf: [
            { required: ["isDir"] },
            { required: ["filePath"] },
            { required: ["file"] },
            { required: ["contentBase64"] },
        ],
    }), destructive),
    define("remove_file", "删除工作空间文件", schema({ path: string("工作空间路径") }, ["path"]), destructive),
    define("rename_file", "重命名工作空间文件", schema({
        path: string("源路径"),
        newPath: string("目标路径"),
    }, ["path", "newPath"]), destructive),
    define("read_dir", "列出工作空间目录", schema({ path: string("工作空间路径") }, ["path"])),
    define("upload_asset", "上传一个或多个本地资源文件", schema({
        assetsDirPath: string("资源目录，例如 /assets/"),
        files: array("本地文件绝对路径", string("文件路径")),
    }, ["assetsDirPath", "files"]), mutating),
    define("export_md_content", "导出文档 Markdown", schema({ id }, ["id"])),
    define("export_resources", "导出文件与目录", schema({
        paths: array("工作空间路径", string("路径")),
        name: string("导出文件名"),
    }, ["paths"])),
    define("push_msg", "向思源界面推送普通消息", schema({
        msg: string("消息"),
        timeout: number("显示毫秒数", { minimum: 0 }),
    }, ["msg"]), mutating),
    define("push_err_msg", "向思源界面推送错误消息", schema({
        msg: string("消息"),
        timeout: number("显示毫秒数", { minimum: 0 }),
    }, ["msg"]), mutating),
    define("get_version", "获取思源版本", schema()),
    define("get_current_time", "获取思源内核当前时间", schema()),
    define("get_boot_progress", "获取思源启动进度", schema()),
    define("check_siyuan_status", "检查连接、鉴权、笔记本和 SQL 可用性", schema()),
    define("get_workspace_info", "获取脱敏后的 MCP 连接与安全配置", schema()),
    define("render_template", "渲染模板文件", schema({ id, path: string("模板绝对路径") }, ["id", "path"]), mutating),
    define("render_sprig", "渲染 Sprig 模板", schema({ template: string("模板内容") }, ["template"]), mutating),
    define("pandoc_convert", "执行思源 Pandoc 转换", schema({
        dir: string("转换临时目录"),
        args: array("Pandoc 参数", string("参数")),
    }, ["dir", "args"]), mutating),
];
function asArguments(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value))
        return {};
    return value;
}
function requiredString(args, key) {
    const value = args[key];
    if (typeof value !== "string" || value.length === 0)
        throw new Error(`缺少有效参数：${key}`);
    return value;
}
function optionalString(args, key) {
    const value = args[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
function requiredArray(args, key) {
    const value = args[key];
    if (!Array.isArray(value))
        throw new Error(`缺少数组参数：${key}`);
    return value;
}
function optionalNumber(args, key, fallback) {
    const value = args[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function envBoolean(name, fallback = false) {
    const value = process.env[name];
    if (value === undefined)
        return fallback;
    return value === "1" || value.toLowerCase() === "true";
}
function envPositiveInt(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
function requireDestructive() {
    if (envBoolean("SIYUAN_MCP_PROTECT_DESTRUCTIVE")) {
        throw new Error("危险操作保护已开启。如需执行，请移除 SIYUAN_MCP_PROTECT_DESTRUCTIVE 或将其设为 false。");
    }
}
function allowedWritePrefixes() {
    return (process.env.SIYUAN_MCP_WRITE_PATH_PREFIXES || "/data/assets,/temp")
        .split(",")
        .map((item) => item.trim().replace(/\/+$/, ""))
        .filter(Boolean);
}
function assertWritableWorkspacePath(value) {
    const normalized = value.replace(/\\/g, "/");
    const allowed = allowedWritePrefixes().some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
    if (!allowed) {
        throw new Error(`工作空间写入路径不在允许范围：${value}。可通过 SIYUAN_MCP_WRITE_PATH_PREFIXES 配置。`);
    }
}
function toStructured(value) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value;
    }
    if (Array.isArray(value))
        return { items: value };
    if (value === undefined || value === null)
        return { ok: true };
    return { value };
}
function serialize(value) {
    const text = JSON.stringify(value ?? { ok: true }, null, 2);
    const maxChars = envPositiveInt("SIYUAN_MCP_MAX_TEXT_CHARS", 30_000);
    if (text.length <= maxChars)
        return text;
    return `${text.slice(0, maxChars)}\n…输出已截断，共 ${text.length} 字符`;
}
function success(value) {
    const structuredContent = toStructured(value);
    return {
        content: [{ type: "text", text: serialize(value) }],
        structuredContent,
    };
}
function findInsertedBlockId(value) {
    if (Array.isArray(value)) {
        for (const child of value) {
            const found = findInsertedBlockId(child);
            if (found)
                return found;
        }
        return undefined;
    }
    if (typeof value !== "object" || value === null)
        return undefined;
    const record = value;
    if (record.action === "insert" && typeof record.id === "string")
        return record.id;
    for (const child of Object.values(record)) {
        const found = findInsertedBlockId(child);
        if (found)
            return found;
    }
    return undefined;
}
function stringArray(value, key) {
    const strings = value.filter((item) => typeof item === "string" && item.length > 0);
    if (strings.length !== value.length)
        throw new Error(`${key} 必须全部是非空字符串`);
    return strings;
}
async function renameDatabase(client, avID, name) {
    return client.json("/api/transactions", {
        app: "siyuan-mcp",
        session: "siyuan-mcp",
        reqId: Date.now(),
        transactions: [{
                doOperations: [{ action: "setAttrViewName", id: avID, data: name }],
            }],
    });
}
async function renderDatabase(client, args) {
    return client.json("/api/av/renderAttributeView", {
        id: requiredString(args, "avID"),
        blockID: optionalString(args, "blockID"),
        viewID: optionalString(args, "viewID"),
        query: optionalString(args, "query") || "",
        page: optionalNumber(args, "page", 1),
        pageSize: Math.min(optionalNumber(args, "pageSize", 50), 200),
        createIfNotExist: args.createIfNotExist !== false,
    });
}
export async function invokeTool(client, name, rawArguments) {
    const args = asArguments(rawArguments);
    try {
        switch (name) {
            case "list_notebooks": {
                const data = await client.json("/api/notebook/lsNotebooks");
                return success(data.notebooks);
            }
            case "open_notebook":
                return success(await client.json("/api/notebook/openNotebook", { notebook: requiredString(args, "notebook") }));
            case "close_notebook":
                return success(await client.json("/api/notebook/closeNotebook", { notebook: requiredString(args, "notebook") }));
            case "rename_notebook":
                return success(await client.json("/api/notebook/renameNotebook", {
                    notebook: requiredString(args, "notebook"),
                    name: requiredString(args, "name"),
                }));
            case "create_notebook":
                return success(await client.json("/api/notebook/createNotebook", { name: requiredString(args, "name") }));
            case "remove_notebook":
                requireDestructive();
                return success(await client.json("/api/notebook/removeNotebook", { notebook: requiredString(args, "notebook") }));
            case "get_notebook_conf":
                return success(await client.json("/api/notebook/getNotebookConf", { notebook: requiredString(args, "notebook") }));
            case "set_notebook_conf":
                return success(await client.json("/api/notebook/setNotebookConf", {
                    notebook: requiredString(args, "notebook"),
                    conf: args.conf,
                }));
            case "create_doc":
                return success(await client.json("/api/filetree/createDocWithMd", {
                    notebook: requiredString(args, "notebook"),
                    path: requiredString(args, "path"),
                    markdown: requiredString(args, "markdown"),
                }));
            case "rename_doc":
                return success(await client.json("/api/filetree/renameDoc", {
                    notebook: requiredString(args, "notebook"),
                    path: requiredString(args, "path"),
                    title: requiredString(args, "title"),
                }));
            case "rename_doc_by_id":
                return success(await client.json("/api/filetree/renameDocByID", {
                    id: requiredString(args, "id"),
                    title: requiredString(args, "title"),
                }));
            case "remove_doc":
                requireDestructive();
                return success(await client.json("/api/filetree/removeDoc", {
                    notebook: requiredString(args, "notebook"),
                    path: requiredString(args, "path"),
                }));
            case "remove_doc_by_id":
                requireDestructive();
                return success(await client.json("/api/filetree/removeDocByID", { id: requiredString(args, "id") }));
            case "move_docs":
                return success(await client.json("/api/filetree/moveDocs", {
                    fromPaths: requiredArray(args, "fromPaths"),
                    toNotebook: requiredString(args, "toNotebook"),
                    toPath: requiredString(args, "toPath"),
                }));
            case "move_docs_by_id":
                return success(await client.json("/api/filetree/moveDocsByID", {
                    fromIDs: requiredArray(args, "fromIDs"),
                    toID: requiredString(args, "toID"),
                }));
            case "search_docs":
                return success(await client.json("/api/filetree/searchDocs", {
                    k: requiredString(args, "query"),
                    flashcard: args.flashcard === true,
                    excludeIDs: Array.isArray(args.excludeIDs) ? args.excludeIDs : [],
                }));
            case "list_docs":
                return success(await client.json("/api/filetree/listDocsByPath", {
                    notebook: requiredString(args, "notebook"),
                    path: requiredString(args, "path"),
                    sort: args.sort,
                    flashcard: args.flashcard === true,
                    showHidden: args.showHidden === true,
                    maxListCount: Math.min(optionalNumber(args, "maxListCount", 200), 1000),
                }));
            case "get_hpath_by_path":
                return success(await client.json("/api/filetree/getHPathByPath", {
                    notebook: requiredString(args, "notebook"),
                    path: requiredString(args, "path"),
                }));
            case "get_hpath_by_id":
                return success(await client.json("/api/filetree/getHPathByID", { id: requiredString(args, "id") }));
            case "get_path_by_id":
                return success(await client.json("/api/filetree/getPathByID", { id: requiredString(args, "id") }));
            case "get_ids_by_hpath":
                return success(await client.json("/api/filetree/getIDsByHPath", {
                    notebook: requiredString(args, "notebook"),
                    path: requiredString(args, "path"),
                }));
            case "insert_block": {
                const nextID = optionalString(args, "nextID");
                const previousID = optionalString(args, "previousID");
                const parentID = optionalString(args, "parentID");
                if (!nextID && !previousID && !parentID)
                    throw new Error("nextID、previousID、parentID 至少提供一个");
                return success(await client.json("/api/block/insertBlock", {
                    dataType: optionalString(args, "dataType") || "markdown",
                    data: requiredString(args, "data"),
                    nextID,
                    previousID,
                    parentID,
                }));
            }
            case "prepend_block":
                return success(await client.json("/api/block/prependBlock", {
                    dataType: optionalString(args, "dataType") || "markdown",
                    data: requiredString(args, "data"),
                    parentID: requiredString(args, "parentID"),
                }));
            case "append_block":
                return success(await client.json("/api/block/appendBlock", {
                    dataType: optionalString(args, "dataType") || "markdown",
                    data: requiredString(args, "data"),
                    parentID: requiredString(args, "parentID"),
                }));
            case "update_block":
                return success(await client.json("/api/block/updateBlock", {
                    dataType: optionalString(args, "dataType") || "markdown",
                    data: requiredString(args, "data"),
                    id: requiredString(args, "id"),
                }));
            case "delete_block":
                requireDestructive();
                return success(await client.json("/api/block/deleteBlock", { id: requiredString(args, "id") }));
            case "move_block": {
                const previousID = optionalString(args, "previousID");
                const parentID = optionalString(args, "parentID");
                if (!previousID && !parentID)
                    throw new Error("previousID 或 parentID 至少提供一个");
                return success(await client.json("/api/block/moveBlock", {
                    id: requiredString(args, "id"),
                    previousID,
                    parentID,
                }));
            }
            case "batch_insert_blocks":
                return success(await client.json("/api/block/batchInsertBlock", {
                    blocks: requiredArray(args, "blocks"),
                }));
            case "batch_update_blocks":
                return success(await client.json("/api/block/batchUpdateBlock", {
                    blocks: requiredArray(args, "blocks"),
                }));
            case "get_block_info":
                return success(await client.json("/api/block/getBlockInfo", { id: requiredString(args, "id") }));
            case "get_block_breadcrumb":
                return success(await client.json("/api/block/getBlockBreadcrumb", {
                    id: requiredString(args, "id"),
                    excludeTypes: Array.isArray(args.excludeTypes) ? args.excludeTypes : [],
                }));
            case "get_block_kramdown":
                return success(await client.json("/api/block/getBlockKramdown", { id: requiredString(args, "id") }));
            case "get_child_blocks":
                return success(await client.json("/api/block/getChildBlocks", { id: requiredString(args, "id") }));
            case "fold_block":
                return success(await client.json("/api/block/foldBlock", { id: requiredString(args, "id") }));
            case "unfold_block":
                return success(await client.json("/api/block/unfoldBlock", { id: requiredString(args, "id") }));
            case "transfer_block_ref":
                return success(await client.json("/api/block/transferBlockRef", {
                    fromID: requiredString(args, "fromID"),
                    toID: requiredString(args, "toID"),
                    refIDs: Array.isArray(args.refIDs) ? args.refIDs : undefined,
                }));
            case "set_block_attrs":
                return success(await client.json("/api/attr/setBlockAttrs", {
                    id: requiredString(args, "id"),
                    attrs: args.attrs,
                }));
            case "get_block_attrs":
                return success(await client.json("/api/attr/getBlockAttrs", { id: requiredString(args, "id") }));
            case "search_blocks":
                return success(await client.json("/api/search/fullTextSearchBlock", {
                    query: requiredString(args, "query"),
                    page: optionalNumber(args, "page", 1),
                    pageSize: Math.min(optionalNumber(args, "pageSize", 32), 100),
                    paths: Array.isArray(args.paths) ? args.paths : [],
                    types: args.types,
                    method: optionalNumber(args, "method", 0),
                    orderBy: optionalNumber(args, "orderBy", 0),
                    groupBy: optionalNumber(args, "groupBy", 0),
                }));
            case "sql_query": {
                return success(await client.json("/api/query/sql", {
                    stmt: requiredString(args, "sql"),
                }));
            }
            case "flush_transaction":
                return success(await client.json("/api/sqlite/flushTransaction"));
            case "create_database": {
                const parentID = requiredString(args, "parentID");
                const avID = createNodeId();
                const dom = `<div data-type="NodeAttributeView" data-av-id="${avID}" data-av-type="table"></div>`;
                let blockID;
                try {
                    const inserted = await client.json("/api/block/appendBlock", {
                        dataType: "dom",
                        data: dom,
                        parentID,
                    });
                    blockID = findInsertedBlockId(inserted);
                    if (!blockID)
                        throw new Error("无法从插入事务中取得数据库块 ID");
                    await client.json("/api/av/renderAttributeView", {
                        id: avID,
                        blockID,
                        page: 1,
                        pageSize: 50,
                        createIfNotExist: true,
                    });
                    const nameArg = optionalString(args, "name");
                    if (nameArg)
                        await renameDatabase(client, avID, nameArg);
                    if (Array.isArray(args.columns)) {
                        let previousKeyID = "";
                        for (const rawColumn of args.columns) {
                            const column = asArguments(rawColumn);
                            const keyID = createNodeId();
                            await client.json("/api/av/addAttributeViewKey", {
                                avID,
                                keyID,
                                keyName: requiredString(column, "name"),
                                keyType: requiredString(column, "type"),
                                keyIcon: optionalString(column, "icon") || "",
                                previousKeyID,
                            });
                            previousKeyID = keyID;
                        }
                    }
                    const view = await client.json("/api/av/renderAttributeView", {
                        id: avID,
                        blockID,
                        page: 1,
                        pageSize: 50,
                        createIfNotExist: true,
                    });
                    return success({ avID, blockID, view });
                }
                catch (error) {
                    if (blockID) {
                        try {
                            await client.json("/api/block/deleteBlock", { id: blockID });
                        }
                        catch {
                            // Preserve the original error; the block ID is included below for manual cleanup.
                        }
                    }
                    throw new Error(`${error instanceof Error ? error.message : String(error)}${blockID ? `（数据库块 ${blockID} 已尝试回滚）` : ""}`);
                }
            }
            case "get_database":
                return success(await renderDatabase(client, args));
            case "get_database_keys":
                return success(await client.json("/api/av/getAttributeViewKeysByAvID", {
                    avID: requiredString(args, "avID"),
                }));
            case "rename_database":
                return success(await renameDatabase(client, requiredString(args, "avID"), requiredString(args, "name")));
            case "add_database_column": {
                const keyID = createNodeId();
                await client.json("/api/av/addAttributeViewKey", {
                    avID: requiredString(args, "avID"),
                    keyID,
                    keyName: requiredString(args, "name"),
                    keyType: requiredString(args, "type"),
                    keyIcon: optionalString(args, "icon") || "",
                    previousKeyID: optionalString(args, "previousKeyID") || "",
                });
                return success({ keyID });
            }
            case "remove_database_column":
                requireDestructive();
                return success(await client.json("/api/av/removeAttributeViewKey", {
                    avID: requiredString(args, "avID"),
                    keyID: requiredString(args, "keyID"),
                    removeRelationDest: args.removeRelationDest === true,
                }));
            case "append_database_rows": {
                const avID = requiredString(args, "avID");
                const titles = stringArray(requiredArray(args, "titles"), "titles");
                const rawAv = await client.json("/api/av/getAttributeView", { id: avID });
                const primary = rawAv.av?.keyValues?.find((item) => item.key?.type === "block")?.key;
                if (!primary?.id)
                    throw new Error("数据库主键字段不存在");
                await client.json("/api/av/appendAttributeViewDetachedBlocksWithValues", {
                    avID,
                    blocksValues: titles.map((title) => [{
                            keyID: primary.id,
                            block: { content: title },
                        }]),
                });
                const view = await client.json("/api/av/renderAttributeView", {
                    id: avID,
                    blockID: optionalString(args, "blockID"),
                    viewID: optionalString(args, "viewID"),
                    page: 1,
                    pageSize: Math.max(50, titles.length),
                    createIfNotExist: false,
                });
                return success({ added: titles.length, view });
            }
            case "set_database_cell":
                return success(await client.json("/api/av/setAttributeViewBlockAttr", {
                    avID: requiredString(args, "avID"),
                    keyID: requiredString(args, "keyID"),
                    itemID: requiredString(args, "itemID"),
                    value: args.value,
                }));
            case "batch_set_database_cells":
                return success(await client.json("/api/av/batchSetAttributeViewBlockAttrs", {
                    avID: requiredString(args, "avID"),
                    values: requiredArray(args, "values"),
                }));
            case "remove_database_rows":
                requireDestructive();
                return success(await client.json("/api/av/removeAttributeViewBlocks", {
                    avID: requiredString(args, "avID"),
                    srcIDs: requiredArray(args, "itemIDs"),
                }));
            case "get_file":
                return success(await client.file("/api/file/getFile", { path: requiredString(args, "path") }));
            case "put_file": {
                requireDestructive();
                const targetPath = requiredString(args, "path");
                assertWritableWorkspacePath(targetPath);
                const fields = { path: targetPath };
                if (typeof args.isDir === "boolean")
                    fields.isDir = String(args.isDir);
                if (typeof args.modTime === "number")
                    fields.modTime = String(args.modTime);
                const files = [];
                if (typeof args.filePath === "string") {
                    files.push({
                        field: "file",
                        filePath: args.filePath,
                        fileName: optionalString(args, "fileName"),
                        mimeType: optionalString(args, "mimeType"),
                    });
                }
                else if (typeof args.contentBase64 === "string") {
                    files.push({
                        field: "file",
                        data: Buffer.from(args.contentBase64, "base64"),
                        fileName: optionalString(args, "fileName") || "file",
                        mimeType: optionalString(args, "mimeType"),
                    });
                }
                else if (typeof args.file === "string") {
                    files.push({
                        field: "file",
                        data: new TextEncoder().encode(args.file),
                        fileName: optionalString(args, "fileName") || "file.txt",
                        mimeType: optionalString(args, "mimeType") || "text/plain",
                    });
                }
                else if (args.isDir !== true) {
                    throw new Error("写入文件时需要 filePath、file 或 contentBase64");
                }
                return success(await client.multipart("/api/file/putFile", fields, files));
            }
            case "remove_file": {
                requireDestructive();
                const workspacePath = requiredString(args, "path");
                assertWritableWorkspacePath(workspacePath);
                return success(await client.json("/api/file/removeFile", { path: workspacePath }));
            }
            case "rename_file": {
                requireDestructive();
                const workspacePath = requiredString(args, "path");
                const newPath = requiredString(args, "newPath");
                assertWritableWorkspacePath(workspacePath);
                assertWritableWorkspacePath(newPath);
                return success(await client.json("/api/file/renameFile", { path: workspacePath, newPath }));
            }
            case "read_dir":
                return success(await client.json("/api/file/readDir", { path: requiredString(args, "path") }));
            case "upload_asset": {
                const filePaths = stringArray(requiredArray(args, "files"), "files");
                return success(await client.multipart("/api/asset/upload", { assetsDirPath: requiredString(args, "assetsDirPath") }, filePaths.map((filePath) => ({ field: "file[]", filePath }))));
            }
            case "export_md_content":
                return success(await client.json("/api/export/exportMdContent", { id: requiredString(args, "id") }));
            case "export_resources":
                return success(await client.json("/api/export/exportResources", {
                    paths: requiredArray(args, "paths"),
                    name: optionalString(args, "name"),
                }));
            case "push_msg":
                return success(await client.json("/api/notification/pushMsg", {
                    msg: requiredString(args, "msg"),
                    timeout: args.timeout,
                }));
            case "push_err_msg":
                return success(await client.json("/api/notification/pushErrMsg", {
                    msg: requiredString(args, "msg"),
                    timeout: args.timeout,
                }));
            case "get_version":
                return success(await client.json("/api/system/version"));
            case "get_current_time":
                return success(await client.json("/api/system/currentTime"));
            case "get_boot_progress":
                return success(await client.json("/api/system/bootProgress"));
            case "check_siyuan_status": {
                const [version, notebooks, sql] = await Promise.all([
                    client.json("/api/system/version"),
                    client.json("/api/notebook/lsNotebooks"),
                    client.json("/api/query/sql", { stmt: "SELECT 1 LIMIT 1" }),
                ]);
                return success({
                    ok: true,
                    version,
                    notebookCount: notebooks.notebooks.length,
                    sql,
                    connection: client.connectionInfo(),
                });
            }
            case "get_workspace_info":
                return success({
                    connection: client.connectionInfo(),
                    safety: {
                        destructiveOperationsEnabled: !envBoolean("SIYUAN_MCP_PROTECT_DESTRUCTIVE"),
                        destructiveProtectionEnabled: envBoolean("SIYUAN_MCP_PROTECT_DESTRUCTIVE"),
                        sqlRestrictionsEnabled: false,
                        remoteHttpAllowed: true,
                        writePathPrefixes: allowedWritePrefixes(),
                    },
                });
            case "render_template":
                return success(await client.json("/api/template/render", {
                    id: requiredString(args, "id"),
                    path: requiredString(args, "path"),
                }));
            case "render_sprig":
                return success(await client.json("/api/template/renderSprig", {
                    template: requiredString(args, "template"),
                }));
            case "pandoc_convert":
                return success(await client.json("/api/convert/pandoc", {
                    dir: requiredString(args, "dir"),
                    args: requiredArray(args, "args"),
                }));
            default:
                throw new Error(`未知工具：${name}`);
        }
    }
    catch (error) {
        const detail = error instanceof SiyuanApiError
            ? {
                error: error.message,
                endpoint: error.endpoint,
                code: error.code,
                status: error.status,
            }
            : { error: error instanceof Error ? error.message : String(error) };
        return {
            isError: true,
            content: [{ type: "text", text: serialize(detail) }],
            structuredContent: detail,
        };
    }
}
