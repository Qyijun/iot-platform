#!/bin/bash

# IoT Platform 快速安装脚本
# 适用于 Ubuntu 20.04+ / Debian 11+

set -e

echo "======================================"
echo "  IoT Platform 快速安装脚本"
echo "======================================"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
  echo "请使用 sudo 运行此脚本"
  exit 1
fi

# 1. 安装 Docker
echo "[1/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $SUDO_USER
    echo "Docker 安装完成"
else
    echo "Docker 已安装"
fi

# 2. 安装 Docker Compose
echo "[2/6] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成"
else
    echo "Docker Compose 已安装"
fi

# 3. 创建目录结构
echo "[3/6] 创建目录结构..."
mkdir -p data logs mqtt/config mqtt/data mqtt/log nginx/ssl firmware
chmod -R 777 data logs mqtt

# 4. 配置环境变量
echo "[4/6] 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    # 生成随机JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/JWT_SECRET=change-this-to-a-secure-random-string/JWT_SECRET=$JWT_SECRET/" .env
    echo "请编辑 .env 文件配置其他选项"
else
    echo ".env 文件已存在"
fi

# 5. 复制MQTT配置
echo "[5/6] 配置 MQTT..."
if [ ! -f mqtt/config/mosquitto.conf ]; then
    cat > mqtt/config/mosquitto.conf << 'EOF'
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
EOF
fi

# 6. 启动服务
echo "[6/6] 启动服务..."
docker-compose up -d --build

# 完成
echo ""
echo "======================================"
echo "  安装完成!"
echo "======================================"
echo ""
echo "服务地址:"
echo "  - 前端界面: http://localhost:8081"
echo "  - API服务:  http://localhost:3000"
echo "  - MQTT:     tcp://localhost:1883"
echo ""
echo "默认账号: admin / admin123"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo ""
