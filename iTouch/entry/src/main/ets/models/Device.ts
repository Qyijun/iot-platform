// 设备数据模型 - 与后端API对应
export interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  location?: string;
  lastSeen?: string;
  version?: string;
  // 后端字段映射
  deviceId?: string;       // 设备ID标识
  device_id?: string;      // 后端返回的设备ID
  ip?: string;             // IP地址
  ipAddress?: string;
  macAddress?: string;     // MAC地址
  firmwareVersion?: string; // 固件版本
  rssi?: number;           // 信号强度
  voltage?: number;         // 电压
  online?: boolean;        // 在线状态
  connected?: boolean;     // 连接状态
  data?: DeviceData;
}

export interface DeviceData {
  temperature?: number;
  humidity?: number;
  switch1?: boolean;
  switch2?: boolean;
  led?: boolean;
  relay?: boolean;
  // 后端可能返回的其他数据字段
  [key: string]: any;
}

// 创建设备请求参数
export interface CreateDeviceRequest {
  name: string;
  type: string;
  location?: string;
  deviceKey?: string;
}

// API 统一响应格式
export interface ApiResponse<T> {
  code: number;
  message?: string;
  success?: boolean;
  data?: T;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  type: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  createdAt: string;
  acknowledged: boolean;
}

export interface User {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  token?: string;
}

export interface Command {
  deviceId: string;
  command: string;
  params?: any;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
