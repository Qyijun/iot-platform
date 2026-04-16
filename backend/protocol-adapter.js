/**
 * 设备协议适配器 - 统一接入多种设备
 * 
 * 支持的设备类型：
 * - ESP32 (WiFi + MQTT)
 * - STM32 (串口/蓝牙)
 * - 蓝牙设备 (BLE)
 * - LoRa设备
 * - 自定义设备 (HTTP API)
 */

class DeviceProtocolAdapter {
  constructor() {
    // 注册协议处理器
    this.protocols = new Map();
    this.registerDefaultProtocols();
  }

  /**
   * 注册默认协议
   */
  registerDefaultProtocols() {
    // ESP32 标准协议 (JSON over MQTT)
    this.register('esp32', {
      name: 'ESP32设备',
      type: 'mqtt',
      dataFormat: 'json',
      
      // 解析设备数据
      parseData: (raw) => {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          timestamp: data.timestamp || Date.now(),
          fields: {
            temperature: data.temperature ?? data.temp,
            humidity: data.humidity ?? data.hum,
            battery: data.battery ?? data.voltage,
            rssi: data.rssi ?? data.signal,
            ...data  // 其他字段
          }
        };
      },

      // 构建下发命令
      buildCommand: (cmd, params) => {
        return { command: cmd, ...params };
      },

      // 心跳间隔 (毫秒)
      heartbeatInterval: 60000,

      // 设备元数据
      metadata: {
        manufacturer: 'Espressif',
        protocol: 'MQTT',
        transport: 'WiFi'
      }
    });

    // STM32 协议
    this.register('stm32', {
      name: 'STM32设备',
      type: 'mqtt',
      dataFormat: 'binary',

      // 解析二进制数据
      parseData: (raw) => {
        // STM32 通常发送二进制数据，需要根据具体协议解析
        // 这里假设是简单的格式: [type][len][data...]
        const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
        const dataType = buffer[0];
        
        const fields = {};
        switch (dataType) {
          case 0x01: // 温度数据
            fields.temperature = buffer.readInt16BE(1) / 100;
            break;
          case 0x02: // 湿度数据
            fields.humidity = buffer.readInt16BE(1) / 100;
            break;
          case 0x03: // 综合数据
            fields.temperature = buffer.readInt16BE(1) / 100;
            fields.humidity = buffer.readInt16BE(3) / 100;
            fields.battery = buffer.readUInt16BE(5) / 1000;
            break;
          default:
            fields.raw = buffer.toString('hex');
        }
        
        return {
          timestamp: Date.now(),
          fields
        };
      },

      buildCommand: (cmd, params) => {
        // 构建STM32命令帧
        const buffer = Buffer.alloc(64);
        buffer[0] = 0xAA; // 帧头
        buffer[1] = cmd;
        // ... 根据具体协议填充
        return buffer;
      },

      heartbeatInterval: 120000,
      metadata: {
        manufacturer: 'STMicroelectronics',
        protocol: 'Custom Binary',
        transport: 'UART/MQTT'
      }
    });

    // 蓝牙设备协议
    this.register('bluetooth', {
      name: '蓝牙设备',
      type: 'ble',
      dataFormat: 'advertisement',

      parseData: (raw) => {
        // BLE广播数据解析
        const data = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
        
        return {
          timestamp: Date.now(),
          fields: {
            rssi: data.readInt8(0),
            battery: data.length > 1 ? data.readUInt8(1) : null,
            temperature: data.length > 2 ? data.readInt16BE(2) / 100 : null,
            humidity: data.length > 4 ? data.readInt16BE(4) / 100 : null
          }
        };
      },

      buildCommand: (cmd, params) => {
        return { ble_cmd: cmd, ...params };
      },

      heartbeatInterval: 0, // BLE不需要心跳
      metadata: {
        manufacturer: 'Generic',
        protocol: 'BLE GATT',
        transport: 'Bluetooth'
      }
    });

    // LoRa设备协议
    this.register('lora', {
      name: 'LoRa设备',
      type: 'mqtt',
      dataFormat: 'binary',

      parseData: (raw) => {
        const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
        
        // LoRa通常使用紧凑二进制格式
        // 假设格式: [RSSI][SNR][Temp][Hum][Bat][...]
        return {
          timestamp: Date.now(),
          fields: {
            rssi: buffer.readInt8(0) * -1,
            snr: buffer.readInt8(1),
            temperature: buffer.readInt16BE(2) / 100,
            humidity: buffer.readInt16BE(4) / 100,
            battery: buffer.readUInt16BE(6) / 1000
          }
        };
      },

      buildCommand: (cmd, params) => {
        return { lora_cmd: cmd, ...params };
      },

      heartbeatInterval: 300000, // LoRa低功耗，5分钟
      metadata: {
        manufacturer: 'Generic',
        protocol: 'LoRaWAN',
        transport: 'RF'
      }
    });

    // 通用设备协议 (默认)
    this.register('generic', {
      name: '通用设备',
      type: 'mqtt',
      dataFormat: 'json',

      parseData: (raw) => {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        
        // 递归标准化所有字段
        const fields = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'number' || typeof value === 'string') {
            fields[key] = value;
          }
        }
        
        return {
          timestamp: Date.now(),
          fields
        };
      },

      buildCommand: (cmd, params) => {
        return { command: cmd, ...params };
      },

      heartbeatInterval: 60000,
      metadata: {
        manufacturer: 'Generic',
        protocol: 'MQTT/JSON',
        transport: 'WiFi'
      }
    });
  }

  /**
   * 注册新协议
   */
  register(type, handler) {
    this.protocols.set(type, handler);
    console.log(`📋 协议注册: ${type} -> ${handler.name}`);
  }

  /**
   * 获取协议处理器
   */
  getProtocol(type) {
    return this.protocols.get(type);
  }

  /**
   * 获取所有支持的协议
   */
  getSupportedProtocols() {
    const list = [];
    for (const [type, handler] of this.protocols) {
      list.push({
        type,
        name: handler.name,
        transport: handler.metadata.transport,
        heartbeatInterval: handler.heartbeatInterval
      });
    }
    return list;
  }

  /**
   * 解析设备数据 (统一入口)
   */
  parse(deviceType, rawData) {
    const protocol = this.protocols.get(deviceType) || this.protocols.get('generic');
    
    try {
      return {
        success: true,
        protocol: protocol.name,
        ...protocol.parseData(rawData)
      };
    } catch (err) {
      console.error(`❌ 数据解析失败 [${deviceType}]:`, err.message);
      return {
        success: false,
        error: err.message,
        raw: rawData.toString('hex') || rawData
      };
    }
  }

  /**
   * 构建设备命令
   */
  buildCommand(deviceType, cmd, params = {}) {
    const protocol = this.protocols.get(deviceType) || this.protocols.get('generic');
    return protocol.buildCommand(cmd, params);
  }

  /**
   * 标准化MQTT主题
   */
  getMQTTTopics(deviceType) {
    const baseTopic = `devices/${deviceType}`;
    return {
      status: `${baseTopic}/status`,
      data: `${baseTopic}/data`,
      command: `${baseTopic}/command`,
      heartbeat: `${baseTopic}/heartbeat`
    };
  }

  /**
   * 数据校验
   */
  validate(deviceType, data) {
    const protocol = this.protocols.get(deviceType);
    if (!protocol) {
      return { valid: false, error: '未知设备类型' };
    }

    // 基本校验
    if (!data || typeof data !== 'object') {
      return { valid: false, error: '数据格式错误' };
    }

    return { valid: true };
  }

  /**
   * 数据转换 (用于存储)
   */
  transformForStorage(deviceType, rawData) {
    const parsed = this.parse(deviceType, rawData);
    
    if (!parsed.success) {
      return null;
    }

    // 转换为统一的存储格式
    return {
      deviceType,
      timestamp: parsed.timestamp,
      raw: JSON.stringify(parsed.fields),
      metrics: parsed.fields,
      metadata: this.protocols.get(deviceType)?.metadata
    };
  }
}

// 导出单例
module.exports = new DeviceProtocolAdapter();
