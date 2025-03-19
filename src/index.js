#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 导入服务模块
import { getFlightInfo, cityToAirportCode } from './services/flight.js';
import { getTrainInfo } from './services/train.js';

/**
 * Main function to set up and start the MCP server
 */
async function main() {
  // Create a new MCP server instance
  const server = new McpServer({
    name: "交通信息助手",
    version: "1.0.0",
    description: "Transportation information assistant MCP server"
  });

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

  // Add a city to airport code lookup tool
  server.tool(
    "lookup_airport_code",
    { 
      city: z.string().describe("城市名称（中文或英文）") 
    },
    async ({ city }) => {
      const code = cityToAirportCode[city.toLowerCase()];
      
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
            text: `未在本地找到 ${city} 的机场代码，可以让AI想办法找到` 
          }]
        };
      }
    }
  );

  // Connect the server to stdin/stdout transport
  console.error("Starting Transportation Information MCP server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Transportation Information MCP server connected and ready!");
}

// Run the main function and handle errors
main().catch(err => {
  console.error("Error starting MCP server:", err);
  process.exit(1);
});