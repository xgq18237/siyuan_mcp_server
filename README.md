# SiYuan MCP Server

一个面向 AI 客户端的思源笔记 MCP 服务器。它提供结构化返回、原生数据库操作、全文搜索、正确的 Multipart/二进制传输，以及默认开启的安全护栏。

## 快速开始

要求 Node.js 18 或更高版本，并确保思源正在运行。

```bash
npx -y siyuan-mcp@latest
```

MCP 客户端配置示例：

```json
{
  "mcpServers": {
    "siyuan_note": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp@latest"],
      "env": {
        "SIYUAN_URL": "http://127.0.0.1:6806",
        "SIYUAN_TOKEN": "在思源「设置 → 关于」中取得的 API 令牌"
      }
    }
  }
}
```

本地回环地址允许 HTTP。远程实例必须使用 HTTPS；若确实需要明文远程连接，显式设置 `SIYUAN_MCP_ALLOW_INSECURE_REMOTE=1`。

## 主要能力

- 笔记本、文档、块和属性 CRUD
- 文档树浏览、标题搜索、全文块搜索
- 批量插入和批量更新块
- 原生数据库创建、初始化、命名、字段、条目和单元格操作
- Markdown、模板、Sprig、Pandoc 和导出
- 正确的 Multipart 资源上传与文件写入
- 文本、JSON 和二进制文件读取
- 结构化 MCP 返回与 `isError` 错误语义
- 工具安全注解、危险操作开关、只读 SQL 和输出上限

项目选择性封装适合 AI 使用的思源接口，并不宣称覆盖全部内核私有 API。

## 数据库工具

- `create_database`：插入 AV 块并通过 `renderAttributeView` 初始化存储
- `get_database`：分页渲染数据库
- `get_database_keys`
- `rename_database`
- `add_database_column`
- `remove_database_column`
- `append_database_rows`
- `set_database_cell`
- `batch_set_database_cells`
- `remove_database_rows`

`set_database_cell` 和批量版本中的 `value` 使用思源 AV Value JSON 结构。创建普通非绑定条目时，优先使用更简单的 `append_database_rows`。

## 安全配置

危险删除和覆盖操作默认关闭：

```text
SIYUAN_MCP_ALLOW_DESTRUCTIVE=1
```

默认只允许 `SELECT`/CTE SQL，并自动添加行数限制。需要绕过时：

```text
SIYUAN_MCP_ALLOW_UNSAFE_SQL=1
```

默认工作空间写入路径为 `/data/assets` 和 `/temp`：

```text
SIYUAN_MCP_WRITE_PATH_PREFIXES=/data/assets,/temp
```

本地文件上传默认只允许 MCP 进程当前目录。多个目录使用操作系统路径分隔符连接：

```text
SIYUAN_MCP_UPLOAD_ROOTS=C:\Users\me\Pictures;C:\Users\me\Documents
```

其他配置：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `SIYUAN_URL` | — | 完整思源 URL，优先于 HOST/PORT |
| `SIYUAN_HOST` | `127.0.0.1` | 思源主机 |
| `SIYUAN_PORT` | `6806` | 思源端口 |
| `SIYUAN_TOKEN` | 空 | API 令牌 |
| `SIYUAN_MCP_TIMEOUT_MS` | `20000` | 单次请求超时 |
| `SIYUAN_MCP_MAX_RESPONSE_BYTES` | `10485760` | 最大响应字节数 |
| `SIYUAN_MCP_MAX_TEXT_CHARS` | `30000` | MCP 文本预览上限 |
| `SIYUAN_MCP_SQL_MAX_ROWS` | `200` | SQL 默认最大行数 |
| `SIYUAN_MCP_DEBUG` | `0` | 仅向 stderr 输出端点、状态和耗时，不输出笔记内容 |

## Docker

本项目使用 MCP stdio 传输，因此容器必须由 MCP 客户端以前台交互模式启动。不要把它作为无输入输出的后台服务运行。

```json
{
  "mcpServers": {
    "siyuan_note": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "SIYUAN_HOST=host.docker.internal",
        "-e", "SIYUAN_PORT=6806",
        "-e", "SIYUAN_TOKEN",
        "siyuan-mcp-server"
      ],
      "env": {
        "SIYUAN_TOKEN": "你的 API 令牌"
      }
    }
  }
}
```

构建：

```bash
docker build -t siyuan-mcp-server .
```

`docker compose run --rm siyuan-mcp-server` 可用于手工连通性检查，但常规使用应由 MCP 客户端直接启动容器。

## 开发和测试

```bash
npm ci
npm run check
npm test
```

`npm test` 会执行严格类型检查并重新构建发布产物。涉及真实思源数据的集成验证应在隔离笔记本中进行。

## 发布约束

- `src/` 是唯一源码来源，`dist/` 由 `npm run build` 生成。
- `prepublishOnly` 会执行类型检查和构建检查。
- 调试信息只写 stderr，stdout 始终保留给 MCP JSON-RPC。

## License

MIT
