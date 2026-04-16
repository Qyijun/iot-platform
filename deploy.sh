#!/bin/bash

# 物联网平台部署脚本

echo "================================"
echo "  物联网平台部署脚本"
echo "================================"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要目录
echo "创建数据目录..."
mkdir -p data logs mqtt/data mqtt/log

# 设置权限
echo "设置目录权限..."
chmod -R 777 mqtt/data mqtt/log data logs

# 构建并启动服务
echo "构建并启动服务..."
docker-compose down 2>/dev/null
docker-compose build
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

echo ""
echo "================================"
echo "部署完成!"
echo "================================"
echo ""
echo "访问地址:"
echo "  - 前端界面: http://$(hostname -I | awk '{print $1}')"
echo "  - API服务: http://$(hostname -I | awk '{print $1}'):3000"
echo "  - MQTT: tcp://$(hostname -I | awk '{print $1}'):1883"
echo ""
echo "默认登录:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "================================"
