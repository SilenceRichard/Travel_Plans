# 交通信息助手 (Transportation Information Assistant)

这是一个基于 MCP (Model Context Protocol) 协议的交通信息助手，提供航班和火车查询功能，支持 SSE (Server-Sent Events) 和 STDIO 两种模式。

## 功能特点

- 支持航班信息查询，生成 HTML 报表和截图
- 支持火车时刻表查询，生成 HTML 报表和截图
- 支持机场代码查询
- 提供 SSE 服务器用于 Web 集成
- 提供 STDIO 接口用于命令行或 AI 集成

## 安装

首先，确保你已安装 Node.js (v14+) 和 npm。

```bash
# 运行安装脚本（推荐）
node install.js

# 或者手动安装依赖
npm install

# 安装Playwright浏览器（用于网页自动化）
npx playwright install chromium

# 创建下载目录
mkdir -p ~/Documents/travel
```

## 使用方法

### SSE 服务器模式

SSE 服务器模式适用于网页应用或其他支持 Server-Sent Events 的客户端。

```bash
# 启动 SSE 服务器（推荐）
npm run start:sse

# 或者直接运行
node ./src/sse-server.js --port=3000 --token=可选的认证令牌
```

参数说明：
- `--port`: 服务器端口号，默认为 3000
- `--token`: 可选的认证令牌，用于保护 API 访问

服务器提供两种使用方式：
1. **SSE模式**：先建立SSE连接，再发送请求（适合需要实时更新的应用）
2. **直接模式**：直接向API端点发送HTTP请求，无需事先建立SSE连接（适合简单的调用）

### 命令行模式

命令行模式使用标准输入输出 (STDIO) 与 MCP 客户端通信，适用于命令行工具或 AI 集成。

```bash
# 启动命令行模式（推荐）
npm run start

# 或者直接运行
node ./src/index.js
```

## 示例

### JavaScript/Node.js 示例

查看 `src/examples/sse-client-example.js` 获取 Node.js 客户端示例。

```bash
# 运行示例（推荐）
npm run example

# 或者直接运行
node ./src/examples/sse-client-example.js
```

### Web 客户端示例

查看 `src/examples/sse-web-client.html` 获取 Web 客户端示例。在浏览器中打开此文件即可使用。

## 排障指南

### SSE 连接错误

如果遇到 SSE 连接错误，请检查以下几点：

1. **确保服务器正在运行**：运行 `npm run start:sse` 启动服务器
2. **检查端口号**：确保客户端连接的端口号与服务器一致，默认为 3000
3. **CORS 问题**：如果从不同域名访问，可能会遇到跨域问题
   - 服务器默认已启用 CORS 支持，允许所有来源访问
   - 在生产环境中，应该限制为特定域名
4. **认证问题**：如果服务器启用了认证（使用 `--token` 参数），确保客户端提供了正确的认证令牌
5. **使用直接模式**：如果仍然无法建立SSE连接，可以尝试直接模式，跳过SSE连接直接发送HTTP请求
   - 在Web客户端中，勾选"直接模式"选项即可
   - 在自定义客户端中，直接向`/messages`端点发送POST请求，不需要事先连接到`/sse`端点

### 其他常见问题

- **网页自动化失败**：确保已安装 Playwright 的 Chromium 浏览器（运行 `npx playwright install chromium`）
- **下载路径问题**：确保 `~/Documents/travel` 目录存在并可写入
- **依赖问题**：如果遇到模块未找到的错误，运行 `npm install` 确保所有依赖已安装

## API 接口

### SSE 客户端连接

通过 EventSource API 连接到 SSE 端点：

```javascript
const eventSource = new EventSource('http://localhost:3000/sse');
```

如果使用了认证令牌，需要在请求头中添加 Authorization：

```javascript
const eventSource = new EventSource('http://localhost:3000/sse', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
```

### 发送请求

向 `/messages` 端点发送 POST 请求，格式为 MCP 协议：

```javascript
const response = await fetch('http://localhost:3000/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN' // 如果启用了认证
  },
  body: JSON.stringify({
    id: 'unique-message-id',
    method: 'mcp.toolCall',
    params: {
      tool: 'tool-name', // 工具名称，如 'get_flight_info'
      parameters: {
        // 工具参数
      }
    }
  })
});
```

### 可用工具

#### 1. get_flight_info - 获取航班信息

```javascript
{
  from: '北京', // 出发城市名或机场代码
  to: '上海',   // 目的地城市名或机场代码
  date: '2023-08-01', // 出行日期，格式为YYYY-MM-DD
  headless: true,     // 可选：是否使用无头浏览器模式，默认为 false
  saveScreenshot: true, // 可选：是否保存网页截图，默认为 true
  verbose: true       // 可选：是否显示详细日志，默认为 true
}
```

#### 2. get_train_info - 获取火车信息

```javascript
{
  from: '北京', // 出发城市名
  to: '上海',   // 目的地城市名
  date: '2023-08-01', // 出行日期，格式为YYYY-MM-DD
  headless: true,     // 可选：是否使用无头浏览器模式，默认为 false
  saveScreenshot: true, // 可选：是否保存网页截图，默认为 true
  verbose: true       // 可选：是否显示详细日志，默认为 true
}
```

#### 3. lookup_airport_code - 查询机场代码

```javascript
{
  city: '成都' // 城市名称（中文或英文）
}
```

## 技术架构

- 使用 Express.js 提供 SSE 服务器
- 使用 Playwright 进行网页自动化
- 遵循 Model Context Protocol (MCP) 规范
- 生成 HTML 报表和截图
- 启用 CORS 支持跨域请求

## 贡献

欢迎提交 Pull Request 或 Issues。

## 许可

MIT