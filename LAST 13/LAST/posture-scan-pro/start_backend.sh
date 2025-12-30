#!/bin/bash

echo "🚀 启动后端服务器..."

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装后端依赖..."
    npm install
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env 文件不存在，请先创建数据库配置文件"
    echo "示例配置:"
    echo "DB_HOST=localhost"
    echo "DB_USER=your_username"
    echo "DB_PASSWORD=your_password"
    echo "DB_DATABASE=your_database_name"
    echo "API_PORT=3001"
    exit 1
fi

# 启动服务器
echo "🌐 启动 API 服务器..."
node server.js