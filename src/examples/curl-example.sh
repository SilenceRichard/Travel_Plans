#!/bin/bash

# 交通信息助手 - curl调用示例
# 此脚本演示如何使用curl直接调用API，无需SSE连接

# 设置服务器URL
SERVER_URL="http://localhost:3000"
# 可以设置认证令牌（如果服务器需要）
# AUTH_TOKEN="your_token_here"

# 生成随机消息ID
MESSAGE_ID=$(uuidgen || date +%s)

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印指定颜色的文本
print_color() {
  local color="$1"
  local message="$2"
  echo -e "${color}${message}${NC}"
}

# 查询机场代码
query_airport_code() {
  print_color "$BLUE" "\n === 查询机场代码示例 === "
  
  local city="$1"
  print_color "$YELLOW" "查询城市: $city"
  
  # 构建请求体
  local data='{
    "id": "'$MESSAGE_ID'",
    "method": "mcp.toolCall",
    "params": {
      "tool": "lookup_airport_code",
      "parameters": {
        "city": "'$city'"
      }
    }
  }'
  
  # 设置请求头
  local headers=(
    -H "Content-Type: application/json"
  )
  
  # 添加认证令牌（如果设置了）
  if [ ! -z "$AUTH_TOKEN" ]; then
    headers+=(-H "Authorization: Bearer $AUTH_TOKEN")
  fi
  
  # 发送请求
  print_color "$GREEN" "发送POST请求到 $SERVER_URL/messages"
  curl -s "${headers[@]}" -X POST -d "$data" "$SERVER_URL/messages" | jq .
}

# 查询航班信息
query_flight_info() {
  print_color "$BLUE" "\n === 查询航班信息示例 === "
  
  local from="$1"
  local to="$2"
  local date="$3"
  
  print_color "$YELLOW" "查询航班: $from -> $to, 日期: $date"
  
  # 构建请求体
  local data='{
    "id": "'$MESSAGE_ID'",
    "method": "mcp.toolCall",
    "params": {
      "tool": "get_flight_info",
      "parameters": {
        "from": "'$from'",
        "to": "'$to'",
        "date": "'$date'",
        "headless": true,
        "saveScreenshot": true,
        "verbose": true
      }
    }
  }'
  
  # 设置请求头
  local headers=(
    -H "Content-Type: application/json"
  )
  
  # 添加认证令牌（如果设置了）
  if [ ! -z "$AUTH_TOKEN" ]; then
    headers+=(-H "Authorization: Bearer $AUTH_TOKEN")
  fi
  
  # 发送请求
  print_color "$GREEN" "发送POST请求到 $SERVER_URL/messages"
  print_color "$YELLOW" "注意: 此操作可能需要几分钟时间，请耐心等待..."
  curl -s "${headers[@]}" -X POST -d "$data" "$SERVER_URL/messages" | jq .
}

# 查询火车信息
query_train_info() {
  print_color "$BLUE" "\n === 查询火车信息示例 === "
  
  local from="$1"
  local to="$2"
  local date="$3"
  
  print_color "$YELLOW" "查询火车: $from -> $to, 日期: $date"
  
  # 构建请求体
  local data='{
    "id": "'$MESSAGE_ID'",
    "method": "mcp.toolCall",
    "params": {
      "tool": "get_train_info",
      "parameters": {
        "from": "'$from'",
        "to": "'$to'",
        "date": "'$date'",
        "headless": true,
        "saveScreenshot": true,
        "verbose": true
      }
    }
  }'
  
  # 设置请求头
  local headers=(
    -H "Content-Type: application/json"
  )
  
  # 添加认证令牌（如果设置了）
  if [ ! -z "$AUTH_TOKEN" ]; then
    headers+=(-H "Authorization: Bearer $AUTH_TOKEN")
  fi
  
  # 发送请求
  print_color "$GREEN" "发送POST请求到 $SERVER_URL/messages"
  print_color "$YELLOW" "注意: 此操作可能需要几分钟时间，请耐心等待..."
  curl -s "${headers[@]}" -X POST -d "$data" "$SERVER_URL/messages" | jq .
}

# 主函数
main() {
  print_color "$BLUE" "=== 交通信息助手 curl调用示例 ==="
  print_color "$YELLOW" "服务器URL: $SERVER_URL"
  
  # 检查服务器是否在运行
  if ! curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL" | grep -q "2[0-9][0-9]\|3[0-9][0-9]"; then
    print_color "$RED" "错误: 无法连接到服务器 $SERVER_URL"
    print_color "$YELLOW" "请确保服务器已启动 (npm run start:sse)"
    exit 1
  fi
  
  # 检查jq是否已安装
  if ! command -v jq &> /dev/null; then
    print_color "$RED" "错误: 未安装jq工具，请安装后再运行 (brew install jq 或 apt install jq)"
    exit 1
  fi
  
  # 示例1: 查询机场代码
  query_airport_code "成都"
  
  # 示例2: 查询航班信息
  # 注意: 取消注释下面的行以执行，可能会花费几分钟时间
  # query_flight_info "北京" "上海" "2023-08-15"
  
  # 示例3: 查询火车信息
  # 注意: 取消注释下面的行以执行，可能会花费几分钟时间
  # query_train_info "北京" "上海" "2023-08-15"
}

# 执行主函数
main