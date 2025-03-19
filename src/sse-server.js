#!/usr/bin/env node

import express from 'express';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { createRequire } from 'module';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// 导入服务模块
import { getFlightInfo, cityToAirportCode, lookupAirportCode } from './services/flight.js';
import { getTrainInfo } from './services/train.js';

// Main function to set up and start the MCP server with SSE transport
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const portArg = args.find(arg => arg.startsWith("--port="));
  const port = portArg ? parseInt(portArg.split("=")[1], 10) : 3000;
  
  const tokenArg = args.find(arg => arg.startsWith("--token="));
  const token = tokenArg ? tokenArg.split("=")[1] : undefined;
  
  // Create a new MCP server instance
  const server = new McpServer({
    name: "交通信息助手-SSE",
    version: "1.0.0",
    description: "Transportation information assistant MCP server with SSE transport"
  });
  
  // 存储工具处理函数的映射表，以便直接调用
  const toolHandlers = {};
  
  // 扩展server对象，添加获取工具处理程序的方法
  server.getToolHandler = (toolName) => {
    return toolHandlers[toolName];
  };

  // Add flight information tool
  server.tool(
    "get_flight_info",
    { 
      from: z.string().describe("出发地城市名或机场代码"),
      to: z.string().describe("目的地城市名或机场代码"),
      date: z.string().describe("出行日期，格式为YYYY-MM-DD"),
      headless: z.boolean().optional().default(false).describe("是否使用无头浏览器模式"),
      saveScreenshot: z.boolean().optional().default(true).describe("是否保存网页截图"),
      verbose: z.boolean().optional().default(true).describe("是否显示详细日志")
    },
    async ({ from, to, date, headless, saveScreenshot, verbose }) => {
      try {
        const options = {
          headless,
          saveScreenshot,
          verbose
        };
        
        const result = await getFlightInfo(from, to, date, options);
        
        // Preview of the first few flights for quick reference
        const flightPreview = result.flightDetails.slice(0, 5).map(flight => 
          `${flight.airline} ${flight.flightNumber}: ${flight.departTime}(${flight.departTerminal || ''})→${flight.arrivalTime}(${flight.arrivalTerminal || ''}), ${flight.aircraft || ''} ${flight.discount || ''} ${flight.promotions ? '优惠:' + flight.promotions : ''} 价格¥${flight.price}`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `已为 ${from}(${result.from}) 到 ${to}(${result.to}) 于 ${date} 的航班生成HTML时刻表。
找到 ${result.flightCount} 个航班。
HTML文件已保存至: ${result.htmlPath}
${result.screenshotPath ? `截图备份已保存至: ${result.screenshotPath}` : '未保存截图'}

航班预览:
${flightPreview}

完整信息请查看HTML文件。` 
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `获取航班信息失败: ${error.message}` 
          }]
        };
      }
    }
  );
  
  // 保存get_flight_info工具的处理函数
  toolHandlers["get_flight_info"] = async ({ from, to, date, headless, saveScreenshot, verbose }) => {
    try {
      const options = {
        headless,
        saveScreenshot,
        verbose
      };
      
      const result = await getFlightInfo(from, to, date, options);
      
      // Preview of the first few flights for quick reference
      const flightPreview = result.flightDetails.slice(0, 5).map(flight => 
        `${flight.airline} ${flight.flightNumber}: ${flight.departTime}(${flight.departTerminal || ''})→${flight.arrivalTime}(${flight.arrivalTerminal || ''}), ${flight.aircraft || ''} ${flight.discount || ''} ${flight.promotions ? '优惠:' + flight.promotions : ''} 价格¥${flight.price}`
      ).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `已为 ${from}(${result.from}) 到 ${to}(${result.to}) 于 ${date} 的航班生成HTML时刻表。
找到 ${result.flightCount} 个航班。
HTML文件已保存至: ${result.htmlPath}
${result.screenshotPath ? `截图备份已保存至: ${result.screenshotPath}` : '未保存截图'}

航班预览:
${flightPreview}

完整信息请查看HTML文件。` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `获取航班信息失败: ${error.message}` 
        }]
      };
    }
  };

  // Add train information tool
  server.tool(
    "get_train_info",
    { 
      from: z.string().describe("出发地城市名"),
      to: z.string().describe("目的地城市名"),
      date: z.string().describe("出行日期，格式为YYYY-MM-DD"),
      headless: z.boolean().optional().default(false).describe("是否使用无头浏览器模式"),
      saveScreenshot: z.boolean().optional().default(true).describe("是否保存网页截图"),
      verbose: z.boolean().optional().default(true).describe("是否显示详细日志")
    },
    async ({ from, to, date, headless, saveScreenshot, verbose }) => {
      try {
        const options = {
          headless,
          saveScreenshot,
          verbose
        };
        
        const result = await getTrainInfo(from, to, date, options);
        
        // Preview of the first few trains for quick reference
        const trainPreview = result.trainDetails.slice(0, 5).map(train => 
          `${train.trainNumber}: ${train.departTime}(${train.departStation})→${train.arrivalTime}(${train.arrivalStation}), 历时:${train.duration}, 价格¥${train.price}`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `已为 ${from} 到 ${to} 于 ${date} 的火车生成HTML时刻表。
找到 ${result.trainCount} 个车次。
HTML文件已保存至: ${result.htmlPath}
${result.screenshotPath ? `截图备份已保存至: ${result.screenshotPath}` : '未保存截图'}

车次预览:
${trainPreview}

完整信息请查看HTML文件。` 
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `获取火车信息失败: ${error.message}` 
          }]
        };
      }
    }
  );
  
  // 保存get_train_info工具的处理函数
  toolHandlers["get_train_info"] = async ({ from, to, date, headless, saveScreenshot, verbose }) => {
    try {
      const options = {
        headless,
        saveScreenshot,
        verbose
      };
      
      const result = await getTrainInfo(from, to, date, options);
      
      // Preview of the first few trains for quick reference
      const trainPreview = result.trainDetails.slice(0, 5).map(train => 
        `${train.trainNumber}: ${train.departTime}(${train.departStation})→${train.arrivalTime}(${train.arrivalStation}), 历时:${train.duration}, 价格¥${train.price}`
      ).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `已为 ${from} 到 ${to} 于 ${date} 的火车生成HTML时刻表。
找到 ${result.trainCount} 个车次。
HTML文件已保存至: ${result.htmlPath}
${result.screenshotPath ? `截图备份已保存至: ${result.screenshotPath}` : '未保存截图'}

车次预览:
${trainPreview}

完整信息请查看HTML文件。` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `获取火车信息失败: ${error.message}` 
        }]
      };
    }
  };

  // Add a city to airport code lookup tool
  server.tool(
    "lookup_airport_code",
    { 
      city: z.string().describe("城市名称（中文或英文）") 
    },
    async ({ city }) => {
      try {
        // 使用新的lookupAirportCode函数查询机场代码
        const code = await lookupAirportCode(city);
        
        if (code) {
          return {
            content: [{ 
              type: "text", 
              text: `${city} 的机场代码是: ${code}` 
            }]
          };
        } else {
          return {
            content: [{ 
              type: "text", 
              text: `未找到 ${city} 的机场代码，可能需要检查城市名称拼写或者添加到机场代码数据库中` 
            }]
          };
        }
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `查询机场代码失败: ${error.message}` 
          }]
        };
      }
    }
  );
  
  // 保存lookup_airport_code工具的处理函数
  toolHandlers["lookup_airport_code"] = async ({ city }) => {
    try {
      // 使用新的lookupAirportCode函数查询机场代码
      const code = await lookupAirportCode(city);
      
      if (code) {
        return {
          content: [{ 
            type: "text", 
            text: `${city} 的机场代码是: ${code}` 
          }]
        };
      } else {
        return {
          content: [{ 
            type: "text", 
            text: `未找到 ${city} 的机场代码，可能需要检查城市名称拼写或者添加到机场代码数据库中` 
          }]
        };
      }
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `查询机场代码失败: ${error.message}` 
        }]
      };
    }
  };

  // Authentication middleware
  const authenticate = (req, res, next) => {
    if (!token) {
      // No token configured, skip authentication
      return next();
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    
    const providedToken = authHeader.split(' ')[1];
    if (providedToken !== token) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    
    next();
  };

  // Set up Express application
  const app = express();
  app.use(express.json());
  app.use(cors()); // Enable CORS for all routes
  
  // SSE endpoint with MCP transport
  app.get('/sse', authenticate, async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send a comment to establish the connection
    res.write(': Welcome to the Transportation Info SSE endpoint\n\n');
    
    // Create SSE transport
    const transport = new SSEServerTransport(req, res);
    
    try {
      // Connect to MCP server
      await server.connect(transport);
      
      // Handle connection close
      req.on('close', () => {
        console.log('Client disconnected from SSE');
        transport.close();
      });
    } catch (error) {
      console.error('Error connecting to SSE transport:', error);
      res.end();
    }
  });
  
  // Direct message endpoint for clients that don't support EventSource
  app.post('/messages', authenticate, async (req, res) => {
    try {
      const message = req.body;
      
      // Validate message format
      if (!message || !message.method || !message.id) {
        return res.status(400).json({ error: "Invalid message format" });
      }
      
      // Handle tool calls directly
      if (message.method === 'mcp.toolCall' && message.params && message.params.tool) {
        const toolName = message.params.tool;
        const handler = server.getToolHandler(toolName);
        
        if (!handler) {
          return res.status(404).json({ 
            id: message.id,
            error: { code: -32601, message: `Tool not found: ${toolName}` }
          });
        }
        
        try {
          const result = await handler(message.params.parameters || {});
          return res.json({
            id: message.id,
            result
          });
        } catch (error) {
          return res.status(500).json({ 
            id: message.id,
            error: { code: -32000, message: `Tool execution error: ${error.message}` }
          });
        }
      }
      
      // Handle other MCP methods
      return res.status(400).json({ 
        id: message.id,
        error: { code: -32601, message: `Method not supported: ${message.method}` }
      });
      
    } catch (error) {
      return res.status(500).json({ error: `Server error: ${error.message}` });
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: server.version });
  });
  
  // Documentation endpoint
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>交通信息助手 API</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            h2 { color: #444; margin-top: 20px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .endpoint { font-weight: bold; color: #0066cc; }
          </style>
        </head>
        <body>
          <h1>交通信息助手 API</h1>
          <p>版本: ${server.version}</p>
          
          <h2>支持的端点:</h2>
          <ul>
            <li><span class="endpoint">GET /sse</span> - Server-Sent Events 连接端点</li>
            <li><span class="endpoint">POST /messages</span> - 直接消息端点 (无需 SSE 连接)</li>
            <li><span class="endpoint">GET /health</span> - 健康检查端点</li>
          </ul>
          
          <h2>支持的工具:</h2>
          <ul>
            <li><b>get_flight_info</b> - 获取航班信息</li>
            <li><b>get_train_info</b> - 获取火车信息</li>
            <li><b>lookup_airport_code</b> - 查询机场代码</li>
          </ul>
          
          <h2>使用示例:</h2>
          <pre>
// 连接 SSE 端点
const eventSource = new EventSource('http://localhost:${port}/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// 发送工具调用请求
fetch('http://localhost:${port}/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'unique-message-id',
    method: 'mcp.toolCall',
    params: {
      tool: 'get_flight_info',
      parameters: {
        from: '北京',
        to: '上海',
        date: '2023-08-01'
      }
    }
  })
});
          </pre>
        </body>
      </html>
    `);
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`Transportation Information SSE server running on http://localhost:${port}`);
    console.log(`- SSE endpoint: http://localhost:${port}/sse`);
    console.log(`- Direct message endpoint: http://localhost:${port}/messages`);
    console.log(`- Documentation: http://localhost:${port}/`);
    
    if (token) {
      console.log('- Authentication: Enabled (token required)');
    } else {
      console.log('- Authentication: Disabled (no token required)');
    }
  });
}

// Run the main function and handle errors
main().catch(err => {
  console.error("Error starting SSE server:", err);
  process.exit(1);
});