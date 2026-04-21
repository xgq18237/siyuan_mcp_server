# 思源笔记 MCP 服务器 / SiYuan MCP Server

<div align="center">

[English](#english-version) | [中文](#中文版本)

</div>

---

## English Version

A Model Context Protocol (MCP) server for SiYuan Note, providing complete SiYuan API functionality.

### 🚀 Quick Start

#### Using npx (Recommended)
```bash
# Run directly (local SiYuan)
npx -y siyuan-mcp@latest

# Set environment variables for local access
SIYUAN_HOST=127.0.0.1 SIYUAN_PORT=6806 SIYUAN_TOKEN=your-token npx -y siyuan-mcp@latest

# For remote SiYuan behind HTTPS reverse proxy
SIYUAN_URL=https://siyuan.example.com SIYUAN_TOKEN=your-token npx -y siyuan-mcp@latest
```

#### Using Docker
```bash
# Pull image
docker pull zhizhiqq/siyuan-mcp:latest

# Run container
docker run -d \
  -e SIYUAN_HOST=127.0.0.1 \
  -e SIYUAN_PORT=6806 \
  -e SIYUAN_TOKEN=your-token \
  --name siyuan-mcp-server \
  zhizhiqq/siyuan-mcp:latest
```

#### Configure MCP Client

##### Cursor Configuration
1. Open Cursor settings (Ctrl/Cmd + ,)
2. Search for "MCP" or "Model Context Protocol"
3. Click "Add Server" or "添加服务器"
4. Configure server information:
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp@latest"],
      "env": {
        "SIYUAN_HOST": "127.0.0.1",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

##### Claude Desktop Configuration
1. Open Claude Desktop settings
2. Go to "Model Context Protocol" settings
3. Add new MCP server:
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp@latest"],
      "env": {
        "SIYUAN_HOST": "127.0.0.1",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

##### Remote Access via HTTPS (Reverse Proxy)
If your SiYuan instance is behind a reverse proxy (e.g., Traefik, nginx) with HTTPS:
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp@latest"],
      "env": {
        "SIYUAN_URL": "https://siyuan.example.com",
        "SIYUAN_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

##### Docker Configuration
If you use Docker to run the service, you can configure the client to connect to the Docker container:

**Cursor Docker Configuration**
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-e", "SIYUAN_HOST=127.0.0.1", "-e", "SIYUAN_PORT=6806", "-e", "SIYUAN_TOKEN=your-api-token-here", "zhizhiqq/siyuan-mcp:latest"],
      "env": {}
    }
  }
}
```

**Claude Desktop Docker Configuration**
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-e", "SIYUAN_HOST=127.0.0.1", "-e", "SIYUAN_PORT=6806", "-e", "SIYUAN_TOKEN=your-api-token-here", "zhizhiqq/siyuan-mcp:latest"],
      "env": {}
    }
  }
}
```

**Note**: When using Docker configuration, ensure Docker is installed and running.

### 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SIYUAN_URL` | Full URL for SiYuan (e.g., `https://siyuan.example.com`). If set, overrides HOST/PORT. | - | No |
| `SIYUAN_HOST` | SiYuan server address | 127.0.0.1 | No |
| `SIYUAN_PORT` | SiYuan server port | 6806 | No |
| `SIYUAN_TOKEN` | API token | - | Yes |

**Note**: Use `SIYUAN_URL` when connecting to a SiYuan instance behind an HTTPS reverse proxy. When `SIYUAN_URL` is set, `SIYUAN_HOST` and `SIYUAN_PORT` are ignored.

### 📋 Common Issues

#### Q: What if the connection fails?
**A:** Please check the following steps:
1. Ensure SiYuan Note is running
2. Check if the API token is correct
3. Confirm there are open notebooks in SiYuan Note
4. Restart SiYuan Note and Cursor

#### Q: How to get the correct API token?
**A:** 
1. Open SiYuan Note
2. Go to `Settings` → `About` → `API Token`
3. Click `Generate Token` or copy existing token
4. Ensure the token format is correct (usually a string of alphanumeric characters)

#### Q: Why use `-y` parameter with npx?
**A:** The `-y` parameter automatically confirms package installation without prompting for user input, which is essential for MCP client configurations where interactive prompts would cause connection failures.

#### Q: How to connect to SiYuan behind a reverse proxy with HTTPS?
**A:** Use the `SIYUAN_URL` environment variable instead of `SIYUAN_HOST` and `SIYUAN_PORT`:
```bash
SIYUAN_URL=https://siyuan.example.com SIYUAN_TOKEN=your-token npx -y siyuan-mcp@latest
```

### 🎯 Features

#### 📚 Notebook Management
Notebooks are the basic organizational units of SiYuan Note, each containing multiple documents.

- **`list_notebooks`** - List all notebooks, get notebook IDs and names
- **`open_notebook`** - Open specified notebook, activate workspace
- **`close_notebook`** - Close specified notebook, release resources
- **`rename_notebook`** - Rename notebook, update display name
- **`create_notebook`** - Create new notebook, support custom names
- **`remove_notebook`** - Delete notebook, clean related data
- **`get_notebook_conf`** - Get notebook configuration information
- **`set_notebook_conf`** - Save notebook configuration, custom settings

#### 📄 Document Management
Documents are specific content units in notebooks, supporting hierarchical structure and path management.

- **`create_doc`** - Create new document in specified notebook, support Markdown content
- **`rename_doc`** - Rename document, keep content unchanged
- **`rename_doc_by_id`** - Rename by document ID, precise operation
- **`remove_doc`** - Delete document, clean file system
- **`remove_doc_by_id`** - Delete by document ID, precise operation
- **`move_docs`** - Move documents to other locations or notebooks
- **`move_docs_by_id`** - Move by document ID, precise operation
- **`get_hpath_by_path`** - Get human-readable path by path
- **`get_hpath_by_id`** - Get human-readable path by ID
- **`get_path_by_id`** - Get storage path by ID
- **`get_ids_by_hpath`** - Get IDs by human-readable path

#### 🧩 Block Operations
Blocks are the smallest content units in SiYuan Note, supporting flexible editing, reorganization, and referencing.

- **`insert_block`** - Insert block, support specified position and data type
- **`prepend_block`** - Insert prepend child block, add content at parent block beginning
- **`append_block`** - Insert append child block, add content at parent block end
- **`update_block`** - Update block content, support Markdown and DOM formats
- **`delete_block`** - Delete block, clean related references
- **`move_block`** - Move block to new position, support hierarchical adjustment
- **`get_block_kramdown`** - Get block kramdown source code, for export
- **`get_child_blocks`** - Get child block list, traverse block structure
- **`fold_block`** - Fold block, hide child content
- **`unfold_block`** - Unfold block, show child content
- **`transfer_block_ref`** - Transfer block reference, maintain reference relationships

#### 🏷️ Attribute Operations
Block attributes are used to store metadata and custom information, supporting key-value pair storage.

- **`set_block_attrs`** - Set block attributes, support custom key-value pairs
- **`get_block_attrs`** - Get block attributes, read metadata information

#### 🔍 Search and Query
Get data from SiYuan Note through SQL queries, supporting complex query conditions.

- **`sql_query`** - Execute SQL queries, support all SQLite syntax
- **`flush_transaction`** - Commit transactions, ensure data persistence

#### 📁 File Operations
Manage files and directories in SiYuan Note workspace, support resource management.

- **`get_file`** - Get file content, read file data
- **`remove_file`** - Delete file, clean storage space
- **`rename_file`** - Rename file, update file path
- **`read_dir`** - List directory content, browse file structure
- **`put_file`** - Write file, create or update file content

#### 📤 Export Functions
Export SiYuan Note content to various formats, support backup and sharing.

- **`export_md_content`** - Export Markdown text, maintain format
- **`export_resources`** - Export files and directories, include resource files

#### 📢 Notification Functions
Push messages and error prompts to users, provide operation feedback.

- **`push_msg`** - Push messages, display success prompts
- **`push_err_msg`** - Push error messages, display error information

#### 💻 System Information
Get SiYuan Note system status and runtime information, monitor system health.

- **`get_version`** - Get SiYuan Note version information
- **`get_current_time`** - Get system current time
- **`get_boot_progress`** - Get boot progress, monitor boot status
- **`check_siyuan_status`** - Check SiYuan Note status and API availability
- **`get_workspace_info`** - Get workspace and connection information

#### 🎨 Template Functions
Use template system to create dynamic content, support variable substitution.

- **`render_template`** - Render template files, support external templates
- **`render_sprig`** - Render Sprig templates, support inline template syntax

#### 🔄 Conversion Functions
Use Pandoc for document format conversion, support multiple output formats.

- **`pandoc_convert`** - Pandoc conversion, support multiple document formats

#### 📎 Resource Files
Manage resource files in SiYuan Note, support batch upload.

- **`upload_asset`** - Upload resource files, support batch operations

### 🔧 Core Features

#### 🚀 High Performance
- **Asynchronous Processing**: All API calls use asynchronous processing for faster response
- **Batch Operations**: Support batch document movement and block operations for improved efficiency
- **Transaction Management**: Built-in transaction mechanism ensures data consistency

#### 🛡️ Secure and Reliable
- **Authentication**: Support API token authentication to protect data security
- **Error Handling**: Comprehensive error handling mechanism provides detailed error information
- **Parameter Validation**: Strict parameter validation prevents invalid operations

#### 🔌 Easy Integration
- **MCP Protocol**: Based on Model Context Protocol, easy to integrate with AI tools
- **Standard Interface**: Follows SiYuan Note official API specifications
- **Multi-language Support**: Supports Chinese and English documentation and error messages

#### 📊 Data Management
- **Complete CRUD**: Support create, read, update, delete for all data types
- **Hierarchical Structure**: Support hierarchical organization of documents and blocks
- **Reference System**: Support block references and transfers, maintain data relationships

#### 🎯 Developer Friendly
- **Optional HTTP debug**: Set `SIYUAN_MCP_DEBUG=1` to log each SiYuan API call to **stderr** (never stdout—stdio MCP requires stdout to be JSON-RPC only)
- **Status Checking**: Built-in connection status checking for quick problem diagnosis
- **Rich Examples**: Provide complete usage examples and best practices

### 📊 API Statistics

- **Total APIs**: 49
- **Feature Modules**: 12
- **Supported Operations**: Complete SiYuan Note API functionality
- **Coverage**: 100% SiYuan Note official API (except network APIs)

### 📚 Usage Examples

**List all notebooks**
```json
{
  "name": "list_notebooks",
  "arguments": {}
}
```

**Create new document**
```json
{
  "name": "create_doc",
  "arguments": {
    "notebook": "20241009135857-599ipbh",
    "path": "/daily/2025-01-15",
    "markdown": "# Today's Summary\n\nToday I completed the following work:\n- Project development\n- Document writing"
  }
}
```

**Query recently created documents**
```json
{
  "name": "sql_query",
  "arguments": {
    "sql": "SELECT * FROM blocks WHERE type = 'd' ORDER BY created DESC LIMIT 5"
  }
}
```

**Find blocks with specific tags**
```json
{
  "name": "sql_query",
  "arguments": {
    "sql": "SELECT * FROM blocks WHERE content LIKE '%#important%' OR content LIKE '%#urgent%'"
  }
}
```

**Insert block**
```json
{
  "name": "insert_block",
  "arguments": {
    "data": "This is new block content",
    "dataType": "markdown",
    "parentID": "20250803150424-tu1cl78"
  }
}
```

### 📚 Development Resources

#### Related Links
- [SiYuan Note Official Documentation](https://b3log.org/siyuan/)
- [SiYuan Note Download](https://b3log.org/siyuan/download.html)
- [SiYuan Note API Documentation](https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md)
- [Model Context Protocol](https://modelcontextprotocol.io/)

#### Community Support
- [SiYuan Note Community](https://b3log.org/siyuan/)
- [GitHub Issues](https://github.com/xgq18237/siyuan_mcp_server/issues)

#### Technology Stack
- **Language**: TypeScript/JavaScript
- **Protocol**: Model Context Protocol (MCP)
- **Framework**: @modelcontextprotocol/sdk
- **Deployment**: Docker, Node.js
- **Database**: SQLite (via SiYuan Note)

#### Development Tools
- **Editor**: VS Code, Cursor
- **Build Tool**: TypeScript Compiler
- **Package Manager**: npm
- **Containerization**: Docker, Docker Compose

### 🔧 Advanced Features

#### 1. Template System
Use `render_template` and `render_sprig` to create dynamic content:
```json
{
  "name": "render_sprig",
  "arguments": {
    "template": "Hello {{.name}}! Today is {{.date}}."
  }
}
```

#### 2. File Management
Use file operation APIs to manage attachments and resources:
```json
{
  "name": "upload_asset",
  "arguments": {
    "assetsDirPath": "/assets",
    "files": ["image1.jpg", "document.pdf"]
  }
}
```

#### 3. Data Export
Use export functions to backup and share content:
```json
{
  "name": "export_md_content",
  "arguments": {
    "id": "20250115123456-abcdef"
  }
}
```

### 🛠️ Local Development

#### Global Installation
```bash
npm install -g siyuan-mcp
siyuan-mcp
```

#### Environment Requirements
- Node.js >= 18.0.0
- npm or yarn
- Git

#### Clone Project
```bash
git clone https://github.com/xgq18237/siyuan_mcp_server.git
cd siyuan_mcp_server
```

#### Install Dependencies
```bash
npm install
```

#### Build Project
```bash
npm run build
```

#### Development Mode
```bash
npm run dev
```

#### Start Server
```bash
npm start
```

#### Docker Local Deployment

1. **Build Image**
```bash
docker build -t siyuan-mcp-server .
```

2. **Run Container**
```bash
docker run -d \
  -e SIYUAN_HOST=127.0.0.1 \
  -e SIYUAN_PORT=6806 \
  -e SIYUAN_TOKEN=your-token \
  --name siyuan-mcp-server \
  siyuan-mcp-server
```

3. **Using Docker Compose**
```bash
# Configure environment variables
cp env.example .env
# Edit .env file

# Start service
docker-compose up -d
```

### 📄 License

MIT License

---

**[⬆ Back to Top](#思源笔记-mcp-服务器--siyuan-mcp-server)**

---

## 中文版本

这是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的思源笔记服务器，提供了完整的思源笔记 API 功能。

### 🚀 快速开始

#### 使用 npx（推荐）
```bash
# 直接运行（本地思源）
npx -y siyuan-mcp@latest

# 设置环境变量（本地访问）
SIYUAN_HOST=127.0.0.1 SIYUAN_PORT=6806 SIYUAN_TOKEN=your-token npx -y siyuan-mcp@latest

# 远程访问（HTTPS 反向代理后的思源）
SIYUAN_URL=https://siyuan.example.com SIYUAN_TOKEN=your-token npx -y siyuan-mcp@latest
```

#### 使用 Docker
```bash
# 拉取镜像
docker pull zhizhiqq/siyuan-mcp:latest

# 运行容器
docker run -d \
  -e SIYUAN_HOST=127.0.0.1 \
  -e SIYUAN_PORT=6806 \
  -e SIYUAN_TOKEN=your-token \
  --name siyuan-mcp-server \
  zhizhiqq/siyuan-mcp:latest
```

#### 配置 MCP 客户端

##### Cursor 配置
1. 打开 Cursor 设置（Ctrl/Cmd + ,）
2. 搜索 "MCP" 或 "Model Context Protocol"
3. 点击 "Add Server" 或 "添加服务器"
4. 配置服务器信息：
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp@latest"],
      "env": {
        "SIYUAN_HOST": "127.0.0.1",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

##### Claude Desktop 配置
1. 打开 Claude Desktop 设置
2. 进入 "Model Context Protocol" 设置
3. 添加新的 MCP 服务器：
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp@latest"],
      "env": {
        "SIYUAN_HOST": "127.0.0.1",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

##### 通过 HTTPS 远程访问（反向代理）
如果你的思源实例在反向代理（如 Traefik、nginx）后面使用 HTTPS：
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp@latest"],
      "env": {
        "SIYUAN_URL": "https://siyuan.example.com",
        "SIYUAN_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

##### Docker 配置
如果你使用 Docker 运行服务，可以配置客户端连接到 Docker 容器：

**Cursor Docker 配置**
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-e", "SIYUAN_HOST=127.0.0.1", "-e", "SIYUAN_PORT=6806", "-e", "SIYUAN_TOKEN=your-api-token-here", "zhizhiqq/siyuan-mcp:latest"],
      "env": {}
    }
  }
}
```

**Claude Desktop Docker 配置**
```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-e", "SIYUAN_HOST=127.0.0.1", "-e", "SIYUAN_PORT=6806", "-e", "SIYUAN_TOKEN=your-api-token-here", "zhizhiqq/siyuan-mcp:latest"],
      "env": {}
    }
  }
}
```

**注意**：使用 Docker 配置时，确保 Docker 已安装并正在运行。

### 🔧 环境变量配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `SIYUAN_URL` | 思源完整 URL（如 `https://siyuan.example.com`）。设置后会覆盖 HOST/PORT | - | 否 |
| `SIYUAN_HOST` | 思源笔记服务器地址 | 127.0.0.1 | 否 |
| `SIYUAN_PORT` | 思源笔记服务器端口 | 6806 | 否 |
| `SIYUAN_TOKEN` | API 令牌 | - | 是 |

**注意**：当连接到 HTTPS 反向代理后的思源实例时，请使用 `SIYUAN_URL`。设置 `SIYUAN_URL` 后，`SIYUAN_HOST` 和 `SIYUAN_PORT` 将被忽略。

### 📋 常见问题

#### Q: 连接失败怎么办？
**A:** 请按以下步骤检查：
1. 确保思源笔记正在运行
2. 检查 API 令牌是否正确
3. 确认思源笔记中有打开的笔记本
4. 重启思源笔记和 Cursor

#### Q: 如何获取正确的 API 令牌？
**A:** 
1. 打开思源笔记
2. 进入 `设置` → `关于` → `API 令牌`
3. 点击 `生成令牌` 或复制现有令牌
4. 确保令牌格式正确（通常是一串字母数字组合）

#### Q: 为什么使用 `-y` 参数？
**A:** `-y` 参数可以自动确认包安装，无需用户交互确认，这对于 MCP 客户端配置非常重要，因为交互式提示会导致连接失败。

#### Q: 如何连接到 HTTPS 反向代理后的思源？
**A:** 使用 `SIYUAN_URL` 环境变量代替 `SIYUAN_HOST` 和 `SIYUAN_PORT`：
```bash
SIYUAN_URL=https://siyuan.example.com SIYUAN_TOKEN=your-token npx -y siyuan-mcp@latest
```

### 🎯 功能特性

#### 📚 笔记本管理
笔记本是思源笔记的基本组织单位，每个笔记本包含多个文档。

- **`list_notebooks`** - 列出所有笔记本，获取笔记本ID和名称
- **`open_notebook`** - 打开指定笔记本，激活工作空间
- **`close_notebook`** - 关闭指定笔记本，释放资源
- **`rename_notebook`** - 重命名笔记本，更新显示名称
- **`create_notebook`** - 创建新笔记本，支持自定义名称
- **`remove_notebook`** - 删除笔记本，清理相关数据
- **`get_notebook_conf`** - 获取笔记本配置信息
- **`set_notebook_conf`** - 保存笔记本配置，自定义设置

#### 📄 文档管理
文档是笔记本中的具体内容单元，支持层级结构和路径管理。

- **`create_doc`** - 在指定笔记本中新建文档，支持Markdown内容
- **`rename_doc`** - 重命名文档，保持内容不变
- **`rename_doc_by_id`** - 根据文档ID重命名，精确操作
- **`remove_doc`** - 删除文档，清理文件系统
- **`remove_doc_by_id`** - 根据文档ID删除，精确操作
- **`move_docs`** - 移动文档到其他位置或笔记本
- **`move_docs_by_id`** - 根据文档ID移动，精确操作
- **`get_hpath_by_path`** - 根据路径获取人类可读路径
- **`get_hpath_by_id`** - 根据ID获取人类可读路径
- **`get_path_by_id`** - 根据ID获取存储路径
- **`get_ids_by_hpath`** - 根据人类可读路径获取IDs

#### 🧩 块操作
块是思源笔记的最小内容单位，支持灵活的编辑、重组和引用。

- **`insert_block`** - 插入块，支持指定位置和数据类型
- **`prepend_block`** - 插入前置子块，在父块开头添加内容
- **`append_block`** - 插入后置子块，在父块末尾添加内容
- **`update_block`** - 更新块内容，支持Markdown和DOM格式
- **`delete_block`** - 删除块，清理相关引用
- **`move_block`** - 移动块到新位置，支持层级调整
- **`get_block_kramdown`** - 获取块kramdown源码，用于导出
- **`get_child_blocks`** - 获取子块列表，遍历块结构
- **`fold_block`** - 折叠块，隐藏子内容
- **`unfold_block`** - 展开块，显示子内容
- **`transfer_block_ref`** - 转移块引用，维护引用关系

#### 🏷️ 属性操作
块属性用于存储元数据和自定义信息，支持键值对存储。

- **`set_block_attrs`** - 设置块属性，支持自定义键值对
- **`get_block_attrs`** - 获取块属性，读取元数据信息

#### 🔍 搜索和查询
通过SQL查询获取思源笔记中的数据，支持复杂查询条件。

- **`sql_query`** - 执行SQL查询，支持所有SQLite语法
- **`flush_transaction`** - 提交事务，确保数据持久化

#### 📁 文件操作
管理思源笔记工作空间中的文件和目录，支持资源管理。

- **`get_file`** - 获取文件内容，读取文件数据
- **`remove_file`** - 删除文件，清理存储空间
- **`rename_file`** - 重命名文件，更新文件路径
- **`read_dir`** - 列出目录内容，浏览文件结构
- **`put_file`** - 写入文件，创建或更新文件内容

#### 📤 导出功能
将思源笔记内容导出为各种格式，支持备份和分享。

- **`export_md_content`** - 导出Markdown文本，保持格式
- **`export_resources`** - 导出文件与目录，包含资源文件

#### 📢 通知功能
向用户推送消息和错误提示，提供操作反馈。

- **`push_msg`** - 推送消息，显示成功提示
- **`push_err_msg`** - 推送错误消息，显示错误信息

#### 💻 系统信息
获取思源笔记系统状态和运行信息，监控系统健康。

- **`get_version`** - 获取思源笔记版本信息
- **`get_current_time`** - 获取系统当前时间
- **`get_boot_progress`** - 获取启动进度，监控启动状态
- **`check_siyuan_status`** - 检查思源笔记状态和API可用性
- **`get_workspace_info`** - 获取工作空间和连接信息

#### 🎨 模板功能
使用模板系统创建动态内容，支持变量替换。

- **`render_template`** - 渲染模板文件，支持外部模板
- **`render_sprig`** - 渲染Sprig模板，支持内联模板语法

#### 🔄 转换功能
使用Pandoc进行文档格式转换，支持多种输出格式。

- **`pandoc_convert`** - Pandoc转换，支持多种文档格式

#### 📎 资源文件
管理思源笔记中的资源文件，支持批量上传。

- **`upload_asset`** - 上传资源文件，支持批量操作

### 🔧 核心特性

#### 🚀 高性能
- **异步处理**: 所有API调用采用异步处理，提高响应速度
- **批量操作**: 支持批量文档移动和块操作，提升效率
- **事务管理**: 内置事务机制，确保数据一致性

#### 🛡️ 安全可靠
- **身份验证**: 支持API令牌认证，保护数据安全
- **错误处理**: 完善的错误处理机制，提供详细错误信息
- **参数验证**: 严格的参数验证，防止无效操作

#### 🔌 易于集成
- **MCP协议**: 基于Model Context Protocol，易于与AI工具集成
- **标准接口**: 遵循思源笔记官方API规范
- **多语言支持**: 支持中英文文档和错误信息

#### 📊 数据管理
- **完整CRUD**: 支持创建、读取、更新、删除所有数据类型
- **层级结构**: 支持文档和块的层级组织
- **引用系统**: 支持块引用和转移，维护数据关系

#### 🎯 开发友好
- **详细日志**: 提供详细的API调用日志，便于调试
- **状态检查**: 内置连接状态检查，快速诊断问题
- **示例丰富**: 提供完整的使用示例和最佳实践

### 📊 接口统计

- **总接口数**: 49个
- **功能模块**: 12个
- **支持的操作**: 完整的思源笔记API功能
- **覆盖范围**: 100%思源笔记官方API（除网络接口外）

### 📚 使用示例

**列出所有笔记本**
```json
{
  "name": "list_notebooks",
  "arguments": {}
}
```

**创建新文档**
```json
{
  "name": "create_doc",
  "arguments": {
    "notebook": "20241009135857-599ipbh",
    "path": "/daily/2025-01-15",
    "markdown": "# 今日总结\n\n今天完成了以下工作：\n- 项目开发\n- 文档编写"
  }
}
```

**查询最近创建的文档**
```json
{
  "name": "sql_query",
  "arguments": {
    "sql": "SELECT * FROM blocks WHERE type = 'd' ORDER BY created DESC LIMIT 5"
  }
}
```

**查找包含特定标签的块**
```json
{
  "name": "sql_query",
  "arguments": {
    "sql": "SELECT * FROM blocks WHERE content LIKE '%#重要%' OR content LIKE '%#urgent%'"
  }
}
```

**插入块**
```json
{
  "name": "insert_block",
  "arguments": {
    "data": "这是一个新的块内容",
    "dataType": "markdown",
    "parentID": "20250803150424-tu1cl78"
  }
}
```

### 📚 开发资源

#### 相关链接
- [思源笔记官方文档](https://b3log.org/siyuan/)
- [思源笔记下载地址](https://b3log.org/siyuan/download.html)
- [思源笔记API文档](https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md)
- [Model Context Protocol](https://modelcontextprotocol.io/)

#### 社区支持
- [思源笔记社区](https://b3log.org/siyuan/)
- [GitHub Issues](https://github.com/xgq18237/siyuan_mcp_server/issues)

#### 技术栈
- **语言**: TypeScript/JavaScript
- **协议**: Model Context Protocol (MCP)
- **框架**: @modelcontextprotocol/sdk
- **部署**: Docker, Node.js
- **数据库**: SQLite (通过思源笔记)

#### 开发工具
- **编辑器**: VS Code, Cursor
- **构建工具**: TypeScript Compiler
- **包管理**: npm
- **容器化**: Docker, Docker Compose

### 🔧 高级功能

#### 1. 模板系统
使用`render_template`和`render_sprig`创建动态内容：
```json
{
  "name": "render_sprig",
  "arguments": {
    "template": "Hello {{.name}}! Today is {{.date}}."
  }
}
```

#### 2. 文件管理
使用文件操作API管理附件和资源：
```json
{
  "name": "upload_asset",
  "arguments": {
    "assetsDirPath": "/assets",
    "files": ["image1.jpg", "document.pdf"]
  }
}
```

#### 3. 数据导出
使用导出功能备份和分享内容：
```json
{
  "name": "export_md_content",
  "arguments": {
    "id": "20250115123456-abcdef"
  }
}
```

### 🛠️ 本地开发

#### 全局安装
```bash
npm install -g siyuan-mcp
siyuan-mcp
```

#### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn
- Git

#### 克隆项目
```bash
git clone https://github.com/xgq18237/siyuan_mcp_server.git
cd siyuan_mcp_server
```

#### 安装依赖
```bash
npm install
```

#### 构建项目
```bash
npm run build
```

#### 开发模式
```bash
npm run dev
```

#### 启动服务器
```bash
npm start
```

#### Docker 本地部署

1. **构建镜像**
```bash
docker build -t siyuan-mcp-server .
```

2. **运行容器**
```bash
docker run -d \
  -e SIYUAN_HOST=127.0.0.1 \
  -e SIYUAN_PORT=6806 \
  -e SIYUAN_TOKEN=your-token \
  --name siyuan-mcp-server \
  siyuan-mcp-server
```

3. **使用 Docker Compose**
```bash
# 配置环境变量
cp env.example .env
# 编辑 .env 文件

# 启动服务
docker-compose up -d
```

### 📄 许可证

MIT License

---

**[⬆ 返回顶部](#思源笔记-mcp-服务器--siyuan-mcp-server)**
