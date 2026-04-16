# 物联网管理平台

一个完整的物联网后台系统，支持局域网/公网访问，支持多种设备接入（ESP32、STM32、蓝牙设备等）。

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        物联网平台架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐            │
│   │  移动端  │      │  Web端  │      │  设备端  │            │
│   │ (鸿蒙App)│      │ (Vue3) │      │ (ESP32) │            │
│   └────┬────┘      └────┬────┘      └────┬────┘            │
│        │                │                │                  │
│        └────────────────┼────────────────┘                  │
│                         │                                   │
│                  ┌──────▼──────┐                            │
│                  │   Nginx     │                            │
│                  │  (反向代理)  │                            │
│                  └──────┬──────┘                            │
│                         │                                   │
│   ┌─────────────────────┼─────────────────────┐             │
│   │                     │                      │             │
│ ┌─▼───┐          ┌──────▼──────┐      ┌──────▼──────┐      │
│ │API  │          │  WebSocket   │      │    MQTT     │      │
│ │3000 │          │    3001      │      │    1883     │      │
│ └──┬──┘          └──────┬──────┘      └──────┬──────┘      │
│    │                    │                    │              │
│ ┌──▼────────────────────▼────────────────────▼──┐          │
│ │              Node.js 后端服务                    │          │
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │          │
│ │  │ 数据库层  │  │ MQTT客户端│  │ 权限控制  │    │          │
│ │  │ SQLite   │  │          │  │  JWT     │    │          │
│ │  │ MySQL    │  │          │  │          │    │          │
│ │  │ PostgreSQL│  │          │  │          │    │          │
│ │  └──────────┘  └──────────┘  └──────────┘    │          │
│ └───────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 功能特性

- 🔐 **用户认证** - JWT token + 邮箱验证码
- 📱 **设备管理** - 增删改查、分组管理、设备类型
- 🔵 **蓝牙配网** - Web蓝牙配网ESP32设备
- 🌐 **WebSocket** - 实时数据推送
- 📡 **MQTT通信** - 支持发布/订阅模式
- 📊 **数据监控** - 实时数据、历史曲线
- 🚀 **一键部署** - Docker Compose
- 📦 **多数据库** - SQLite/MySQL/PostgreSQL
- 🔧 **多设备适配** - 统一协议适配层

## 快速部署 (Linux)

### 方式一：Docker一键部署

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/iot-platform.git
cd iot-platform

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 设置 JWT_SECRET 等

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### 方式二：手动部署

```bash
# 1. 安装依赖
# Node.js 18+
# MongoDB/MySQL/PostgreSQL (可选)

# 2. 安装后端
cd backend
npm install
npm run setup  # 初始化数据库

# 3. 安装前端
cd ../frontend
npm install
npm run build

# 4. 配置Nginx (参考 nginx/nginx.conf)

# 5. 启动服务
cd ../backend
node server.js
```

### 方式三：Systemd服务 (推荐)

```bash
# 创建服务文件
sudo nano /etc/systemd/system/iot-platform.service

# 内容如下:
# [Unit]
# Description=IoT Platform
# After=network.target

# [Service]
# Type=simple
# User=your-user
# WorkingDirectory=/path/to/iot-platform/backend
# ExecStart=/usr/bin/node server.js
# Restart=on-failure

# [Install]
# WantedBy=multi-user.target

# 启用并启动
sudo systemctl daemon-reload
sudo systemctl enable iot-platform
sudo systemctl start iot-platform
```

## 访问服务

| 服务 | 地址 |
|------|------|
| 前端界面 | http://your-ip:8081 |
| API服务 | http://your-ip:3000 |
| WebSocket | ws://your-ip:3001 |
| MQTT | tcp://your-ip:1883 |

## 默认账号

- 用户名: `admin`
- 密码: `admin123`

**首次登录后请立即修改密码！**

## 目录结构

```
iot-platform/
├── backend/              # Node.js 后端
│   ├── server.js         # 主入口
│   ├── database.js       # 数据库层
│   ├── protocol-adapter.js # 设备协议适配器
│   ├── ble-service.js    # 蓝牙服务
│   ├── Dockerfile
│   └── package.json
├── frontend/             # Vue3 前端
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── stores/       # 状态管理
│   │   └── router/       # 路由配置
│   ├── Dockerfile
│   └── package.json
├── esp32-device/         # ESP32 设备代码
│   ├── src/main.cpp      # 主程序
│   └── platformio.ini
├── mqtt/                  # MQTT配置
├── nginx/                 # Nginx配置
├── docker-compose.yml     # Docker编排
└── .env.example           # 环境变量模板
```

## 设备协议适配

平台支持统一接入多种设备类型，通过 `protocol-adapter.js` 实现协议标准化。

### 支持的设备类型

| 协议 | 说明 | 传输方式 | 心跳间隔 |
|------|------|----------|----------|
| `esp32` | ESP32 WiFi设备 | MQTT | 60秒 |
| `stm32` | STM32微控制器 | MQTT/串口 | 120秒 |
| `bluetooth` | 蓝牙设备 | BLE广播 | 无 |
| `lora` | LoRa无线设备 | MQTT | 300秒 |
| `generic` | 通用MQTT设备 | MQTT | 60秒 |
| `custom` | 自定义设备 | HTTP/MQTT | - |

### 设备数据格式

所有设备数据统一使用JSON格式：

```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "battery": 3.7,
  "rssi": -65
}
```

### 添加新设备协议

```javascript
// 在 protocol-adapter.js 中注册
adapter.register('my_device', {
  name: '我的设备',
  type: 'mqtt',
  dataFormat: 'json',
  
  parseData: (raw) => {
    // 自定义解析逻辑
    return {
      timestamp: Date.now(),
      fields: { /* 解析后的字段 */ }
    };
  },
  
  buildCommand: (cmd, params) => {
    return { command: cmd, ...params };
  },
  
  heartbeatInterval: 60000,
  metadata: { manufacturer: 'MyCompany' }
});
```

### API: 获取支持的协议

```bash
GET /api/protocols
```

响应：
```json
{
  "success": true,
  "protocols": [
    { "type": "esp32", "name": "ESP32设备", "transport": "WiFi" },
    { "type": "stm32", "name": "STM32设备", "transport": "UART/MQTT" },
    ...
  ]
}
```

## API文档

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/send-code | 发送验证码 |
| POST | /api/auth/reset-password | 重置密码 |
| GET | /api/auth/me | 获取当前用户 |

### 设备管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/devices | 获取设备列表 |
| POST | /api/devices | 创建设备 |
| GET | /api/devices/:id | 获取设备详情 |
| PUT | /api/devices/:id | 更新设备 |
| DELETE | /api/devices/:id | 删除设备 |
| GET | /api/devices/:id/data | 获取实时数据 |
| POST | /api/devices/:id/command | 发送控制命令 |
| GET | /api/devices/:id/logs | 获取设备日志 |

### 蓝牙配网

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/bluetooth/provision | 配置WiFi |

### WebSocket

```javascript
// 连接地址
ws://your-server:3001

// 接收消息类型
{
  type: 'device_data',    // 设备数据更新
  type: 'device_status',  // 设备状态变化
  type: 'alert',          // 告警消息
  type: 'command_ack'      // 命令响应
}
```

## 设备接入

### ESP32 设备

```cpp
// 修改设备配置
const char* mqtt_server = "your-server-ip";
const char* device_id = "device_001";
const char* device_type = "通用设备";
```

### 自定义设备

可通过HTTP或MQTT协议接入：

```javascript
// HTTP方式上报数据
POST http://your-server:3000/api/devices/{deviceId}/data
{
  "temperature": 25.5,
  "humidity": 60
}

// MQTT方式
// Topic: devices/{deviceId}/data
// Payload: {"temperature": 25.5, "humidity": 60}
```

## 数据库配置

支持三种数据库，只需修改 `.env`:

```bash
# SQLite (默认)
DB_TYPE=sqlite
DB_PATH=./data/database.sqlite

# MySQL
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=iot_platform

# PostgreSQL
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=iot_platform
```

## 常见问题

### Q: 忘记密码怎么办？
A: 使用 `/api/auth/send-code` 发送验证码重置密码

### Q: 如何添加新用户？
A: 管理员登录后访问 用户管理 页面

### Q: 如何配置SSL？
A: 将证书放入 `nginx/ssl/` 目录，修改 `nginx/nginx.conf`

### Q: MQTT连接失败？
A: 检查 mosquitto.conf 中的 allow_anonymous 配置

## 开发计划

- [x] 用户认证系统
- [x] 设备管理
- [x] 蓝牙配网
- [x] WebSocket实时通信
- [x] 多数据库支持
- [ ] 设备分组管理
- [ ] 数据可视化图表
- [ ] 告警通知
- [ ] 固件OTA升级
- [ ] 鸿蒙App
- [ ] 多租户支持

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js, Express, Socket.io |
| 数据库 | SQLite, MySQL, PostgreSQL |
| 前端 | Vue3, Element Plus, ECharts |
| MQTT | Eclipse Mosquitto |
| 设备 | ESP32, Arduino, NimBLE |
| 部署 | Docker, Docker Compose, Nginx |

## License

MIT
