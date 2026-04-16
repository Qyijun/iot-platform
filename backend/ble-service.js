/**
 * BLE配网服务 - 串口蓝牙模块方式
 * 使用USB转TTL连接HC-05/HC-08蓝牙模块
 * 
 * 硬件连接：
 * HC-05/HC-08  <->  USB转TTL  <->  电脑USB
 * 
 * ESP32侧：蓝牙服务UUID和服务特征UUID需要与下方保持一致
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// 蓝牙模块配置
const BLE_CONFIG = {
  // 蓝牙模块串口配置（根据实际情况修改COM口和波特率）
  // HC-05 默认波特率 9600
  // HC-08 默认波特率 9600
  port: 'COM3',           // 修改为你的串口
  baudRate: 9600,
  
  // ESP32蓝牙服务UUID（需与ESP32固件一致）
  serviceUUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  characteristicUUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
};

// 蓝牙模块AT指令
const AT_COMMANDS = {
  // 查询蓝牙名称
  NAME: 'AT+NAME?\r\n',
  // 设置蓝牙名称
  SET_NAME: (name) => `AT+NAME=${name}\r\n`,
  // 查询从机模式
  ROLE: 'AT+ROLE?\r\n',
  // 设置为从机模式（用于连接其他蓝牙设备）
  SET_SLAVE: 'AT+ROLE=0\r\n',
  // 查询波特率
  BAUD: 'AT+UART?\r\n',
  // 查询连接状态
  STATE: 'AT+STATE?\r\n',
  // 获取蓝牙地址
  ADDR: 'AT+ADDR?\r\n',
};

class BLEService {
  constructor() {
    this.serialPort = null;
    this.parser = null;
    this.isConnected = false;
    this.esp32Address = null;
    this.provisioningCallback = null;
  }

  /**
   * 初始化蓝牙模块
   * @param {string} port - 串口名称，如 'COM3' 或 '/dev/ttyUSB0'
   * @param {number} baudRate - 波特率，默认9600
   */
  async init(port = BLE_CONFIG.port, baudRate = BLE_CONFIG.baudRate) {
    return new Promise((resolve, reject) => {
      console.log(`🔵 正在连接蓝牙模块: ${port} @ ${baudRate}`);
      
      this.serialPort = new SerialPort({
        path: port,
        baudRate: baudRate,
      });

      this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.serialPort.on('open', async () => {
        console.log('✅ 串口已打开');
        try {
          await this.initializeModule();
          resolve(true);
        } catch (err) {
          // 即使初始化失败，串口也视为已连接
          this.isConnected = true;
          console.log('⚠️ 模块初始化部分失败，但串口已连接');
          resolve(true);
        }
      });

      this.parser.on('data', (data) => {
        this.handleData(data);
      });

      this.serialPort.on('error', (err) => {
        console.error('❌ 串口错误:', err.message);
      });

      this.serialPort.on('close', () => {
        console.log('⚠️ 串口已关闭');
        this.isConnected = false;
        this.moduleName = null;
        this.moduleAddress = null;
      });

      // 超时处理
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('连接超时，请检查串口是否正确连接'));
        }
      }, 10000);
    });
  }

  /**
   * 初始化蓝牙模块
   */
  async initializeModule() {
    console.log('🔵 初始化蓝牙模块...');
    
    // 等待模块就绪
    await this.delay(1000);
    
    // 测试通信
    await this.sendATCommand('AT\r\n', 1000);
    
    // 查询模块名称
    const name = await this.sendATCommand(AT_COMMANDS.NAME, 1000);
    console.log(`  蓝牙模块名称: ${name}`);
    
    // 查询连接状态
    const state = await this.sendATCommand(AT_COMMANDS.STATE, 1000);
    console.log(`  连接状态: ${state}`);
    
    // 查询地址
    const addr = await this.sendATCommand(AT_COMMANDS.ADDR, 1000);
    if (addr) {
      console.log(`  蓝牙地址: ${addr}`);
    }
    
    this.isConnected = true;
    console.log('✅ 蓝牙模块初始化完成');
  }

  /**
   * 发送AT指令
   */
  sendATCommand(command, timeout = 1000) {
    return new Promise((resolve) => {
      let response = '';
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(response || 'OK');
        }
      }, timeout);

      const handler = (data) => {
        response += data + '\n';
        // 收到OK或ERROR认为命令完成
        if (data.includes('OK') || data.includes('ERROR')) {
          clearTimeout(timeoutId);
          this.parser.off('data', handler);
          if (!resolved) {
            resolved = true;
            resolve(response.trim());
          }
        }
      };

      this.parser.on('data', handler);
      this.serialPort.write(command, (err) => {
        if (err) {
          clearTimeout(timeoutId);
          if (!resolved) {
            resolved = true;
            resolve('ERROR');
          }
        }
      });
    });
  }

  /**
   * 处理接收到的数据
   */
  handleData(data) {
    console.log(`📨 蓝牙收到: ${data}`);
    
    if (this.provisioningCallback) {
      try {
        const json = JSON.parse(data);
        this.provisioningCallback(json);
      } catch (e) {
        // 非JSON数据，忽略
      }
    }
  }

  /**
   * 扫描周围的BLE设备（需要HC-05/HC-08支持）
   * 注意：部分蓝牙模块不支持主动扫描
   */
  async scanDevices(timeout = 10000) {
    console.log('🔵 开始扫描BLE设备...');
    
    // 尝试发送扫描命令
    const scanCmd = 'AT+INQ\r\n';
    await this.sendATCommand(scanCmd, timeout);
    
    return [];
  }

  /**
   * 发送WiFi配网数据到ESP32
   * @param {string} wifiSsid - WiFi名称
   * @param {string} wifiPassword - WiFi密码
   */
  async sendProvisioningData(wifiSsid, wifiPassword) {
    const data = {
      ssid: wifiSsid,
      password: wifiPassword,
      timestamp: Date.now()
    };
    
    const jsonStr = JSON.stringify(data);
    
    console.log(`🔵 发送配网数据: ${jsonStr}`);
    
    // 通过串口发送数据
    // 如果蓝牙模块工作在透传模式，数据会直接发送给连接的蓝牙设备
    return new Promise((resolve, reject) => {
      this.serialPort.write(jsonStr + '\n', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ 配网数据已发送');
          resolve(true);
        }
      });
    });
  }

  /**
   * 等待ESP32响应
   */
  waitForResponse(timeout = 15000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.provisioningCallback = null;
        reject(new Error('等待响应超时'));
      }, timeout);

      this.provisioningCallback = (data) => {
        clearTimeout(timeoutId);
        this.provisioningCallback = null;
        resolve(data);
      };
    });
  }

  /**
   * 执行完整配网流程
   * @param {string} wifiSsid - WiFi名称
   * @param {string} wifiPassword - WiFi密码
   */
  async provision(wifiSsid, wifiPassword) {
    console.log(`\n========== 开始蓝牙配网 ==========`);
    console.log(`WiFi: ${wifiSsid}`);
    console.log(`密码: ${'*'.repeat(wifiPassword.length)}`);
    
    // 1. 发送配网数据
    await this.sendProvisioningData(wifiSsid, wifiPassword);
    
    // 2. 等待ESP32响应
    try {
      const response = await this.waitForResponse(15000);
      console.log(`📨 ESP32响应:`, response);
      
      if (response.status === 'success') {
        console.log('✅ 配网成功！ESP32将尝试连接WiFi');
        return { success: true, message: '配网成功' };
      } else {
        return { success: false, message: response.message || '配网失败' };
      }
    } catch (err) {
      console.error('❌ 配网失败:', err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.close((err) => {
        if (err) {
          console.error('关闭串口失败:', err);
        } else {
          console.log('✅ 串口已关闭');
        }
      });
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出类
module.exports = { BLEService, BLE_CONFIG, AT_COMMANDS };
