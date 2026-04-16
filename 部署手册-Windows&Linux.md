# 物联网管理平台 - Windows & Linux 部署手册

## 目录

1. [Windows 部署](#windows-部署)
   - 方式一：Docker Desktop
   - 方式二：WSL2 + Docker
2. [Linux 部署](#linux-部署)
   - Ubuntu / Debian
   - CentOS / Rocky
3. [NAS 部署](#nas-部署)
   - 群晖 Synology
   - 威联通 QNAP
4. [配置说明](#配置说明)
5. [验证部署](#验证部署)
6. [常见问题](#常见问题)

---

# Windows 部署

## 方式一：Docker Desktop（推荐）

### 第一步：安装 Docker Desktop

#### 1.1 系统要求检查

```
- Windows 10/11 专业版/企业版/教育版
- 或 Windows Server 2019/2022
- 内存：至少 4GB（推荐 8GB+）
- 硬盘：至少 20GB 可用空间
- 必须开启 Hyper-V 或 WSL2
```

#### 1.2 下载 Docker Desktop

访问：https://www.docker.com/products/docker-desktop

或使用国内镜像：
```
https://get.daocloud.io/docker
```

#### 1.3 安装步骤

```
1. 双击 Docker Desktop Installer.exe
2. 勾选 "Use WSL 2 instead of Hyper-V"（推荐）
3. 点击 "Install"
4. 等待安装完成（5-10分钟）
5. 重启电脑
```

#### 1.4 启动 Docker Desktop

```
1. 启动 Docker Desktop
2. 等待底部图标显示 "Docker Desktop is running"
3. 打开 PowerShell 或 CMD 验证
```

#### 1.5 验证安装

打开 PowerShell（管理员），执行：

```powershell
docker --version
docker-compose --version
```

显示版本号即安装成功：
```
Docker version 24.x.x, build xxxxxx
docker-compose version v2.x.x
```

---

### 第二步：获取项目

#### 2.1 方法一：Git 克隆

```powershell
# 安装 Git（如果没有）
winget install Git.Git

# 克隆项目
cd C:\
git clone https://github.com/你的仓库/iot-platform.git
cd iot-platform
```

#### 2.2 方法二：直接复制

```
将 iot-platform 文件夹复制到 C:\ 盘根目录
```

---

### 第三步：配置环境

#### 3.1 创建环境变量文件

在项目根目录创建 `.env` 文件：

```powershell
cd C:\iot-platform
copy .env.example .env
```

编辑 `.env` 文件：

```env
# 服务端口
PORT=3000
WS_PORT=3001

# 数据库
DB_PATH=/data/database.sqlite

# MQTT配置（保持默认）
MQTT_BROKER=mqtt://mqtt:1883

# JWT密钥（请修改为复杂字符串）
JWT_SECRET=your-secret-key-change-in-production

# 运行环境
NODE_ENV=production
```

#### 3.2 修改 IP 地址（重要）

编辑 `esp32-device/src/main.cpp`，将 IP 改为本机 IP：

```cpp
// 将 "192.168.1.100" 改为你的电脑IP
const char* mqtt_server = "192.168.1.100";
```

查看本机 IP：
```powershell
ipconfig
# 找到 IPv4 地址，例如：192.168.1.100
```

---

### 第四步：启动服务

#### 4.1 使用 Docker Compose 启动

```powershell
cd C:\iot-platform

# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

#### 4.2 启动脚本（可选）

创建 `start.bat`：

```batch
@echo off
cd /d %~dp0
echo 启动物联网平台...
docker-compose up -d
echo.
echo 启动完成！
echo 请访问: http://localhost
echo API服务: http://localhost:3000
echo.
pause
```

---

### 第五步：访问系统

打开浏览器访问：

```
http://localhost          # 前端界面
http://localhost:3000    # API服务
```

登录信息：
```
用户名：admin
密码：admin123
```

---

## 方式二：WSL2 + Docker

### 第一步：启用 WSL2

#### 1.1 以管理员身份打开 PowerShell

```powershell
# 启用 WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 启用虚拟机平台
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 设置 WSL2 为默认
wsl --set-default-version 2
```

#### 1.2 安装 Linux 子系统

打开 Microsoft Store，搜索 "Ubuntu 22.04 LTS"，点击安装。

或使用命令：
```powershell
wsl --install -d Ubuntu-22.04
```

#### 1.3 配置 Ubuntu

```
1. 首次启动会要求设置用户名和密码
2. 记住用户名，后续需要
```

---

### 第二步：在 WSL2 中安装 Docker

#### 2.1 打开 Ubuntu 终端

```bash
# 更新软件源
sudo apt update && sudo apt upgrade -y

# 安装必要组件
sudo apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 源
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 将当前用户加入 docker 组
sudo usermod -aG docker $USER

# 重启 Docker 服务
sudo service docker restart
```

#### 2.2 验证 Docker

```bash
docker --version
docker-compose --version
```

---

### 第三步：配置 Docker Desktop 集成 WSL2（可选）

如果你想使用 Windows 侧的 Docker Desktop 与 WSL2 集成：

```
1. 打开 Docker Desktop
2. 设置 → Resources → WSL Integration
3. 启用你的 Ubuntu 发行版
4. Apply & Restart
```

这样 WSL2 中的 docker 命令会使用 Windows 侧的 Docker Desktop。

---

### 第四步：部署项目

#### 4.1 在 WSL2 中操作

```bash
# 进入项目目录（Windows 挂载的盘符在 /mnt/ 下）
cd /mnt/c/iot-platform

# 或克隆项目
git clone https://github.com/你的仓库/iot-platform.git
cd iot-platform

# 创建环境变量文件
cp .env.example .env

# 启动服务
docker-compose up -d --build
```

#### 4.2 访问系统

```
http://localhost
```

---

# Linux 部署

## Ubuntu / Debian 系统

### 第一步：安装 Docker

#### 1.1 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.2 安装必要组件

```bash
sudo apt install -y ca-certificates curl gnupg lsb-release
```

#### 1.3 添加 Docker 官方 GPG 密钥

```bash
# 对于 Ubuntu
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 对于 Debian
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

#### 1.4 添加 Docker 仓库

```bash
# Ubuntu
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Debian
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### 1.5 安装 Docker

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

#### 1.6 验证安装

```bash
docker --version
docker-compose --version
```

---

### 第二步：安装 Docker Compose（独立版）

```bash
# 下载最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 创建软链接
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证
docker-compose --version
```

---

### 第三步：获取项目

#### 3.1 使用 Git 克隆

```bash
# 安装 Git（如果没有）
sudo apt install -y git

# 克隆项目
cd /home/你的用户名
git clone https://github.com/你的仓库/iot-platform.git
cd iot-platform
```

#### 3.2 或使用 SCP 从 Windows 传输

在 Windows PowerShell 中：
```powershell
scp -r C:\iot-platform 用户名@Linux服务器IP:/home/用户名/
```

---

### 第四步：配置项目

#### 4.1 创建环境变量文件

```bash
cp .env.example .env
```

编辑 `.env`：
```bash
nano .env
```

修改以下内容：
```env
# JWT密钥（改为复杂随机字符串）
JWT_SECRET=改成你的随机密钥至少32位

# 如果需要从外部访问，改为服务器IP
# MQTT_BROKER=mqtt://你的服务器IP:1883
```

#### 4.2 修改 ESP32 设备配置

编辑 `esp32-device/src/main.cpp`：
```cpp
const char* mqtt_server = "192.168.1.100";  // 改为服务器IP
```

#### 4.3 设置目录权限

```bash
# 创建数据目录
mkdir -p data logs mqtt/data mqtt/log

# 设置权限
chmod -R 777 data logs mqtt/data mqtt/log
```

---

### 第五步：启动服务

#### 5.1 使用一键部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

#### 5.2 手动启动

```bash
# 构建镜像
docker-compose build

# 启动服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

---

### 第六步：防火墙设置

```bash
# 开放端口
sudo ufw allow 80/tcp    # 前端
sudo ufw allow 3000/tcp  # API
sudo ufw allow 1883/tcp  # MQTT
sudo ufw allow 8080/tcp  # Nginx

# 重启防火墙
sudo ufw reload

# 查看状态
sudo ufw status
```

---

### 第七步：访问系统

```
http://你的服务器IP
```

登录：
```
用户名：admin
密码：admin123
```

---

## CentOS / Rocky / AlmaLinux 系统

### 第一步：安装 Docker

#### 1.1 安装必要组件

```bash
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

#### 1.2 添加 Docker 仓库

```bash
# CentOS 7
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# CentOS 8 / Rocky / AlmaLinux
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

#### 1.3 安装 Docker

```bash
# CentOS 7
sudo yum install -y docker-ce docker-ce-cli containerd.io

# CentOS 8 / Rocky / AlmaLinux
sudo dnf install -y docker-ce docker-ce-cli containerd.io
```

#### 1.4 启动 Docker

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

#### 1.5 验证

```bash
docker --version
```

---

### 第二步：安装 Docker Compose

```bash
# 下载
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 权限
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证
docker-compose --version
```

---

### 第三步：后续步骤

与 Ubuntu 相同，执行以下操作：

```bash
# 1. 获取项目
cd ~
git clone https://github.com/你的仓库/iot-platform.git
cd iot-platform

# 2. 配置
cp .env.example .env
nano .env  # 修改 JWT_SECRET

# 3. 创建目录
mkdir -p data logs mqtt/data mqtt/log
chmod -R 777 data logs mqtt/data mqtt/log

# 4. 启动
docker-compose up -d --build
```

---

### 第四步：防火墙和 SELinux

```bash
# 停止并禁用防火墙（可选）
sudo systemctl stop firewalld
sudo systemctl disable firewalld

# 或开放端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=1883/tcp
sudo firewall-cmd --reload

# 设置 SELinux（如果启用）
sudo setenforce 0
# 或编辑 /etc/selinux/config
```

---

# NAS 部署

## 群晖 Synology NAS

### 第一步：安装 Docker 套件

```
1. 打开"套件中心"
2. 搜索 "Docker"
3. 点击安装
```

### 第二步：SSH 连接到 NAS

```bash
ssh admin@你的NAS_IP
sudo -i  # 切换到 root
```

### 第三步：上传项目

#### 方法一：SCP 传输

在本地电脑执行：
```bash
scp -r C:\iot-platform admin@NAS_IP:/volume1/docker/
```

#### 方法二：Git 克隆

```bash
cd /volume1/docker
git clone https://github.com/你的仓库/iot-platform.git
cd iot-platform
```

### 第四步：配置并启动

```bash
# 创建配置
cp .env.example .env
nano .env  # 修改 JWT_SECRET

# 创建目录
mkdir -p data logs mqtt/data mqtt/log
chmod -R 777 data logs mqtt/data mqtt/log

# 启动（群晖使用 docker-compose）
docker-compose up -d
```

### 第五步：配置反向代理（可选，用于公网访问）

```
1. 打开"控制面板" → "登录门户" → "高级"
2. 添加反向代理规则：
   - 协议：HTTP/HTTPS
   - 外部端口：任意可用端口
   - 内部服务器：127.0.0.1
   - 内部端口：80
```

### 第六步：访问

```
http://群晖IP:80
```

---

## 威联通 QNAP NAS

### 第一步：安装 Container Station

```
1. 打开 App Center
2. 搜索 "Container Station"
3. 安装
```

### 第二步：上传项目

通过 File Station 或 SCP：
```bash
scp -r C:\iot-platform admin@QNAP_IP:/share/Container/
```

### 第三步：配置并启动

```bash
cd /share/Container/iot-platform

# 编辑 docker-compose.yml
# 威联通可能需要修改路径

# 启动
docker-compose up -d
```

---

# 配置说明

## docker-compose.yml 详解

```yaml
version: '3.8'

services:
  # 后端API服务
  backend:
    build: ./backend
    container_name: iot-backend
    restart: always          # 开机自启
    ports:
      - "3000:3000"         # 宿主机端口:容器端口
    environment:
      - NODE_ENV=production
      - DB_PATH=/data/database.sqlite
      - MQTT_BROKER=mqtt://mqtt:1883
      - JWT_SECRET=你的密钥
    volumes:
      - ./data:/data        # 持久化数据
      - ./logs:/logs
    depends_on:
      - mqtt                # 依赖MQTT
    networks:
      - iot-network

  # Web前端
  frontend:
    build: ./frontend
    container_name: iot-frontend
    restart: always
    ports:
      - "80:80"             # HTTP
      - "443:443"           # HTTPS
    depends_on:
      - backend
    networks:
      - iot-network

  # MQTT消息代理
  mqtt:
    image: eclipse-mosquitto:2
    container_name: iot-mqtt
    restart: always
    ports:
      - "1883:1883"          # MQTT端口
      - "9001:9001"         # WebSocket端口
    volumes:
      - ./mqtt/config:/mosquitto/config
      - ./mqtt/data:/mosquitto/data
      - ./mqtt/log:/mosquitto/log
    networks:
      - iot-network

  # Nginx反向代理（可选）
  nginx:
    image: nginx:alpine
    container_name: iot-nginx
    restart: always
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend
    networks:
      - iot-network

networks:
  iot-network:
    driver: bridge
```

## 修改服务端口

如果 80/3000/1883 端口被占用：

```yaml
services:
  backend:
    ports:
      - "3001:3000"    # 外部访问 3001，内部仍是 3000
  
  frontend:
    ports:
      - "8080:80"      # 外部访问 8080
  
  mqtt:
    ports:
      - "1884:1883"    # 外部访问 1884
```

然后更新 `.env`：
```env
MQTT_BROKER=mqtt://你的服务器IP:1884
```

---

# 验证部署

## 检查服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看运行中的容器
docker ps
```

预期输出：
```
NAME                IMAGE               STATUS          PORTS
iot-backend         iot-backend         Up              0.0.0.0:3000->3000/tcp
iot-frontend        iot-frontend        Up              0.0.0.0:80->80/tcp
iot-mqtt            eclipse-mosquitto   Up              0.0.0.0:1883->1883/tcp
```

## 检查端口占用

```bash
# Windows
netstat -ano | findstr "80 3000 1883"

# Linux
netstat -tlnp | grep -E "80|3000|1883"
```

## 测试 API

```bash
# 健康检查
curl http://localhost:3000/api/health

# 登录测试
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

预期响应：
```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","username":"admin"}
```

## 测试 MQTT

使用 MQTTX 客户端连接：
```
服务器：服务器IP
端口：1883
用户名：（留空）
密码：（留空）
```

---

# 常用命令

## 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f
docker-compose logs -f backend    # 只看后端日志

# 查看实时资源使用
docker stats
```

## 数据管理

```bash
# 备份数据库
cp data/database.sqlite data/database_backup_$(date +%Y%m%d).sqlite

# 查看数据库大小
ls -lh data/

# 清理日志
> logs/backend.log
truncate -s 0 logs/*.log

# 清理未使用的 Docker 资源
docker system prune -a
```

## 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose up -d --build

# 3. 清理旧镜像
docker image prune -f
```

## 完全卸载

```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker-compose down --rmi all

# 删除数据（谨慎！）
rm -rf data/ logs/ mqtt/data/ mqtt/log/
```

---

# 常见问题

## Q1: Docker 启动失败

**Windows：**
```
解决方法：
1. 确保已启用 Hyper-V 或 WSL2
2. 重启电脑
3. 重新安装 Docker Desktop
```

**Linux：**
```bash
# 查看错误日志
sudo systemctl status docker
journalctl -xe

# 常见错误：存储空间不足
docker system df
docker system prune -a
```

## Q2: 端口被占用

```bash
# Windows
netstat -ano | findstr "80"
# 找到 PID 后，结束进程或修改 docker-compose.yml 端口

# Linux
sudo lsof -i :80
sudo kill -9 进程PID
```

## Q3: 容器内部无法连接 MQTT

检查 `.env` 文件：
```env
MQTT_BROKER=mqtt://mqtt:1883
```
注意：必须是 `mqtt`（Docker 内部网络名），不能是 `localhost`。

## Q4: 前端无法访问后端 API

检查 Nginx 配置和后端是否在同一网络：
```bash
docker-compose exec frontend ping backend
```

## Q5: 设备无法连接 MQTT

确保 ESP32 配置的 IP 是服务器的外网 IP 或局域网 IP，不是 `localhost`。

## Q6: 忘记 admin 密码

重置数据库：
```bash
# 停止服务
docker-compose down

# 删除数据库
rm data/database.sqlite

# 重新启动（会自动创建默认 admin 用户）
docker-compose up -d
```

## Q7: WSL2 Docker 内存不足

创建 `.wslconfig` 文件：
```
# C:\Users\你的用户名\.wslconfig
[wsl2]
memory=4GB
processors=2
```

然后重启：
```powershell
wsl --shutdown
```

## Q8: NAS 上 Docker 性能差

- 确保 NAS 有足够的内存（至少 2GB）
- 使用 SSD 存储 Docker 数据
- 限制容器资源：
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

# 附录：快速检查清单

部署前检查：

```
□ Docker / Docker Desktop 已安装
□ docker --version 显示正常
□ docker-compose --version 显示正常
□ .env 文件已创建并配置
□ JWT_SECRET 已修改
□ 数据目录已创建并设置权限
□ 防火墙端口已开放
□ ESP32 设备 IP 已配置
```

部署后验证：

```
□ docker-compose ps 显示所有服务 Up
□ http://localhost 可访问
□ admin/admin123 可登录
□ MQTT 端口 1883 可连接
□ WebSocket 连接正常
□ ESP32 设备可上线
```

---

## 联系方式

如有问题，请检查：
1. `docker-compose logs` 查看详细日志
2. 确保网络和端口配置正确
3. 查看技术手册了解系统架构
