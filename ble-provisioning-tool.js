/**
 * 蓝牙配网工具 - 独立版本
 * 
 * 使用方式:
 *   node ble-provisioning-tool.js <COM端口> <WiFi名称> <WiFi密码>
 * 
 * 示例:
 *   node ble-provisioning-tool.js COM3 MyWiFi MyPassword
 * 
 * 硬件要求:
 *   - USB转TTL模块 (如CP2102, CH340)
 *   - HC-05 或 HC-08 蓝牙模块
 * 
 * 接线:
 *   HC-05/HC-08  ->  USB转TTL
 *   TXD          ->  RXD
 *   RXD          ->  TXD
 *   GND          ->  GND
 *   VCC          ->  3.3V/5V
 */

const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// ESP32蓝牙服务UUID
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

// 解析命令行参数
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('用法: node ble-provisioning-tool.js <COM端口> <WiFi名称> <WiFi密码>');
  console.log('示例: node ble-provisioning-tool.js COM3 MyWiFi MyPassword');
  console.log('');
  console.log('注意: 确保ESP32已进入蓝牙配网模式');
  process.exit(1);
}

const portName = args[0];
const wifiSsid = args[1];
const wifiPassword = args[2];

console.log('='.repeat(50));
console.log('  ESP32 蓝牙配网工具');
console.log('='.repeat(50));
console.log(`串口: ${portName}`);
console.log(`WiFi: ${wifiSsid}`);
console.log(`密码: ${'*'.repeat(wifiPassword.length)}`);
console.log('');

// 检查可用串口
async function listPorts() {
  const ports = await SerialPort.list();
  console.log('可用串口:');
  ports.forEach(port => {
    console.log(`  ${port.path} - ${port.manufacturer || '未知'}`);
  });
  console.log('');
}

// 发送AT指令
async function sendATCommand(port, command, timeout = 1000) {
  return new Promise((resolve, reject) => {
    let response = '';
    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(response.trim() || 'OK');
      }
    }, timeout);

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    const handler = (data) => {
      response += data + '\n';
      if (data.includes('OK') || data.includes('ERROR')) {
        clearTimeout(timeoutId);
        parser.removeListener('data', handler);
        if (!resolved) {
          resolved = true;
          resolve(response.trim());
        }
      }
    };

    parser.on('data', handler);
    port.write(command, (err) => {
      if (err) {
        clearTimeout(timeoutId);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      }
    });
  });
}

// 等待指定时间
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  try {
    // 列出可用串口
    await listPorts();

    console.log(`正在连接串口 ${portName}...`);
    
    const port = new SerialPort({
      path: portName,
      baudRate: 9600
    });

    await new Promise((resolve, reject) => {
      port.on('open', resolve);
      port.on('error', reject);
    });

    console.log('串口已打开 ✓');
    await delay(1000);

    // 测试AT指令
    console.log('测试通信...');
    const test = await sendATCommand(port, 'AT\r\n');
    if (!test.includes('OK')) {
      throw new Error('蓝牙模块通信失败，请检查接线');
    }
    console.log('通信正常 ✓');

    // 获取模块信息
    console.log('\n模块信息:');
    try {
      const name = await sendATCommand(port, 'AT+NAME?\r\n');
      console.log(`  名称: ${name.replace('+NAME:', '').replace('OK', '').trim()}`);
    } catch (e) {}
    
    try {
      const addr = await sendATCommand(port, 'AT+ADDR?\r\n');
      console.log(`  地址: ${addr.replace('+ADDR:', '').replace('OK', '').trim()}`);
    } catch (e) {}
    
    try {
      const role = await sendATCommand(port, 'AT+ROLE?\r\n');
      const roleText = role.includes('+ROLE:0') ? '从机' : '主机';
      console.log(`  角色: ${roleText}`);
    } catch (e) {}

    // 发送配网数据
    console.log('\n' + '-'.repeat(50));
    console.log('开始配网...');
    
    const provisionData = JSON.stringify({
      ssid: wifiSsid,
      password: wifiPassword,
      timestamp: Date.now()
    });
    
    console.log(`发送数据: ${provisionData}`);
    await delay(500);
    
    port.write(provisionData + '\n', (err) => {
      if (err) {
        throw err;
      }
    });

    console.log('数据已发送，等待ESP32响应...');
    
    // 等待响应
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    let hasResponse = false;
    
    const responsePromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (!hasResponse) {
          console.log('\n⚠️ 未收到ESP32响应（可能设备未连接蓝牙模块）');
          resolve(null);
        }
      }, 15000);

      parser.on('data', (data) => {
        console.log(`\n收到ESP32: ${data}`);
        hasResponse = true;
        clearTimeout(timeoutId);
        
        try {
          const json = JSON.parse(data);
          if (json.status === 'success') {
            console.log('\n' + '='.repeat(50));
            console.log('✅ 配网成功！');
            console.log('='.repeat(50));
            console.log('ESP32正在连接WiFi，请稍候...');
          }
          resolve(json);
        } catch (e) {
          resolve(null);
        }
      });
    });

    await responsePromise;
    
    // 关闭串口
    await delay(1000);
    port.close();
    console.log('\n串口已关闭');
    console.log('\n配网工具执行完成');
    console.log('提示: ESP32连接WiFi可能需要10-30秒');
    
  } catch (err) {
    console.error('\n❌ 错误:', err.message);
    console.log('\n请检查:');
    console.log('  1. 串口是否正确连接');
    console.log('  2. 蓝牙模块是否上电');
    console.log('  3. TXD/RXD接线是否正确');
    console.log('  4. ESP32是否已进入配网模式');
    process.exit(1);
  }
}

main();
