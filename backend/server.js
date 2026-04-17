// 加载环境变量配置
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 优先加载 .env.local（本地开发），其次 .env
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`📁 已加载配置文件: ${envFile}`);
    break;
  }
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const http = require('http');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const Database = require('./database');
const { PERMISSIONS } = require('./database');
const ProtocolAdapter = require('./protocol-adapter');

// 尝试加载蓝牙服务（如果串口库可用）
let BLEService = null;
try {
  const bleModule = require('./ble-service');
  BLEService = bleModule.BLEService;
} catch (err) {
  console.log('⚠️ 蓝牙服务未加载（需要安装 serialport 依赖）');
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// ========== 环境变量配置 ==========
// 重要：生产环境请在 .env 文件或系统环境变量中配置敏感信息！
// .env 文件已被 .gitignore 排除，不会被提交到 GitHub

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-in-production';
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// 前端构建目录（用于托管）
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');

// 固件下载使用的服务器地址（设备需要能访问的IP）
const SERVER_HOST = process.env.SERVER_HOST || 'localhost';

// 邮件配置（需要配置环境变量或修改下方配置）
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

// 创建邮件传输器（延迟初始化）
let emailTransporter = null;

function getEmailTransporter() {
  if (!emailTransporter && EMAIL_CONFIG.auth.user) {
    emailTransporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: {
        user: EMAIL_CONFIG.auth.user,
        pass: EMAIL_CONFIG.auth.pass
      }
    });
  }
  return emailTransporter;
}

// 发送邮件函数
async function sendEmail(to, subject, html) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log('⚠️ 邮件服务未配置，无法发送真实邮件');
    return false;
  }
  
  try {
    await transporter.sendMail({
      from: `"IoT平台" <${EMAIL_CONFIG.auth.user}>`,
      to,
      subject,
      html
    });
    console.log(`✅ 邮件已发送至 ${to}`);
    return true;
  } catch (err) {
    console.error('❌ 邮件发送失败:', err.message);
    return false;
  }
}

// 数据库初始化
const db = new Database();

// MQTT客户端
const mqttClient = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD
});

// 存储在线设备
const onlineDevices = new Map();
const wsClients = new Map();

// 设备状态变更缓存（分别记录上线和离线的最后记录时间，防止短时间内重复记录日志）
const deviceOnlineCache = new Map();  // 上线日志防抖
const deviceOfflineCache = new Map();  // 离线日志防抖

// 蓝牙配网服务实例
let bleService = null;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// JWT验证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // 获取用户完整信息（含权限）
    const user = await db.getUserWithRoles(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.userPermissions = user.permissions;
    req.userRoles = user.roles;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效' });
  }
};

// 权限验证中间件工厂
const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.userPermissions || !req.userPermissions.includes(permissionCode)) {
      return res.status(403).json({ error: `缺少权限: ${permissionCode}` });
    }
    next();
  };
};

// 管理员权限验证中间件
const requireAdmin = async (req, res, next) => {
  try {
    const hasAdminRole = req.userRoles && req.userRoles.some(r => r.code === 'admin');
    if (!hasAdminRole) {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: '服务器错误' });
  }
};

// 生成验证码
function generateCode(length = 6) {
  return Math.random().toString().slice(2, 2 + length);
}

// ============ MQTT 处理 ============

mqttClient.on('connect', () => {
  console.log('✅ MQTT连接成功');
  
  // 订阅设备主题
  mqttClient.subscribe([
    'device/+/status',
    'device/+/data',
    'device/+/heartbeat',
    'device/+/telemetry',   // ESP32遥测数据
    'device/+/bluetooth/config',
    'device/+/ota/+'        // OTA状态上报 (progress/complete/error)
  ], (err) => {
    if (err) console.error('MQTT订阅失败:', err);
    else console.log('✅ MQTT主题订阅成功');
  });
});

mqttClient.on('disconnect', () => {
  console.log('⚠️ MQTT连接断开');
});

mqttClient.on('close', () => {
  console.log('⚠️ MQTT连接关闭');
});

mqttClient.on('reconnect', () => {
  console.log('🔄 MQTT正在重连...');
});

mqttClient.on('offline', () => {
  console.log('⚠️ MQTT客户端离线');
});

mqttClient.on('message', async (topic, message) => {
  const topicParts = topic.split('/');
  const deviceId = topicParts[1];
  const messageType = topicParts[2];
  const data = JSON.parse(message.toString());
  
  console.log(`📨 MQTT消息 [${topic}]:`, data);
  
  // 检查是否是OTA状态上报主题 (device/xxx/ota/progress|complete|error)
  if (messageType === 'ota' && topicParts.length >= 4) {
    const otaStatus = topicParts[3];
    switch (otaStatus) {
      case 'progress':
        console.log(`📦 OTA进度 [${deviceId}]: ${data.progress}%`);
        broadcastToClients({
          type: 'ota_progress',
          deviceId,
          progress: data.progress
        });
        return;
      case 'complete':
        console.log(`✅ OTA更新完成 [${deviceId}]`);
        await db.updateOTALog(deviceId, 'success');
        broadcastToClients({
          type: 'ota_complete',
          deviceId,
          version: data.version
        });
        return;
      case 'error':
        console.log(`❌ OTA更新失败 [${deviceId}]: ${data.error}`);
        await db.updateOTALog(deviceId, 'failed', data.error);
        broadcastToClients({
          type: 'ota_error',
          deviceId,
          error: data.error
        });
        return;
    }
    return;
  }
  
  switch (messageType) {
    case 'status':
      await handleDeviceStatus(deviceId, data);
      break;
    case 'data':
      await handleDeviceData(deviceId, data);
      break;
    case 'heartbeat':
      handleDeviceHeartbeat(deviceId, data);
      break;
    case 'telemetry':
      // ESP32遥测数据处理（与data类型相同）
      await handleDeviceData(deviceId, data);
      break;
    case 'bluetooth':
      handleBluetoothConfig(deviceId, data);
      break;
  }
  
  // 广播给WebSocket客户端
  broadcastToClients({
    type: messageType,
    deviceId,
    data,
    timestamp: new Date().toISOString()
  });
});

async function handleDeviceStatus(deviceId, data) {
  const { status, online, ip, rssi, version } = data;
  
  // 支持两种格式: status: 'online' 或 online: true
  const isOnline = status === 'online' || status === true || online === true;
  
  if (isOnline) {
    onlineDevices.set(deviceId, {
      deviceId,
      ip,
      rssi,
      version,
      lastSeen: new Date(),
      connected: true
    });
    
    // 检查设备是否已在数据库中，不存在则自动创建
    const existingDevice = await db.getDeviceById(deviceId);
    if (!existingDevice) {
      console.log(`🆕 自动发现新设备: ${deviceId}`);
      // 优先使用消息中的类型，否则使用通用设备
      const deviceType = data.type || '通用设备';
      try {
        await db.createDevice(deviceId, `设备_${deviceId.slice(-6)}`, deviceType);
      } catch (err) {
        console.error(`自动创建设备失败: ${deviceId}`, err);
      }
    }
    
    await db.updateDeviceStatus(deviceId, 'online', ip);
    console.log(`📱 设备上线: ${deviceId}`);
    
    // 防抖：2分钟内不重复记录上线日志（避免网络波动导致频繁上线预警）
    const now = Date.now();
    const lastOnline = deviceOnlineCache.get(deviceId) || 0;
    if ((now - lastOnline) > 120000) {  // 120秒 = 2分钟
      deviceOnlineCache.set(deviceId, now);
      // 记录设备上线日志（系统自动记录，用户ID为null）
      db.addUserLog(null, 'system', 'device_online', `设备 ${deviceId} 上线`, ip);
    }
  } else {
    // 检查设备是否真的在线过，避免重复记录
    if (onlineDevices.has(deviceId)) {
      onlineDevices.delete(deviceId);
      await db.updateDeviceStatus(deviceId, 'offline');
      console.log(`📴 设备离线: ${deviceId}`);
      
      // 防抖：2分钟内不重复记录离线日志
      const now = Date.now();
      const lastOffline = deviceOfflineCache.get(deviceId) || 0;
      if ((now - lastOffline) > 120000) {  // 120秒 = 2分钟
        deviceOfflineCache.set(deviceId, now);
        // 记录设备离线日志
        db.addUserLog(null, 'system', 'device_offline', `设备 ${deviceId} 离线`, null);
      }
    }
  }
}

async function handleDeviceData(deviceId, data) {
  // 使用协议适配器解析数据
  const device = await db.getDeviceById(deviceId);
  const deviceType = device?.type || 'generic';
  
  // 协议适配器处理
  const parsed = ProtocolAdapter.parse(deviceType, data);
  
  if (parsed.success) {
    // 存储标准化后的数据
    await db.insertDeviceData(deviceId, {
      type: deviceType,
      ...parsed.fields
    });
    
    console.log(`📊 数据解析 [${deviceType}]:`, parsed.fields);
  } else {
    // 解析失败，存储原始数据
    await db.insertDeviceData(deviceId, {
      type: 'parse_error',
      raw: data
    });
    console.error(`❌ 数据解析失败 [${deviceId}]:`, parsed.error);
  }
}

function handleDeviceHeartbeat(deviceId, data) {
  // 如果设备不在在线列表中，先添加（ESP32可能只发heartbeat不发status）
  if (!onlineDevices.has(deviceId)) {
    onlineDevices.set(deviceId, {
      deviceId,
      ip: data.ip || null,
      rssi: data.rssi,
      version: data.version || null,
      voltage: data.voltage || null,  // 记录电压
      lastSeen: new Date(),
      connected: true
    });
    console.log(`📱 设备心跳上线: ${deviceId}`);
  } else {
    const device = onlineDevices.get(deviceId);
    device.lastSeen = new Date();
    device.rssi = data.rssi;
    device.ip = data.ip || device.ip;
    device.version = data.version || device.version;  // 更新版本号
    device.voltage = data.voltage || null;  // 更新电压
    onlineDevices.set(deviceId, device);
  }
  
  // 存储心跳数据到数据库（包含电压等）
  db.insertDeviceData(deviceId, {
    type: 'heartbeat',
    rssi: data.rssi,
    voltage: data.voltage,
    free_heap: data.free_heap,
    uptime: data.uptime,
    version: data.version
  }).catch(err => console.error('心跳数据存储失败:', err.message));
}

function handleBluetoothConfig(deviceId, data) {
  console.log(`🔵 蓝牙配网配置 [${deviceId}]:`, data);
  // 处理蓝牙配网后的WiFi配置
}

// ============ WebSocket 处理 ============

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  console.log(`🔌 WebSocket客户端连接: ${clientId}`);
  
  wsClients.set(clientId, {
    ws,
    connectedAt: new Date(),
    subscriptions: new Set()
  });
  
  // 发送当前在线设备列表
  ws.send(JSON.stringify({
    type: 'device_list',
    devices: Array.from(onlineDevices.values())
  }));
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(clientId, data);
    } catch (err) {
      console.error('WebSocket消息解析错误:', err);
    }
  });
  
  ws.on('close', () => {
    console.log(`🔌 WebSocket客户端断开: ${clientId}`);
    wsClients.delete(clientId);
  });
});

async function handleWebSocketMessage(clientId, data) {
  const client = wsClients.get(clientId);
  if (!client) return;
  
  switch (data.type) {
    case 'subscribe_device':
      client.subscriptions.add(data.deviceId);
      break;
      
    case 'unsubscribe_device':
      client.subscriptions.delete(data.deviceId);
      break;
      
    case 'send_command':
      // 发送命令到设备
      const { deviceId, command, params } = data;
      const topic = `device/${deviceId}/command`;
      mqttClient.publish(topic, JSON.stringify({ command, params, timestamp: Date.now() }));
      break;
      
    case 'bluetooth_provision':
      // 蓝牙配网 - 发送WiFi配置
      handleBluetoothProvisioning(data);
      break;
  }
}

function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  wsClients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      // 如果有订阅，只发送给订阅了该设备的客户端
      if (message.deviceId && client.subscriptions.size > 0) {
        if (client.subscriptions.has(message.deviceId)) {
          client.ws.send(messageStr);
        }
      } else {
        client.ws.send(messageStr);
      }
    }
  });
}

function handleBluetoothProvisioning(data) {
  const { deviceId, wifiConfig } = data;
  // 通过MQTT发送WiFi配置给设备
  const topic = `device/${deviceId}/config/wifi`;
  mqttClient.publish(topic, JSON.stringify({
    ssid: wifiConfig.ssid,
    password: wifiConfig.password,
    timestamp: Date.now()
  }));
}

// ============ REST API 路由 ============

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    onlineDevices: onlineDevices.size,
    wsClients: wsClients.size
  });
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 获取用户完整信息
    const userWithRoles = await db.getUserWithRoles(user.id);
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 记录登录日志
    db.addUserLog(user.id, user.username, 'login', '用户登录成功', req.ip);
    
    res.json({ 
      token, 
      username: user.username,
      displayName: user.display_name || user.username,
      roles: userWithRoles.roles,
      permissions: userWithRoles.permissions
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserWithRoles(req.user.userId);
    const email = await db.getConfig(`user_email_${user.id}`);
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username,
      roles: user.roles,
      permissions: user.permissions,
      email: email,
      created_at: user.created_at
    });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新当前用户邮箱
app.put('/api/auth/email', authenticateToken, async (req, res) => {
  const { email } = req.body;
  
  try {
    if (!email) {
      return res.status(400).json({ error: '邮箱不能为空' });
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }
    
    await db.setConfig(`user_email_${req.user.userId}`, email);
    
    res.json({ success: true, message: '邮箱已更新' });
  } catch (err) {
    console.error('更新邮箱错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改当前用户密码
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少6个字符' });
    }
    
    // 获取当前用户
    const user = await db.getUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证旧密码
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: '当前密码错误' });
    }
    
    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updatePassword(req.user.username, hashedPassword);
    
    // 记录密码修改日志
    db.addUserLog(req.user.userId, req.user.username, 'change_password', '修改密码成功', req.ip);
    
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取邮件配置（仅管理员）
app.get('/api/admin/email-config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const smtpHost = await db.getConfig('smtp_host');
    const smtpPort = await db.getConfig('smtp_port');
    const smtpUser = await db.getConfig('smtp_user');
    const smtpPass = await db.getConfig('smtp_pass');
    const smtpSecure = await db.getConfig('smtp_secure');
    
    res.json({
      host: smtpHost || '',
      port: smtpPort ? parseInt(smtpPort) : 587,
      user: smtpUser || '',
      pass: smtpPass || '',  // 返回授权码
      secure: smtpSecure === 'true'
    });
  } catch (err) {
    console.error('获取邮件配置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 网络配置API ============

// 获取网络配置
app.get('/api/admin/network-config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const mqttServer = await db.getConfig('mqtt_server');
    const mqttPort = await db.getConfig('mqtt_port');
    const serverUrl = await db.getConfig('server_url');
    
    res.json({
      mqttServer: mqttServer || '192.168.1.100',
      mqttPort: mqttPort ? parseInt(mqttPort) : 1883,
      serverUrl: serverUrl || ''
    });
  } catch (err) {
    console.error('获取网络配置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 保存网络配置
app.put('/api/admin/network-config', authenticateToken, requireAdmin, async (req, res) => {
  const { mqttServer, mqttPort, serverUrl } = req.body;
  
  try {
    if (mqttServer) await db.setConfig('mqtt_server', mqttServer);
    if (mqttPort) await db.setConfig('mqtt_port', String(mqttPort));
    if (serverUrl !== undefined) await db.setConfig('server_url', serverUrl);
    
    console.log(`[CONFIG] 网络配置已更新: MQTT=${mqttServer}:${mqttPort}`);
    
    res.json({ success: true, message: '网络配置已保存' });
  } catch (err) {
    console.error('保存网络配置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 保存邮件配置（仅管理员）
app.put('/api/admin/email-config', authenticateToken, requireAdmin, async (req, res) => {
  const { host, port, user, pass, secure } = req.body;
  
  try {
    if (!host || !user || !pass) {
      return res.status(400).json({ error: 'SMTP配置不完整' });
    }
    
    await db.setConfig('smtp_host', host);
    await db.setConfig('smtp_port', port.toString());
    await db.setConfig('smtp_user', user);
    await db.setConfig('smtp_pass', pass);
    await db.setConfig('smtp_secure', secure.toString());
    
    // 更新内存中的配置
    EMAIL_CONFIG.host = host;
    EMAIL_CONFIG.port = port;
    EMAIL_CONFIG.auth.user = user;
    EMAIL_CONFIG.auth.pass = pass;
    EMAIL_CONFIG.secure = secure;
    
    // 重置transporter以使用新配置
    emailTransporter = null;
    
    res.json({ success: true, message: '邮件配置已保存' });
  } catch (err) {
    console.error('保存邮件配置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建设备
app.post('/api/devices', authenticateToken, requirePermission(PERMISSIONS.DEVICE_ADD), async (req, res) => {
  const { deviceId, name, type } = req.body;
  
  try {
    await db.createDevice(deviceId, name, type);
    res.json({ success: true, deviceId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除设备
app.delete('/api/devices/:deviceId', authenticateToken, requirePermission(PERMISSIONS.DEVICE_DELETE), async (req, res) => {
  const { deviceId } = req.params;
  
  try {
    const result = await db.deleteDevice(deviceId);
    if (result.changes === 0) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    // 如果设备在线，从在线列表移除
    onlineDevices.delete(deviceId);
    
    res.json({ success: true, message: '设备已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取设备列表
app.get('/api/devices', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  try {
    const devices = await db.getAllDevices();
    // 合并在线状态
    const devicesWithStatus = devices.map(device => ({
      ...device,
      online: onlineDevices.has(device.device_id),
      ...onlineDevices.get(device.device_id)
    }));
    res.json(devicesWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有 MQTT 在线设备（已入库和未入库）
app.get('/api/devices/online', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  try {
    // 获取已入库的设备ID列表
    const registeredDevices = await db.getAllDevices();
    const registeredIds = new Set(registeredDevices.map(d => d.device_id));
    
    // 构建在线设备列表，包含注册状态
    const onlineList = Array.from(onlineDevices.entries()).map(([deviceId, info]) => ({
      deviceId,
      ip: info.ip,
      rssi: info.rssi,
      version: info.version,
      lastSeen: info.lastSeen,
      registered: registeredIds.has(deviceId)
    }));
    
    res.json({
      total: onlineList.length,
      online: onlineList.filter(d => d.registered).length,
      unregistered: onlineList.filter(d => !d.registered).length,
      devices: onlineList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 发现未入库的在线设备
app.get('/api/devices/discover', authenticateToken, requirePermission(PERMISSIONS.DEVICE_ADD), async (req, res) => {
  try {
    // 获取已入库的设备ID列表
    const registeredDevices = await db.getAllDevices();
    const registeredIds = new Set(registeredDevices.map(d => d.device_id));
    
    // 筛选未入库的在线设备
    const undiscoveredDevices = Array.from(onlineDevices.entries())
      .filter(([deviceId]) => !registeredIds.has(deviceId))
      .map(([deviceId, info]) => ({
        deviceId,
        ip: info.ip,
        rssi: info.rssi,
        version: info.version,
        lastSeen: info.lastSeen
      }));
    
    res.json({
      total: undiscoveredDevices.length,
      devices: undiscoveredDevices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 批量添加设备
app.post('/api/devices/batch-add', authenticateToken, requirePermission(PERMISSIONS.DEVICE_ADD), async (req, res) => {
  const { devices } = req.body;
  
  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: '请提供设备列表' });
  }
  
  try {
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const device of devices) {
      try {
        // 如果设备已存在，跳过
        const existing = await db.getDeviceById(device.deviceId);
        if (existing) {
          results.failed++;
          results.errors.push({ deviceId: device.deviceId, error: '设备已存在' });
          continue;
        }
        
        await db.createDevice(device.deviceId, device.name || device.deviceId, device.type || 'other');
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ deviceId: device.deviceId, error: err.message });
      }
    }
    
    res.json({
      success: true,
      message: `成功添加 ${results.success} 个设备`,
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取设备详情
app.get('/api/devices/:deviceId', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  try {
    const device = await db.getDeviceById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    
    const onlineInfo = onlineDevices.get(req.params.deviceId);
    const groups = await db.getGroupsByDevice(req.params.deviceId);
    res.json({
      ...device,
      online: !!onlineInfo,
      ...onlineInfo,
      groups
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 设备分组管理 ============

// 获取所有分组
app.get('/api/groups', authenticateToken, requirePermission(PERMISSIONS.GROUP_VIEW), async (req, res) => {
  try {
    const groups = await db.getAllGroups();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取设备列表（带分组信息）
app.get('/api/devices/with-groups', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  try {
    const devices = await db.getDevicesWithGroups();
    const devicesWithStatus = devices.map(device => ({
      ...device,
      online: onlineDevices.has(device.device_id)
    }));
    res.json(devicesWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建分组
app.post('/api/groups', authenticateToken, requirePermission(PERMISSIONS.GROUP_ADD), async (req, res) => {
  try {
    const { name, description, icon, color, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ error: '分组名称不能为空' });
    }
    const id = await db.createGroup(name, description, icon, color, sort_order);
    db.addUserLog(req.user.userId, req.user.username, 'group_create', `创建分组: ${name}`, req.ip);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新分组
app.put('/api/groups/:id', authenticateToken, requirePermission(PERMISSIONS.GROUP_EDIT), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, sort_order } = req.body;
    const group = await db.getGroupById(id);
    await db.updateGroup(id, name, description, icon, color, sort_order);
    db.addUserLog(req.user.userId, req.user.username, 'group_edit', `编辑分组: ${group?.name || id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除分组
app.delete('/api/groups/:id', authenticateToken, requirePermission(PERMISSIONS.GROUP_DELETE), async (req, res) => {
  try {
    const group = await db.getGroupById(req.params.id);
    await db.deleteGroup(req.params.id);
    db.addUserLog(req.user.userId, req.user.username, 'group_delete', `删除分组: ${group?.name || req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取分组下的设备
app.get('/api/groups/:id/devices', authenticateToken, requirePermission(PERMISSIONS.GROUP_VIEW), async (req, res) => {
  try {
    const devices = await db.getDevicesByGroup(req.params.id);
    const devicesWithStatus = devices.map(device => ({
      ...device,
      online: onlineDevices.has(device.device_id)
    }));
    res.json(devicesWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加设备到分组
app.post('/api/groups/:id/devices', authenticateToken, requirePermission(PERMISSIONS.GROUP_DEVICE_ADD), async (req, res) => {
  try {
    const { deviceId } = req.body;
    await db.addDeviceToGroup(req.params.id, deviceId);
    const group = await db.getGroupById(req.params.id);
    db.addUserLog(req.user.userId, req.user.username, 'group_device_add', `添加设备 ${deviceId} 到分组 ${group?.name || req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 从分组移除设备
app.delete('/api/groups/:groupId/devices/:deviceId', authenticateToken, requirePermission(PERMISSIONS.GROUP_DEVICE_REMOVE), async (req, res) => {
  try {
    const group = await db.getGroupById(req.params.groupId);
    await db.removeDeviceFromGroup(req.params.groupId, req.params.deviceId);
    db.addUserLog(req.user.userId, req.user.username, 'group_device_remove', `从分组 ${group?.name || req.params.groupId} 移除设备 ${req.params.deviceId}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 批量添加设备到分组
app.post('/api/groups/:id/devices/batch', authenticateToken, requirePermission(PERMISSIONS.GROUP_DEVICE_ADD), async (req, res) => {
  try {
    const { deviceIds } = req.body;
    const group = await db.getGroupById(req.params.id);
    for (const deviceId of deviceIds) {
      await db.addDeviceToGroup(req.params.id, deviceId);
    }
    db.addUserLog(req.user.userId, req.user.username, 'group_device_add_batch', `批量添加 ${deviceIds.length} 台设备到分组 ${group?.name || req.params.id}`, req.ip);
    res.json({ success: true, count: deviceIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 清空分组下的所有设备
app.delete('/api/groups/:id/devices/all', authenticateToken, requirePermission(PERMISSIONS.GROUP_DEVICE_CLEAR), async (req, res) => {
  try {
    const group = await db.getGroupById(req.params.id);
    const count = (await db.getDevicesByGroup(req.params.id)).length;
    await db.clearGroupDevices(req.params.id);
    db.addUserLog(req.user.userId, req.user.username, 'group_device_clear', `清空分组 ${group?.name || req.params.id} 的所有设备 (${count}台)`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 移动设备到其他分组
app.post('/api/groups/move-devices', authenticateToken, requirePermission(PERMISSIONS.GROUP_DEVICE_MOVE), async (req, res) => {
  try {
    const { deviceIds, fromGroupId, toGroupId } = req.body;
    if (!deviceIds || !fromGroupId || !toGroupId) {
      return res.status(400).json({ error: '参数不完整' });
    }
    const fromGroup = await db.getGroupById(fromGroupId);
    const toGroup = await db.getGroupById(toGroupId);
    for (const deviceId of deviceIds) {
      await db.moveDeviceToGroup(deviceId, fromGroupId, toGroupId);
    }
    db.addUserLog(req.user.userId, req.user.username, 'group_device_move', `移动 ${deviceIds.length} 台设备从分组 ${fromGroup?.name || fromGroupId} 到 ${toGroup?.name || toGroupId}`, req.ip);
    res.json({ success: true, count: deviceIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新设备信息
app.put('/api/devices/:deviceId', authenticateToken, requirePermission(PERMISSIONS.DEVICE_EDIT), async (req, res) => {
  const { deviceId } = req.params;
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '设备名称不能为空' });
  }
  
  try {
    const result = await db.updateDevice(deviceId, name.trim());
    if (result.changes === 0) {
      return res.status(404).json({ error: '设备不存在' });
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取设备数据历史
app.get('/api/devices/:deviceId/data', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  
  try {
    const data = await db.getDeviceData(req.params.deviceId, parseInt(limit), parseInt(offset));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取设备图表数据（按时间范围）
app.get('/api/devices/:deviceId/chart', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  const { deviceId } = req.params;
  const { period = '1h' } = req.query;  // 1h, 6h, 24h, 7d, 30d
  
  // 计算时间范围（使用本地时间）
  const now = new Date();
  let startTime;
  
  switch (period) {
    case '1h':   startTime = new Date(now - 60 * 60 * 1000); break;
    case '6h':   startTime = new Date(now - 6 * 60 * 60 * 1000); break;
    case '24h':  startTime = new Date(now - 24 * 60 * 60 * 1000); break;
    case '7d':   startTime = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
    case '30d':  startTime = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
    default:     startTime = new Date(now - 60 * 60 * 1000);
  }
  
  try {
    // 使用本地时间格式查询，避免时区问题
    const formatLocalDate = (d) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const rawData = await db.getDeviceDataByTimeRange(deviceId, formatLocalDate(startTime), formatLocalDate(now));
    
    // 解析JSON数据并格式化
    const chartData = rawData.map(item => {
      try {
        const parsed = typeof item.data_value === 'string' ? JSON.parse(item.data_value) : item.data_value;
        // 转换时间戳为时间戳数字（毫秒）
        const timeMs = new Date(item.created_at).getTime();
        return {
          time: timeMs,
          ...parsed
        };
      } catch (e) {
        return { time: new Date(item.created_at).getTime(), raw: item.data_value };
      }
    });
    
    // 提取所有数值字段
    const fields = new Set();
    chartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'time' && key !== 'type' && typeof item[key] === 'number') {
          fields.add(key);
        }
      });
    });
    
    res.json({
      success: true,
      deviceId,
      period,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      fields: Array.from(fields),
      data: chartData,
      total: chartData.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取字段统计信息
app.get('/api/devices/:deviceId/stats', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  const { deviceId } = req.params;
  const { field, period = '24h' } = req.query;
  
  if (!field) {
    return res.status(400).json({ error: '缺少 field 参数' });
  }
  
  try {
    const stats = await db.getDeviceDataStats(deviceId, field, 'hour', 200);
    res.json({
      success: true,
      deviceId,
      field,
      stats: stats.reverse()  // 按时间正序
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 发送命令到设备
app.post('/api/devices/:deviceId/command', authenticateToken, requirePermission(PERMISSIONS.DEVICE_CONTROL), async (req, res) => {
  const { command, params = {} } = req.body;
  const { deviceId } = req.params;
  
  if (!onlineDevices.has(deviceId)) {
    return res.status(400).json({ error: '设备不在线' });
  }
  
  const topic = `device/${deviceId}/command`;
  mqttClient.publish(topic, JSON.stringify({
    command,
    params,
    timestamp: Date.now()
  }));
  
  // 记录命令
  await db.insertCommandLog(deviceId, command, params);
  
  // 记录操作日志
  const paramsStr = Object.keys(params).length > 0 ? `，参数: ${JSON.stringify(params)}` : '';
  db.addUserLog(req.user.userId, req.user.username, 'device_control', 
    `向设备 ${deviceId} 发送命令: ${command}${paramsStr}`, req.ip);
  
  res.json({ success: true, message: '命令已发送' });
});

// 蓝牙配网接口
app.post('/api/bluetooth/provision', authenticateToken, async (req, res) => {
  const { deviceId, wifiSsid, wifiPassword } = req.body;
  
  if (!wifiSsid || !wifiPassword) {
    return res.status(400).json({ error: 'WiFi名称和密码不能为空' });
  }
  
  try {
    // 检查蓝牙服务是否可用
    if (!bleService) {
      return res.status(500).json({ error: '蓝牙服务未初始化，请检查依赖是否安装' });
    }
    
    // 如果蓝牙模块已连接，使用蓝牙发送
    if (bleService && bleService.isConnected) {
      console.log(`🔵 通过蓝牙发送配网数据到设备 ${deviceId}`);
      const result = await bleService.provision(wifiSsid, wifiPassword);
      
      if (result.success) {
        res.json({ success: true, message: '配网成功，设备正在连接WiFi' });
      } else {
        res.status(400).json({ error: result.message });
      }
    } else {
      // 降级方案：通过MQTT发送（适用于已连接WiFi的设备）
      console.log(`⚠️ 蓝牙模块未连接，降级为MQTT配网`);
      const topic = `device/${deviceId}/bluetooth/provision`;
      mqttClient.publish(topic, JSON.stringify({
        ssid: wifiSsid,
        password: wifiPassword,
        timestamp: Date.now()
      }));
      
      res.json({ success: true, message: '配网信息已通过MQTT发送（设备需已连接WiFi）' });
    }
  } catch (err) {
    console.error('蓝牙配网失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取蓝牙服务状态
app.get('/api/bluetooth/status', authenticateToken, async (req, res) => {
  try {
    if (!bleService) {
      return res.json({ 
        connected: false, 
        port: null, 
        name: null, 
        address: null,
        message: '蓝牙服务未加载'
      });
    }
    
    res.json({
      connected: bleService.isConnected,
      port: bleService.serialPort && bleService.serialPort.path || null,
      name: bleService.moduleName || '未知',
      address: bleService.moduleAddress || '未知'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取可用串口列表（需要安装 serialport）
app.get('/api/bluetooth/ports', authenticateToken, async (req, res) => {
  try {
    // 动态导入serialport
    let SerialPort;
    try {
      SerialPort = require('serialport');
    } catch (e) {
      return res.json({ ports: [], error: '请安装 serialport: npm install serialport' });
    }
    
    const ports = await SerialPort.list();
    const portNames = ports.map(p => p.path);
    res.json({ ports: portNames });
  } catch (err) {
    res.json({ ports: [], error: err.message });
  }
});

// 连接蓝牙模块
app.post('/api/bluetooth/connect', authenticateToken, async (req, res) => {
  const { port, baudRate = 9600 } = req.body;
  
  if (!port) {
    return res.status(400).json({ error: '请指定串口' });
  }
  
  try {
    // 关闭现有连接
    if (bleService) {
      bleService.close();
    }
    
    // 创建新的蓝牙服务实例
    bleService = new BLEService();
    await bleService.init(port, baudRate);
    
    res.json({ success: true, message: '蓝牙模块连接成功' });
  } catch (err) {
    console.error('蓝牙连接失败:', err);
    res.status(500).json({ error: `连接失败: ${err.message}` });
  }
});

// 断开蓝牙模块
app.post('/api/bluetooth/disconnect', authenticateToken, async (req, res) => {
  try {
    if (bleService) {
      bleService.close();
      bleService = null;
    }
    res.json({ success: true, message: '已断开连接' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 扫描蓝牙设备
app.post('/api/bluetooth/scan', authenticateToken, async (req, res) => {
  const { timeout = 10000 } = req.body;
  
  if (!bleService || !bleService.isConnected) {
    return res.status(400).json({ error: '蓝牙模块未连接' });
  }
  
  try {
    const devices = await bleService.scanDevices(timeout);
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取系统状态
app.get('/api/system/status', authenticateToken, requirePermission(PERMISSIONS.SYSTEM_VIEW), (req, res) => {
  res.json({
    onlineDevices: onlineDevices.size,
    wsClients: wsClients.size,
    mqttConnected: mqttClient.connected,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// ============ 设备协议管理 ============

// 获取支持的设备协议列表
app.get('/api/protocols', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), (req, res) => {
  const protocols = ProtocolAdapter.getSupportedProtocols();
  res.json({
    success: true,
    protocols,
    total: protocols.length
  });
});

// 获取特定协议的MQTT主题配置
app.get('/api/protocols/:type/topics', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), (req, res) => {
  const { type } = req.params;
  const topics = ProtocolAdapter.getMQTTTopics(type);
  res.json({
    success: true,
    deviceType: type,
    topics
  });
});

// 测试协议解析
app.post('/api/protocols/:type/test', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), (req, res) => {
  const { type } = req.params;
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({ error: '缺少测试数据' });
  }
  
  const result = ProtocolAdapter.parse(type, data);
  res.json({
    success: true,
    deviceType: type,
    result
  });
});

// 获取用户日志列表
app.get('/api/admin/logs', authenticateToken, requirePermission(PERMISSIONS.LOG_VIEW), async (req, res) => {
  try {
    const { page = 1, limit = 20, action, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const logs = await db.getUserLogs(parseInt(limit), offset, action || null, startDate || null, endDate || null);
    const countResult = await db.countUserLogs(action || null, startDate || null, endDate || null);

    res.json({
      logs,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('获取日志错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 发送验证码（忘记密码）
app.post('/api/auth/send-code', async (req, res) => {
  const { username } = req.body;
  
  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: '用户名不存在' });
    }
    
    // 获取用户配置的邮箱
    const userEmail = await db.getConfig(`user_email_${user.id}`);
    if (!userEmail) {
      return res.status(400).json({ error: '该用户未配置邮箱，请联系管理员' });
    }
    
    const code = generateCode(6);
    await db.saveVerificationCode(username, code, 10);
    
    // 发送邮件
    const emailSent = await sendEmail(
      userEmail,
      'IoT平台 - 密码重置验证码',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #409EFF;">IoT平台 密码重置</h2>
          <p>您好，<strong>${username}</strong></p>
          <p>您收到了这封邮件是因为有人请求重置您的账户密码。</p>
          <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; color: #666; margin: 0;">您的验证码是</p>
            <p style="font-size: 36px; font-weight: bold; color: #409EFF; margin: 10px 0;">${code}</p>
            <p style="font-size: 12px; color: #999; margin: 0;">有效期10分钟</p>
          </div>
          <p style="color: #666; font-size: 14px;">如果您没有请求重置密码，请忽略此邮件。</p>
        </div>
      `
    );
    
    if (!emailSent) {
      // 邮件发送失败
      console.log(`⚠️ 验证码已生成但邮件发送失败（用户: ${username}, 邮箱: ${userEmail}）`);
      return res.status(500).json({ error: '邮件发送失败，请检查邮件配置是否正确' });
    }
    
    res.json({ 
      success: true, 
      message: `验证码已发送至 ${userEmail}`,
      email_hint: userEmail
    });
  } catch (err) {
    console.error('发送验证码错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 重置密码
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, code, newPassword } = req.body;
  
  try {
    if (!username || !code || !newPassword) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '密码至少6个字符' });
    }
    
    const verification = await db.verifyCode(username, code);
    if (!verification) {
      return res.status(400).json({ error: '验证码无效或已过期' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updatePassword(username, hashedPassword);
    await db.markCodeUsed(verification.id);
    
    res.json({ success: true, message: '密码重置成功，请使用新密码登录' });
  } catch (err) {
    console.error('重置密码错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 管理员接口 ============

// 获取用户列表（含角色信息）
app.get('/api/admin/users', authenticateToken, requirePermission(PERMISSIONS.USER_VIEW), async (req, res) => {
  try {
    const users = await db.getAllUsers();
    // 获取每个用户的角色
    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const roles = await db.getUserRoles(user.id);
      return { ...user, roles };
    }));
    res.json(usersWithRoles);
  } catch (err) {
    console.error('获取用户列表错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加用户（管理员）
app.post('/api/admin/users', authenticateToken, requirePermission(PERMISSIONS.USER_ADD), async (req, res) => {
  const { username, displayName, password, roleIds } = req.body;
  
  try {
    if (!username || !password) {
      return res.status(400).json({ error: '账号和密码不能为空' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: '账号至少3个字符' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6个字符' });
    }
    
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({ error: '请至少选择一个角色' });
    }
    
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: '账号已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.createUser(username, hashedPassword, displayName);
    
    // 分配角色
    await db.setUserRoles(result.lastID, roleIds, req.user.userId);
    
    // 记录日志
    const roles = await db.getRolesByIds(roleIds);
    const roleNames = roles.map(r => r.name).join(', ');
    db.addUserLog(req.user.userId, req.user.username, 'user_add', `创建用户: ${username}，分配角色: ${roleNames}`, req.ip);
    
    res.json({ success: true, message: `用户 ${username} 创建成功` });
  } catch (err) {
    console.error('创建用户错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户角色分配
app.put('/api/admin/users/:id/roles', authenticateToken, requirePermission(PERMISSIONS.USER_ROLE), async (req, res) => {
  const { id } = req.params;
  const { roleIds } = req.body;
  
  try {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({ error: '请至少选择一个角色' });
    }
    
    // 禁止修改自己的角色
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: '不能修改自己的角色' });
    }
    
    const targetUser = await db.getUserById(parseInt(id));
    
    // 获取原来的角色
    const oldRoles = await db.getUserRoles(parseInt(id));
    const oldRoleNames = oldRoles.map(r => r.name).join(', ') || '(无)';
    
    await db.setUserRoles(parseInt(id), roleIds, req.user.userId);
    
    // 记录日志
    const roles = await db.getRolesByIds(roleIds);
    const newRoleNames = roles.map(r => r.name).join(', ');
    db.addUserLog(req.user.userId, req.user.username, 'user_role', 
      `修改用户 ${targetUser?.username} 的角色: ${oldRoleNames} → ${newRoleNames}`, req.ip);
    
    res.json({ success: true, message: '角色分配更新成功' });
  } catch (err) {
    console.error('更新用户角色错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户信息（管理员）
app.put('/api/admin/users/:id', authenticateToken, requirePermission(PERMISSIONS.USER_EDIT), async (req, res) => {
  const { id } = req.params;
  const { username, displayName } = req.body;
  
  try {
    if (!username) {
      return res.status(400).json({ error: '账号不能为空' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: '账号至少3个字符' });
    }
    
    // 获取修改前的用户信息
    const oldUser = await db.getUserById(parseInt(id));
    
    // 检查账号是否被其他用户使用
    const existingUser = await db.getUserByUsername(username);
    if (existingUser && existingUser.id !== parseInt(id)) {
      return res.status(409).json({ error: '账号已被其他用户使用' });
    }
    
    // 构建变更详情
    const changes = [];
    if (username && username !== oldUser?.username) {
      changes.push(`账号: ${oldUser?.username} → ${username}`);
    }
    if (displayName !== undefined && displayName !== oldUser?.display_name) {
      changes.push(`显示名: ${oldUser?.display_name || '(空)'} → ${displayName || username}`);
    }
    
    // 更新账号
    await db.updateUsername(parseInt(id), username);
    
    // 更新显示名称
    if (displayName !== undefined) {
      await db.updateUserDisplayName(parseInt(id), displayName || username);
    }
    
    // 记录日志
    const detail = changes.length > 0 
      ? `修改用户 ${oldUser?.username}: ${changes.join(', ')}`
      : `编辑用户 ${username} 信息`;
    db.addUserLog(req.user.userId, req.user.username, 'user_edit', detail, req.ip);
    
    res.json({ success: true, message: '用户信息已更新' });
  } catch (err) {
    console.error('更新用户信息错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户（管理员）
app.delete('/api/admin/users/:id', authenticateToken, requirePermission(PERMISSIONS.USER_DELETE), async (req, res) => {
  const { id } = req.params;
  
  try {
    // 禁止删除自己
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: '不能删除自己' });
    }
    
    const targetUser = await db.getUserById(parseInt(id));
    const result = await db.deleteUser(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 记录日志
    db.addUserLog(req.user.userId, req.user.username, 'user_delete', `删除用户: ${targetUser?.username}`, req.ip);
    
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    console.error('删除用户错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 角色权限接口 ============

// 同步权限到数据库（管理员专用）
app.post('/api/admin/sync-permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allPermissions = [
      // 菜单权限
      { code: PERMISSIONS.MENU_DEVICE, name: '设备管理菜单', category: '菜单权限' },
      { code: PERMISSIONS.MENU_BLUETOOTH, name: '蓝牙配网页面', category: '菜单权限' },
      { code: PERMISSIONS.MENU_USER, name: '用户管理菜单', category: '菜单权限' },
      { code: PERMISSIONS.MENU_ROLE, name: '角色权限菜单', category: '菜单权限' },
      { code: PERMISSIONS.MENU_SETTINGS, name: '系统设置菜单', category: '菜单权限' },
      // 设备权限
      { code: PERMISSIONS.DEVICE_VIEW, name: '查看设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_ADD, name: '添加设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_EDIT, name: '编辑设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_DELETE, name: '删除设备', category: '设备管理' },
      { code: PERMISSIONS.DEVICE_CONTROL, name: '控制设备', category: '设备管理' },
      // 用户权限
      { code: PERMISSIONS.USER_VIEW, name: '查看用户', category: '用户管理' },
      { code: PERMISSIONS.USER_ADD, name: '添加用户', category: '用户管理' },
      { code: PERMISSIONS.USER_EDIT, name: '编辑用户', category: '用户管理' },
      { code: PERMISSIONS.USER_DELETE, name: '删除用户', category: '用户管理' },
      { code: PERMISSIONS.USER_ROLE, name: '分配角色', category: '用户管理' },
      // 角色权限
      { code: PERMISSIONS.ROLE_VIEW, name: '查看角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_ADD, name: '创建角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_EDIT, name: '编辑角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_DELETE, name: '删除角色', category: '角色权限' },
      { code: PERMISSIONS.ROLE_PERMISSION, name: '分配权限', category: '角色权限' },
      // 系统设置权限
      { code: PERMISSIONS.SYSTEM_VIEW, name: '查看系统', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_BASIC, name: '基本信息', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_NETWORK, name: '网络配置', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_EMAIL, name: '邮件服务', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_PASSWORD, name: '修改密码', category: '系统设置' },
      { code: PERMISSIONS.SETTINGS_DATABASE, name: '数据库配置', category: '系统设置' },
    ];
    
    let addedCount = 0;
    let allPermIds = [];
    
    for (const p of allPermissions) {
      const existing = await db.getPermissionByCode(p.code);
      if (!existing) {
        await db.createPermission(p.code, p.name, p.category);
        addedCount++;
      }
      // 收集所有权限ID
      const perm = await db.getPermissionByCode(p.code);
      if (perm) allPermIds.push(perm.id);
    }
    
    // 确保admin角色拥有所有权限
    const adminRole = await db.getRoleByCode('admin');
    if (adminRole && allPermIds.length > 0) {
      await db.setRolePermissions(adminRole.id, allPermIds);
      console.log(`✅ Admin角色已同步 ${allPermIds.length} 个权限`);
    }
    
    res.json({ success: true, message: `权限同步完成，新增 ${addedCount} 个权限，Admin已获得全部权限` });
  } catch (err) {
    console.error('同步权限错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有角色
app.get('/api/admin/roles', authenticateToken, requirePermission(PERMISSIONS.ROLE_VIEW), async (req, res) => {
  try {
    const roles = await db.getAllRoles();
    const rolesWithPerms = await Promise.all(roles.map(async (role) => {
      const permissions = await db.getRolePermissions(role.id);
      return { 
        ...role, 
        permissions: permissions.map(p => p.code),
        permissionNames: permissions.map(p => p.name)
      };
    }));
    res.json(rolesWithPerms);
  } catch (err) {
    console.error('获取角色列表错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个角色详情（含权限名称）
app.get('/api/admin/roles/:id', authenticateToken, requirePermission(PERMISSIONS.ROLE_VIEW), async (req, res) => {
  try {
    const role = await db.getRoleById(parseInt(req.params.id));
    if (!role) {
      return res.status(404).json({ error: '角色不存在' });
    }
    const permissions = await db.getRolePermissions(role.id);
    res.json({
      ...role,
      permissions: permissions.map(p => p.code),
      permissionNames: permissions.map(p => p.name)
    });
  } catch (err) {
    console.error('获取角色详情错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有权限（树形结构）
app.get('/api/admin/permissions', authenticateToken, requirePermission(PERMISSIONS.ROLE_VIEW), async (req, res) => {
  try {
    const permissions = await db.getAllPermissions();
    
    // 菜单与权限的树形结构定义 - 三级结构
    const menuTree = [
      {
        menuId: 'menu_device_manage',
        name: '设备管理',
        children: [
          {
            menuId: 'menu_device',
            name: '设备列表',
            children: permissions.filter(p => 
              ['device:view', 'device:add', 'device:edit', 'device:delete', 'device:control'].includes(p.code)
            ).map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_group',
            name: '设备分组',
            children: permissions.filter(p => 
              ['group:view', 'group:add', 'group:edit', 'group:delete', 'group:device:add', 'group:device:remove', 'group:device:move', 'group:device:clear'].includes(p.code)
            ).map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_firmware',
            name: '固件管理',
            children: permissions.filter(p => 
              ['firmware:view', 'firmware:upload', 'firmware:download', 'firmware:delete', 'firmware:upgrade'].includes(p.code)
            ).map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_bluetooth',
            name: '蓝牙配网',
            children: permissions.filter(p => 
              ['bluetooth:view'].includes(p.code)
            ).map(p => ({ id: p.id, code: p.code, name: p.name }))
          }
        ]
      },
      {
        menuId: 'menu_user',
        name: '用户管理',
        children: permissions.filter(p => 
          ['user:view', 'user:add', 'user:edit', 'user:delete', 'user:role'].includes(p.code)
        ).map(p => ({ id: p.id, code: p.code, name: p.name }))
      },
      {
        menuId: 'menu_role',
        name: '角色权限',
        children: permissions.filter(p => 
          ['role:view', 'role:add', 'role:edit', 'role:delete', 'role:permission'].includes(p.code)
        ).map(p => ({ id: p.id, code: p.code, name: p.name }))
      },
      {
        menuId: 'menu_settings',
        name: '系统设置',
        children: [
          {
            menuId: 'menu_settings_basic',
            name: '基本信息',
            children: permissions.filter(p => p.code === 'settings:basic').map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_settings_network',
            name: '网络配置',
            children: permissions.filter(p => p.code === 'settings:network').map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_settings_email',
            name: '邮件服务',
            children: permissions.filter(p => p.code === 'settings:email').map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_settings_password',
            name: '修改密码',
            children: permissions.filter(p => p.code === 'settings:password').map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_settings_database',
            name: '数据库配置',
            children: permissions.filter(p => p.code === 'settings:database').map(p => ({ id: p.id, code: p.code, name: p.name }))
          },
          {
            menuId: 'menu_logs',
            name: '操作日志',
            children: permissions.filter(p => p.code === 'log:view').map(p => ({ id: p.id, code: p.code, name: p.name }))
          }
        ]
      }
    ];
    
    res.json(menuTree);
  } catch (err) {
    console.error('获取权限列表错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建角色
app.post('/api/admin/roles', authenticateToken, requirePermission(PERMISSIONS.ROLE_ADD), async (req, res) => {
  const { code, name, description, permissionIds } = req.body;
  
  try {
    if (!code || !name) {
      return res.status(400).json({ error: '角色代码和名称不能为空' });
    }
    
    if (!/^[a-z_]+$/.test(code)) {
      return res.status(400).json({ error: '角色代码只能包含小写字母和下划线' });
    }
    
    const result = await db.createRole(code, name, description);
    
    let permNames = '';
    if (permissionIds && Array.isArray(permissionIds)) {
      await db.setRolePermissions(result.lastID, permissionIds);
      const perms = await db.getRolePermissions(result.lastID);
      permNames = perms.map(p => p.name).join(', ');
    }
    
    // 记录日志
    const detail = permNames ? `创建角色: ${name}，分配权限: ${permNames}` : `创建角色: ${name}`;
    db.addUserLog(req.user.userId, req.user.username, 'role_add', detail, req.ip);
    
    res.json({ success: true, message: `角色 ${name} 创建成功` });
  } catch (err) {
    console.error('创建角色错误:', err);
    res.status(500).json({ error: err.message.includes('UNIQUE') ? '角色代码已存在' : '服务器错误' });
  }
});

// 更新角色
app.put('/api/admin/roles/:id', authenticateToken, requirePermission(PERMISSIONS.ROLE_EDIT), async (req, res) => {
  const { id } = req.params;
  const { name, description, permissionIds } = req.body;
  
  try {
    const role = await db.getRoleById(parseInt(id));
    if (!role) {
      return res.status(404).json({ error: '角色不存在' });
    }
    
    // 不能修改预定义角色代码
    if (['admin', 'operator', 'viewer'].includes(role.code)) {
      return res.status(400).json({ error: '不能修改预定义角色' });
    }
    
    // 获取原来的权限
    const oldPerms = await db.getRolePermissions(parseInt(id));
    const oldPermNames = oldPerms.map(p => p.name).join(', ') || '(无)';
    
    await db.updateRole(parseInt(id), name, description);
    
    let newPermNames = oldPermNames;
    if (permissionIds && Array.isArray(permissionIds)) {
      await db.setRolePermissions(parseInt(id), permissionIds);
      const newPerms = await db.getRolePermissions(parseInt(id));
      newPermNames = newPerms.map(p => p.name).join(', ');
    }
    
    // 构建变更详情
    const changes = [];
    if (name !== role.name) {
      changes.push(`名称: ${role.name} → ${name}`);
    }
    if (description !== role.description) {
      changes.push(`描述: ${role.description || '(空)'} → ${description || '(空)'}`);
    }
    if (newPermNames !== oldPermNames) {
      changes.push(`权限: ${oldPermNames} → ${newPermNames}`);
    }
    
    // 记录日志
    const detail = changes.length > 0 
      ? `编辑角色 ${role.name}: ${changes.join(', ')}`
      : `编辑角色 ${name} 信息`;
    db.addUserLog(req.user.userId, req.user.username, 'role_edit', detail, req.ip);
    
    res.json({ success: true, message: '角色更新成功' });
  } catch (err) {
    console.error('更新角色错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除角色
app.delete('/api/admin/roles/:id', authenticateToken, requirePermission(PERMISSIONS.ROLE_DELETE), async (req, res) => {
  const { id } = req.params;
  
  try {
    const role = await db.getRoleById(parseInt(id));
    if (!role) {
      return res.status(404).json({ error: '角色不存在' });
    }
    
    // 不能删除预定义角色
    if (['admin', 'operator', 'viewer'].includes(role.code)) {
      return res.status(400).json({ error: '不能删除预定义角色' });
    }
    
    await db.deleteRole(parseInt(id));
    
    // 记录日志
    db.addUserLog(req.user.userId, req.user.username, 'role_delete', `删除角色: ${role.name}`, req.ip);
    
    res.json({ success: true, message: '角色已删除' });
  } catch (err) {
    console.error('删除角色错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 固件存储目录
const FIRMWARE_DIR = path.join(__dirname, 'firmware');
const fsExtra = require('fs-extra');

// 确保固件目录存在
fsExtra.ensureDirSync(FIRMWARE_DIR);

// 固件文件公开访问（无需认证，ESP32可直接下载）
app.use('/firmware', express.static(FIRMWARE_DIR));

// 获取固件列表
app.get('/api/firmware', authenticateToken, requirePermission(PERMISSIONS.FIRMWARE_VIEW), async (req, res) => {
  try {
    const files = await fsExtra.readdir(FIRMWARE_DIR);
    const firmwares = [];
    const baseUrl = `${req.protocol}://${SERVER_HOST}:${PORT}`;
    
    for (const file of files) {
      if (file.endsWith('.bin')) {
        const stats = await fsExtra.stat(path.join(FIRMWARE_DIR, file));
        firmwares.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          url: `${baseUrl}/firmware/${file}`  // 公开URL，ESP32可直接访问
        });
      }
    }
    
    res.json(firmwares.sort((a, b) => new Date(b.created) - new Date(a.created)));
  } catch (err) {
    console.error('获取固件列表错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 上传固件
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 最大4MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.bin')) {
      cb(null, true);
    } else {
      cb(new Error('只支持.bin文件'));
    }
  }
});

app.post('/api/firmware/upload', authenticateToken, requirePermission(PERMISSIONS.FIRMWARE_UPLOAD), upload.single('firmware'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传固件文件' });
    }
    
    // 从 body 中获取 device_type 和 version
    const deviceType = req.body.device_type || 'generic';
    let version = (req.body.version || '1.0.0').toString();
    version = version.replace(/^v/i, ''); // 去掉可能的前缀v
    const filename = `${deviceType}_v${version}.bin`;
    
    // 保存文件
    const filepath = path.join(FIRMWARE_DIR, filename);
    await fsExtra.writeFile(filepath, req.file.buffer);
    
    // 记录操作日志
    await db.addUserLog(req.user.userId, req.user.username, 'firmware_upload', `上传固件: ${filename}`, req.ip);
    
    res.json({
      success: true,
      message: '固件上传成功',
      filename: filename,
      size: req.file.size
    });
  } catch (err) {
    console.error('上传固件错误:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取指定固件信息
app.get('/api/firmware/:filename', authenticateToken, requirePermission(PERMISSIONS.FIRMWARE_VIEW), async (req, res) => {
  try {
    const filepath = path.join(FIRMWARE_DIR, req.params.filename);
    
    if (!await fsExtra.pathExists(filepath)) {
      return res.status(404).json({ error: '固件不存在' });
    }
    
    const stats = await fsExtra.stat(filepath);
    res.json({
      filename: req.params.filename,
      size: stats.size,
      created: stats.birthtime
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除固件
app.delete('/api/firmware/:filename', authenticateToken, requirePermission(PERMISSIONS.FIRMWARE_DELETE), async (req, res) => {
  try {
    const filepath = path.join(FIRMWARE_DIR, req.params.filename);
    
    if (!await fsExtra.pathExists(filepath)) {
      return res.status(404).json({ error: '固件不存在' });
    }
    
    // 记录操作日志
    await db.addUserLog(req.user.userId, req.user.username, 'firmware_delete', `删除固件: ${req.params.filename}`, req.ip);
    
    await fsExtra.remove(filepath);
    res.json({ success: true, message: '固件已删除' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取设备OTA升级历史
app.get('/api/devices/:deviceId/ota/history', authenticateToken, requirePermission(PERMISSIONS.DEVICE_VIEW), async (req, res) => {
  const { deviceId } = req.params;
  
  try {
    const logs = await db.getOTALogs(deviceId, 20);
    res.json(logs);
  } catch (err) {
    console.error('获取OTA历史失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// OTA更新：通知设备下载固件
app.post('/api/devices/:deviceId/ota', authenticateToken, requirePermission(PERMISSIONS.DEVICE_CONTROL), async (req, res) => {
  const { deviceId } = req.params;
  const { firmware_url, version } = req.body;
  
  if (!firmware_url) {
    return res.status(400).json({ error: '请提供固件URL' });
  }
  
  if (!onlineDevices.has(deviceId)) {
    return res.status(400).json({ error: '设备不在线' });
  }
  
  try {
    // 通过MQTT发送OTA命令
    const topic = `device/${deviceId}/ota`;
    const payload = {
      command: 'ota_update',
      url: firmware_url,
      version: version || 'unknown',
      timestamp: Date.now()
    };
    
    mqttClient.publish(topic, JSON.stringify(payload));
    
    // 记录OTA请求
    await db.insertOTALog(deviceId, firmware_url, version, 'pending');
    
    console.log(`📦 OTA更新已下发 [${deviceId}]: ${firmware_url}`);
    
    res.json({ 
      success: true, 
      message: 'OTA更新已下发，请等待设备响应',
      deviceId,
      version
    });
  } catch (err) {
    console.error('OTA下发失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ 数据库管理 API ============

// 获取当前数据库配置
app.get('/api/admin/database/config', authenticateToken, requirePermission(PERMISSIONS.SETTINGS_DATABASE), async (req, res) => {
  try {
    res.json({
      success: true,
      config: db.getDBConfig(),
      supported: ['sqlite', 'mysql', 'postgresql']
    });
  } catch (err) {
    console.error('获取数据库配置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 测试数据库连接
app.post('/api/admin/database/test', authenticateToken, requirePermission(PERMISSIONS.SETTINGS_DATABASE), async (req, res) => {
  try {
    const { type, host, port, user, password, database } = req.body;
    const testConfig = { type, host, port, user, password, database };
    const result = await db.testConnection(testConfig);
    
    if (result.success) {
      res.json({ success: true, message: '连接成功!' });
    } else {
      res.json({ success: false, message: result.error || '连接失败' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 保存数据库配置
app.post('/api/admin/database/config', authenticateToken, requirePermission(PERMISSIONS.SETTINGS_DATABASE), async (req, res) => {
  try {
    const { type, host, port, user, password, database, path } = req.body;
    
    // 保存配置
    const newConfig = { type };
    if (type === 'sqlite') {
      newConfig.path = path || './data/database.sqlite';
    } else {
      newConfig.host = host;
      newConfig.port = port || (type === 'mysql' ? 3306 : 5432);
      newConfig.user = user;
      newConfig.password = password;
      newConfig.database = database;
    }
    
    db.saveConfig(newConfig);
    
    // 如果切换了数据库类型，需要重启服务
    res.json({ 
      success: true, 
      message: '配置已保存，重启服务后生效',
      restartRequired: db.config.type !== type
    });
  } catch (err) {
    console.error('保存数据库配置错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 重置数据库
app.post('/api/admin/database/reset', authenticateToken, requirePermission(PERMISSIONS.SETTINGS_DATABASE), async (req, res) => {
  try {
    await db.resetDatabase();
    res.json({ success: true, message: '数据库已重置，默认管理员账号: admin / admin123' });
  } catch (err) {
    console.error('重置数据库错误:', err);
    res.status(500).json({ error: err.message });
  }
});

// 固件下载（受权限保护）
app.get('/firmware/:filename', authenticateToken, requirePermission(PERMISSIONS.FIRMWARE_DOWNLOAD), (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(FIRMWARE_DIR, filename);
  
  // 安全检查：只允许下载 .bin 文件
  if (!filename.endsWith('.bin') || filename.includes('..')) {
    return res.status(403).json({ error: '禁止访问' });
  }
  
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('固件下载错误:', err);
      if (!res.headersSent) {
        res.status(404).json({ error: '固件不存在' });
      }
    }
  });
});

// ============ 启动服务器 ============

// 进程关闭时保存数据库
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  if (db.db && db.db.close) {
    db.db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n正在关闭服务器...');
  if (db.db && db.db.close) {
    db.db.close();
  }
  process.exit(0);
});

// 等待数据库初始化完成
async function startServer() {
  try {
    await db.initPromise;
    console.log('✅ 数据库初始化完成');
    
    // 前端静态文件托管
    if (fs.existsSync(FRONTEND_DIST)) {
      app.use(express.static(FRONTEND_DIST));
      // SPA 路由支持：所有未匹配的路由返回 index.html
      app.get('*', (req, res) => {
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
      });
      console.log(`🌐 前端已托管: ${FRONTEND_DIST}`);
    } else {
      console.log(`⚠️ 前端未构建（${FRONTEND_DIST} 不存在），跳过托管`);
      console.log(`   请运行: cd ../frontend && npm run build`);
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📡 WebSocket服务已启动`);
      console.log(`📦 OTA固件目录: ${FIRMWARE_DIR}`);
    });
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
    process.exit(1);
  }
}

startServer();

// 定期清理离线设备
setInterval(() => {
  const now = new Date();
  onlineDevices.forEach((device, deviceId) => {
    if (now - device.lastSeen > 60000) { // 1分钟无心跳视为离线
      console.log(`⏱️ 设备超时离线: ${deviceId}`);
      onlineDevices.delete(deviceId);
      db.updateDeviceStatus(deviceId, 'offline');
      
      // 心跳超时时记录离线日志（防抖：2分钟内不重复记录）
      const cacheTime = Date.now();
      const lastOffline = deviceOfflineCache.get(deviceId) || 0;
      if ((cacheTime - lastOffline) > 120000) {  // 120秒 = 2分钟
        deviceOfflineCache.set(deviceId, cacheTime);
        db.addUserLog(null, 'system', 'device_offline', `设备 ${deviceId} 离线（心跳超时）`, null);
      }
      
      broadcastToClients({
        type: 'device_offline',
        deviceId,
        timestamp: new Date().toISOString()
      });
    }
  });
}, 30000);

module.exports = { app, server, wss };
