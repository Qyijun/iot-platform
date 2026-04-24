/**
 * ONVIF 视频服务 - 家庭监控项目
 * 提供摄像头发现、RTSP流获取、视频播放URL
 * 数据存储在数据库中
 */

const { v4: uuidv4 } = require('uuid');

// 获取数据库实例（延迟加载避免循环依赖）
let db = null;
let dbInitPromise = null;

const getDb = async () => {
  if (!db) {
    const Database = require('./database');
    // 创建新实例并初始化
    db = new Database();
    dbInitPromise = db.initPromise;
    if (dbInitPromise) {
      await dbInitPromise;
    }
  }
  return db;
};

// ONVIF服务配置
const ONVIF_CONFIG = {
  // 默认RTSP路径
  rtspPath: '/Streaming/Channels/101',
  // 流转发端口（后端RTSP转HTTP-FLV）
  streamPort: 8888
};

// 生成RTSP URL
function getRtspUrl(camera) {
  return `rtsp://${camera.username}:${camera.password}@${camera.ip}:${camera.port}${camera.rtsp_path || ONVIF_CONFIG.rtspPath}`;
}

// 生成HTTP-FLV播放URL
function getFlvUrl(camera, baseUrl) {
  return `http://${baseUrl}/stream/${camera.camera_id}/live.flv`;
}

// 获取摄像头列表（从数据库）
async function getCameraList() {
  const database = await getDb();
  const cameras = await database.getAllCameras();

  return cameras.map(cam => ({
    id: cam.camera_id,
    name: cam.name,
    ip: cam.ip,
    location: cam.location,
    status: cam.status || 'offline',
    port: cam.port,
    rtspPath: cam.rtsp_path
  }));
}

// 获取单个摄像头信息（从数据库）
async function getCamera(cameraId) {
  const database = await getDb();
  const camera = await database.getCameraById(cameraId);

  if (!camera) return null;

  return {
    id: camera.camera_id,
    name: camera.name,
    ip: camera.ip,
    port: camera.port,
    username: camera.username,
    location: camera.location,
    status: camera.status || 'offline',
    rtsp_path: camera.rtsp_path,
    rtspUrl: getRtspUrl(camera)
  };
}

// 添加摄像头到数据库
async function addCamera(config) {
  const database = await getDb();

  const cameraId = `cam_${uuidv4().slice(0, 8)}`;
  const {
    name = `摄像头`,
    ip,
    port = 554,
    username = 'admin',
    password = '',
    location = '',
    rtspPath = ONVIF_CONFIG.rtspPath
  } = config;

  if (!ip) {
    throw new Error('IP地址不能为空');
  }

  const camera = await database.createCamera(
    cameraId, name, ip, port, username, password, location, rtspPath
  );

  return {
    id: camera.camera_id,
    name: camera.name,
    ip: camera.ip,
    port: camera.port,
    username: camera.username,
    location: camera.location,
    status: camera.status || 'offline',
    rtsp_path: camera.rtsp_path
  };
}

// 更新摄像头配置
async function updateCamera(cameraId, config) {
  const database = await getDb();

  const updates = {};
  if (config.name !== undefined) updates.name = config.name;
  if (config.ip !== undefined) updates.ip = config.ip;
  if (config.port !== undefined) updates.port = config.port;
  if (config.username !== undefined) updates.username = config.username;
  if (config.password !== undefined) updates.password = config.password;
  if (config.location !== undefined) updates.location = config.location;
  if (config.rtspPath !== undefined) updates.rtsp_path = config.rtspPath;
  if (config.status !== undefined) updates.status = config.status;

  const camera = await database.updateCamera(cameraId, updates);

  if (!camera) return null;

  return {
    id: camera.camera_id,
    name: camera.name,
    ip: camera.ip,
    port: camera.port,
    username: camera.username,
    location: camera.location,
    status: camera.status || 'offline',
    rtsp_path: camera.rtsp_path
  };
}

// 删除摄像头
async function deleteCameraById(cameraId) {
  const database = await getDb();
  return await database.deleteCamera(cameraId);
}

// 抓拍功能（预留）
async function captureImage(cameraId, baseUrl) {
  const database = await getDb();
  const camera = await database.getCameraById(cameraId);

  if (!camera) {
    return { success: false, error: '摄像头不存在' };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `capture_${cameraId}_${timestamp}.jpg`;

  return {
    success: true,
    data: {
      cameraId,
      cameraName: camera.name,
      filename,
      url: `/captures/${filename}`,
      timestamp: new Date().toISOString()
    }
  };
}

// 录像功能（预留）
async function startRecording(cameraId, duration = 60) {
  const database = await getDb();
  const camera = await database.getCameraById(cameraId);

  if (!camera) {
    return { success: false, error: '摄像头不存在' };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `record_${cameraId}_${timestamp}.mp4`;

  return {
    success: true,
    data: {
      cameraId,
      cameraName: camera.name,
      filename,
      url: `/recordings/${filename}`,
      duration,
      status: 'recording'
    }
  };
}

// 移动侦测（预留）
async function getMotionEvents(cameraId, startTime, endTime) {
  return {
    success: true,
    recordings: []
  };
}

// ONVIF设备发现（局域网扫描）
async function discoverDevices() {
  const devices = [];
  const foundIps = new Set();

  // 常用IP段扫描（可配置）
  const baseIps = ['192.168.1', '192.168.0', '10.0.0', '172.16.0'];
  const startIp = 1;
  const endIp = 254;

  console.log('开始扫描局域网摄像头...');

  // 简化扫描：尝试常见IP
  const scanPromises = [];

  for (const baseIp of baseIps) {
    for (let i = startIp; i <= Math.min(endIp, 50); i++) {
      const ip = `${baseIp}.${i}`;
      if (foundIps.has(ip)) continue;

      scanPromises.push(
        checkCamera(ip).then(result => {
          if (result) {
            foundIps.add(ip);
            devices.push(result);
            console.log(`发现摄像头: ${ip}`);
          }
        }).catch(() => {})
      );
    }
  }

  // 并发扫描（限制并发数）
  const chunkSize = 20;
  for (let i = 0; i < scanPromises.length; i += chunkSize) {
    await Promise.all(scanPromises.slice(i, i + chunkSize));
  }

  return {
    success: true,
    devices: devices,
    total: devices.length
  };
}

// 检测单个IP是否为摄像头
async function checkCamera(ip) {
  return new Promise((resolve) => {
    const http = require('http');
    const timeout = 1500;

    const req = http.get(`http://${ip}:80/onvif/device_service`, {
      timeout,
      method: 'GET'
    }, (res) => {
      req.destroy();
      // 如果有响应，可能是ONVIF设备
      if (res.statusCode === 200 || res.statusCode === 404) {
        resolve({
          ip: ip,
          port: 80,
          name: `摄像头-${ip}`,
          manufacturer: 'ONVIF',
          type: 'Camera'
        });
      } else {
        resolve(null);
      }
    });

    req.on('error', () => {
      req.destroy();
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

module.exports = {
  ONVIF_CONFIG,
  getCameraList,
  getCamera,
  addCamera,
  updateCamera,
  deleteCamera: deleteCameraById,
  getRtspUrl,
  getFlvUrl,
  captureImage,
  startRecording,
  getMotionEvents,
  discoverDevices
};
