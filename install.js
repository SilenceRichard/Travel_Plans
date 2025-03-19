#!/usr/bin/env node

/**
 * 交通信息助手 - 安装脚本
 * 
 * 此脚本会检查并安装所需的依赖，以确保程序正常运行
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

// 输出彩色文本的辅助函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 打印带颜色的消息
function printColored(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 打印标题
printColored('cyan', '\n=== 交通信息助手安装程序 ===\n');

// 主函数
async function main() {
  try {
    // 1. 检查并创建必要的目录
    printColored('blue', '1. 检查并创建必要的目录...');
    const downloadsDir = join(homedir(), 'Documents', 'travel');
    
    if (!existsSync(downloadsDir)) {
      printColored('yellow', `   创建目录: ${downloadsDir}`);
      mkdirSync(downloadsDir, { recursive: true });
    } else {
      printColored('green', `   目录已存在: ${downloadsDir}`);
    }
    
    // 2. 安装Node.js依赖
    printColored('blue', '\n2. 安装Node.js依赖...');
    try {
      printColored('yellow', '   执行: npm install');
      execSync('npm install', { stdio: 'inherit' });
      printColored('green', '   依赖安装成功！');
    } catch (error) {
      printColored('red', '   依赖安装失败，请手动运行 npm install');
      throw error;
    }
    
    // 3. 安装Playwright浏览器
    printColored('blue', '\n3. 安装Playwright浏览器...');
    try {
      printColored('yellow', '   执行: npx playwright install chromium');
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      printColored('green', '   Playwright浏览器安装成功！');
    } catch (error) {
      printColored('red', '   Playwright浏览器安装失败，请手动运行 npx playwright install chromium');
      throw error;
    }
    
    // 4. 显示使用说明
    printColored('blue', '\n4. 安装完成！');
    printColored('magenta', `
   === 使用说明 ===
   
   启动SSE服务器:
   npm run start:sse
   
   带认证启动SSE服务器:
   npm run start:sse:auth
   
   启动命令行模式:
   npm run start
   
   运行客户端示例:
   npm run example
   
   Web客户端:
   在浏览器中打开 src/examples/sse-web-client.html
    `);
    
  } catch (error) {
    printColored('red', `\n安装过程中出现错误: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main();