# ESP32 通用物联网设备固件

一个基于 ESP32 的通用物联网设备固件框架，支持蓝牙配网和 MQTT 通信。

## 支持的设备类型

| 类型 | 说明 | 主要功能 |
|------|------|----------|
| `sensor` | 传感器设备 | 温湿度采集、电池监测 |
| `switch` | 开关设备 | 继电器控制、LED控制 |
| `relay` | 继电器设备 | 远程开关控制 |
| `gateway` | 网关设备 | 数据转发 |
| `custom` | 自定义设备 | 根据需求扩展 |

## 快速开始

### 1. 配置设备

编辑 `src/main.cpp` 中的配置：

```cpp
// 设备类型
const char* DEVICE_TYPE = "sensor";

// 设备唯一ID (每个设备必须唯一)
const char* DEVICE_ID = "device_001";

// MQTT服务器
const char* MQTT_SERVER = "192.168.1.100";  // 你的服务器IP
```

### 2. 编译上传

```bash
pio run -e esp32-s3
pio run -e esp32-s3 --target upload
```

## MQTT 主题

| 主题 | 方向 | 说明 |
|------|------|------|
| `device/{id}/status` | 设备→服务器 | 设备状态 (retained) |
| `device/{id}/telemetry` | 设备→服务器 | 遥测数据 |
| `device/{id}/heartbeat` | 设备→服务器 | 心跳 (每30秒) |
| `device/{id}/command` | 服务器→设备 | 下发命令 |
| `device/{id}/config/wifi` | 服务器→设备 | WiFi配置 |

## 支持的命令

### 系统命令
| 命令 | 说明 |
|------|------|
| `ping` | 心跳响应 |
| `reboot` | 重启设备 |
| `get_status` | 获取设备状态 |
| `get_info` | 获取设备详细信息 |

### 控制命令
| 命令 | 说明 |
|------|------|
| `relay_on` | 开启继电器 |
| `relay_off` | 关闭继电器 |
| `relay_toggle` | 切换继电器状态 |
| `led_on` | 开启LED |
| `led_off` | 关闭LED |

### 配置命令
| 命令 | 说明 |
|------|------|
| `update_wifi` | 更新WiFi配置 |

## 蓝牙配网

### 通过手机APP配网

1. 按住设备上的配网按钮
2. 上电进入配网模式 (LED快闪)
3. 手机连接蓝牙 `device_001`
4. 发送JSON配置:
```json
{
  "ssid": "你的WiFi名称",
  "password": "你的WiFi密码"
}
```

### 通过MQTT配网 (设备已连接WiFi)

```bash
mosquitto_pub -h 192.168.1.100 -t "device/device_001/config/wifi" -m '{
  "ssid": "你的WiFi名称",
  "password": "你的WiFi密码"
}'
```

## 硬件接线

```
ESP32-S3          外部设备
--------          ----------
GPIO2    ----→   板载LED (通过220Ω电阻)
GPIO4    ----→   继电器模块 (低电平触发)
GPIO0    ----→   按钮 (接地触发配网模式)
GPIO5    ----→   DHT11/DHT22传感器 (可选)
```

## 自定义扩展

### 添加新传感器

```cpp
// 在 loop() 中添加传感器读取
void readSensorData() {
    // DHT温湿度
    #include <DHT.h>
    DHT dht(DHT_PIN, DHT11);
    deviceState.temperature = dht.readTemperature();
    deviceState.humidity = dht.readHumidity();
    
    // ADC电压
    deviceState.batteryVoltage = analogRead(BAT_ADC_PIN) * 3.3 / 4096.0 * 2;
}
```

### 添加新命令

```cpp
void handleMQTTMessage(char* topic, byte* payload, unsigned int length) {
    // ... 现有代码 ...
    
    // 添加自定义命令
    else if (strcmp(cmd, "custom_command") == 0) {
        // 处理自定义命令
    }
}
```

### 添加新设备类型

```cpp
// 在 DeviceState 结构体中添加新字段
struct DeviceState {
    // ... 现有字段 ...
    float pressure;      // 气压
    int airQuality;      // 空气质量
};

// 在 publishTelemetry 中添加
if (strcmp(DEVICE_TYPE, "environment") == 0) {
    doc["pressure"] = deviceState.pressure;
    doc["air_quality"] = deviceState.airQuality;
}
```

## 协议示例

### 遥测数据 (sensor类型)
```json
{
  "device_id": "device_001",
  "timestamp": 1234567890,
  "uptime": 3600,
  "rssi": -45,
  "temperature": 25.3,
  "humidity": 60.5,
  "battery": 3.85
}
```

### 遥测数据 (relay类型)
```json
{
  "device_id": "switch_001",
  "timestamp": 1234567890,
  "uptime": 3600,
  "rssi": -50,
  "relay": true,
  "led": false
}
```

### 设备信息响应
```json
{
  "device_id": "device_001",
  "device_type": "sensor",
  "firmware": "1.0.0",
  "chip_model": "ESP32-S3",
  "chip_revision": 2,
  "cpu_freq": 240,
  "flash_size": 16777216,
  "free_heap": 98765,
  "ip": "192.168.1.50",
  "rssi": -45,
  "uptime": 3600
}
```

## 编译说明

### 环境要求
- PlatformIO Core 或 PlatformIO IDE
- ESP32 SDK

### 目标板卡
- ESP32
- ESP32-S3
- ESP32-C3

### 依赖库
- PubSubClient (MQTT客户端)
- ArduinoJson (JSON解析)
- NimBLE-Arduino (蓝牙BLE)

## License

MIT
