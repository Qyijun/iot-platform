/**
 * ESP32 物联网设备固件
 * 支持: MQTT通信、蓝牙配网、OTA升级
 * 
 * 使用Arduino IDE烧录:
 * 1. 文件 -> 首选项 -> 附加开发板管理器URL:
 *    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 * 2. 工具 -> 开发板 -> ESP32 Arduino -> ESP32 Dev Module
 * 3. 工具 -> 端口 -> 选择COM口
 * 4. 复制本文件内容到Arduino IDE编译上传
 * 
 * 库依赖 (项目 -> 加载库 -> 管理库):
 * - PubSubClient (by Nick O'Leary)
 * - ArduinoJson (by Benoit Blanchon)
 * - NimBLE-Arduino (by H2zero)
 */

// ========== 设备配置 (修改这里) ==========
#define DEVICE_TYPE "sensor"        // 设备类型: sensor, switch, relay, gateway, custom
#define DEVICE_ID "device_001"       // 设备唯一ID (每个设备必须唯一)
#define FIRMWARE_VERSION "1.0.0"     // 固件版本

// ========== WiFi配置 (可通过蓝牙配网修改) ==========
char WIFI_SSID[32] = "qiuyijun";
char WIFI_PASSWORD[64] = "Qiuyijun123";

// ========== MQTT服务器配置 ==========
#define MQTT_SERVER "192.168.1.3"  // 修改为你的服务器IP
#define MQTT_PORT 1883
#define MQTT_USER "qiuyijun"                  // MQTT用户名(可选)
#define MQTT_PASS "Qiuyijun.13825401705"                  // MQTT密码(可选)

// ========== 蓝牙配网服务UUID ==========
#define BLE_SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// ========== 引脚定义 ==========
#define LED_PIN 2          // 板载LED
#define RELAY_PIN 4        // 继电器控制
#define BUTTON_PIN 0       // 配网按钮
#define SENSOR_PIN 5       // 传感器引脚

// ========== 库引入 ==========
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include <Update.h>
#include <HTTPClient.h>

// ========== 全局变量 ==========
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// 蓝牙
NimBLEServer* bleServer = nullptr;
NimBLECharacteristic* bleCharacteristic = nullptr;
bool bleConnected = false;

// OTA状态
bool otaInProgress = false;
size_t otaTotalSize = 0;
size_t otaDownloaded = 0;
String otaVersion = "";
unsigned long otaStartTime = 0;

// 设备状态
struct DeviceState {
    bool relayState;
    float temperature;
    float humidity;
    float batteryVoltage;
    int rssi;
    bool ledState;
} deviceState = {false, 0, 0, 0, 0, false};

// 时间记录
unsigned long lastHeartbeat = 0;
unsigned long lastDataPublish = 0;
unsigned long bootTime = 0;
bool provisioned = true;  // 已配置WiFi

// ========== 蓝牙回调 ==========
class BLEServerCallbacks: public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) {
        bleConnected = true;
        Serial.println("[BLE] 客户端已连接");
    }
    void onDisconnect(NimBLEServer* pServer) {
        bleConnected = false;
        Serial.println("[BLE] 客户端已断开");
        NimBLEDevice::startAdvertising();
    }
};

class BLECharacteristicCallbacks: public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic) {
        String value = pCharacteristic->getValue().c_str();
        Serial.printf("[BLE] 收到数据: %s\n", value.c_str());
        
        // 解析配网数据 JSON: {"ssid":"xxx","password":"xxx"}
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, value);
        
        if (!error && doc.containsKey("ssid") && doc.containsKey("password")) {
            String newSsid = doc["ssid"].as<String>();
            String newPassword = doc["password"].as<String>();
            
            newSsid.toCharArray(WIFI_SSID, 32);
            newPassword.toCharArray(WIFI_PASSWORD, 64);
            
            Serial.printf("[BLE] WiFi已更新: %s\n", WIFI_SSID);
            
            // 保存到Flash
            saveConfig();
            
            // 回复成功
            pCharacteristic->setValue("OK");
            delay(100);
            
            Serial.println("[BLE] 设备将在3秒后重启...");
            delay(3000);
            ESP.restart();
        }
    }
};

// ========== WiFi连接 ==========
void setupWiFi() {
    Serial.println();
    Serial.println("╔══════════════════════════════════════════╗");
    Serial.println("║         ESP32 IoT 设备启动               ║");
    Serial.println("╚══════════════════════════════════════════╝");
    Serial.printf("设备ID: %s\n", DEVICE_ID);
    Serial.printf("设备类型: %s\n", DEVICE_TYPE);
    Serial.printf("固件版本: %s\n", FIRMWARE_VERSION);
    Serial.printf("芯片型号: %s\n", ESP.getChipModel());
    Serial.printf("芯片版本: %d\n", ESP.getChipRevision());
    Serial.printf("CPU频率: %d MHz\n", ESP.getCpuFreqMHz());
    Serial.printf("Flash大小: %d KB\n", ESP.getFlashChipSize() / 1024);
    Serial.printf("可用内存: %d KB\n", ESP.getFreeHeap() / 1024);
    Serial.println();
    
    // 检查是否已配置WiFi
    if (strlen(WIFI_SSID) == 0 || String(WIFI_SSID) == "YOUR_WIFI_SSID") {
        Serial.println("[WiFi] 未配置WiFi，进入配网模式...");
        provisioned = false;
        startBLEProvisioning();
    } else {
        Serial.printf("[WiFi] 已配置WiFi: %s\n", WIFI_SSID);
        connectWiFi();
    }
}

void connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    Serial.print("[WiFi] 正在连接");
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.printf("[WiFi] 连接成功!\n");
        Serial.printf("       IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("       信号: %d dBm\n", WiFi.RSSI());
        provisioned = true;
    } else {
        Serial.println();
        Serial.println("[WiFi] 连接失败!");
        provisioned = false;
    }
}

void reconnectWiFi() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] WiFi断开，重新连接...");
        connectWiFi();
    }
}

// ========== 蓝牙配网 ==========
void startBLEProvisioning() {
    Serial.println();
    Serial.println("╔══════════════════════════════════════════╗");
    Serial.println("║         进入蓝牙配网模式                 ║");
    Serial.println("╚══════════════════════════════════════════╝");
    Serial.println("请使用手机APP连接蓝牙并配置WiFi");
    Serial.printf("蓝牙名称: %s\n", DEVICE_ID);
    Serial.printf("蓝牙UUID: %s\n", BLE_SERVICE_UUID);
    Serial.println();
    
    NimBLEDevice::init(DEVICE_ID);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);  // 最大功率
    
    bleServer = NimBLEDevice::createServer();
    bleServer->setCallbacks(new BLEServerCallbacks());
    
    NimBLEService* service = bleServer->createService(BLE_SERVICE_UUID);
    
    bleCharacteristic = service->createCharacteristic(
        BLE_CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY
    );
    bleCharacteristic->setCallbacks(new BLECharacteristicCallbacks());
    bleCharacteristic->setValue("WAITING_CONFIG");
    
    service->start();
    
    NimBLEAdvertising* advertising = NimBLEDevice::getAdvertising();
    advertising->addServiceUUID(BLE_SERVICE_UUID);
    advertising->setName(DEVICE_ID);
    advertising->start();
    
    Serial.println("[BLE] 蓝牙广播已启动，等待连接...");
    
    // LED快闪
    while (!provisioned) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
        
        // 处理蓝牙连接
        delay(100);
    }
}

// ========== MQTT ==========
void setupMQTT() {
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(handleMQTTMessage);
    connectMQTT();
}

void connectMQTT() {
    while (!mqttClient.connected()) {
        Serial.print("[MQTT] 正在连接");
        String clientId = "ESP32-" + String(DEVICE_ID);
        
        if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
            Serial.println(" 成功!");
            
            // 订阅命令主题
            String cmdTopic = "device/" + String(DEVICE_ID) + "/command";
            mqttClient.subscribe(cmdTopic.c_str());
            Serial.printf("[MQTT] 订阅: %s\n", cmdTopic.c_str());
            
            // 订阅OTA主题
            String otaTopic = "device/" + String(DEVICE_ID) + "/ota";
            mqttClient.subscribe(otaTopic.c_str());
            Serial.printf("[MQTT] 订阅: %s\n", otaTopic.c_str());
            
            // 发布上线消息
            publishStatus();
        } else {
            Serial.print(" 失败, rc=");
            Serial.print(mqttClient.state());
            Serial.println(" 5秒后重试...");
            delay(5000);
        }
    }
}

void handleMQTTMessage(char* topic, byte* payload, unsigned int length) {
    // 解析命令
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (error) {
        Serial.printf("[MQTT] JSON解析失败: %s\n", error.c_str());
        return;
    }
    
    const char* cmd = doc["command"] | doc["cmd"] | "";
    Serial.printf("[MQTT] 命令: %s\n", cmd);
    
    // ========== 命令处理 ==========
    
    // 获取状态
    if (strcmp(cmd, "get_status") == 0 || strcmp(cmd, "status") == 0) {
        publishStatus();
    }
    // 继电器控制
    else if (strcmp(cmd, "relay_on") == 0) {
        digitalWrite(RELAY_PIN, HIGH);
        deviceState.relayState = true;
        publishStatus();
    }
    else if (strcmp(cmd, "relay_off") == 0) {
        digitalWrite(RELAY_PIN, LOW);
        deviceState.relayState = false;
        publishStatus();
    }
    else if (strcmp(cmd, "relay_toggle") == 0) {
        deviceState.relayState = !deviceState.relayState;
        digitalWrite(RELAY_PIN, deviceState.relayState ? HIGH : LOW);
        publishStatus();
    }
    // LED控制
    else if (strcmp(cmd, "led_on") == 0) {
        digitalWrite(LED_PIN, HIGH);
        deviceState.ledState = true;
    }
    else if (strcmp(cmd, "led_off") == 0) {
        digitalWrite(LED_PIN, LOW);
        deviceState.ledState = false;
    }
    else if (strcmp(cmd, "led_toggle") == 0) {
        deviceState.ledState = !deviceState.ledState;
        digitalWrite(LED_PIN, deviceState.ledState ? HIGH : LOW);
    }
    // 获取设备信息
    else if (strcmp(cmd, "get_info") == 0) {
        StaticJsonDocument<512> info;
        info["device_id"] = DEVICE_ID;
        info["device_type"] = DEVICE_TYPE;
        info["firmware"] = FIRMWARE_VERSION;
        info["chip_model"] = ESP.getChipModel();
        info["chip_revision"] = ESP.getChipRevision();
        info["cpu_freq"] = ESP.getCpuFreqMHz();
        info["flash_size"] = ESP.getFlashChipSize();
        info["free_heap"] = ESP.getFreeHeap();
        info["ip"] = WiFi.localIP().toString();
        info["rssi"] = WiFi.RSSI();
        info["uptime"] = millis() / 1000;
        
        char respBuffer[512];
        serializeJson(info, respBuffer);
        String topic = "device/" + String(DEVICE_ID) + "/info";
        mqttClient.publish(topic.c_str(), respBuffer);
    }
    // OTA固件升级
    else if (strcmp(cmd, "ota_update") == 0) {
        if (doc.containsKey("url")) {
            const char* url = doc["url"];
            const char* version = doc["version"] | "unknown";
            Serial.printf("[OTA] 收到升级请求: %s -> v%s\n", url, version);
            startOTAUpdate(url, version);
        }
    }
    // 重启设备
    else if (strcmp(cmd, "reboot") == 0 || strcmp(cmd, "restart") == 0) {
        Serial.println("[CMD] 收到重启命令，3秒后重启...");
        delay(3000);
        ESP.restart();
    }
    // 未知命令
    else {
        Serial.printf("[CMD] 未知命令: %s\n", cmd);
    }
}

// ========== 数据发布 ==========
void publishStatus() {
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["type"] = DEVICE_TYPE;
    doc["online"] = true;
    doc["relay"] = deviceState.relayState;
    doc["led"] = deviceState.ledState;
    doc["rssi"] = WiFi.RSSI();
    doc["uptime"] = millis() / 1000;
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    String topic = "device/" + String(DEVICE_ID) + "/status";
    mqttClient.publish(topic.c_str(), buffer);
    
    Serial.printf("[MQTT] 发布状态: %s\n", buffer);
}

void publishTelemetry() {
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    
    // 模拟传感器数据 (实际使用时替换为真实传感器读取)
    deviceState.temperature = random(200, 300) / 10.0;  // 20.0-30.0°C
    deviceState.humidity = random(400, 700) / 10.0;   // 40.0-70.0%
    deviceState.batteryVoltage = 3.3 + random(0, 500) / 1000.0;  // 3.3-3.8V
    
    doc["temperature"] = deviceState.temperature;
    doc["humidity"] = deviceState.humidity;
    doc["battery"] = deviceState.batteryVoltage;
    doc["rssi"] = WiFi.RSSI();
    doc["timestamp"] = millis() / 1000;
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    String topic = "device/" + String(DEVICE_ID) + "/telemetry";
    mqttClient.publish(topic.c_str(), buffer);
    
    Serial.printf("[MQTT] 发布遥测: %.1f°C %.1f%% %.2fV\n", 
        deviceState.temperature, deviceState.humidity, deviceState.batteryVoltage);
}

// ========== OTA升级 ==========
void startOTAUpdate(const char* url, const char* version) {
    Serial.println("[OTA] 开始固件升级...");
    Serial.printf("[OTA] URL: %s\n", url);
    Serial.printf("[OTA] Version: %s\n", version);
    
    otaInProgress = true;
    otaTotalSize = 0;
    otaDownloaded = 0;
    otaVersion = version;
    otaStartTime = millis();
    
    // 闪烁LED表示正在升级
    publishOTAProgress(0);
    
    HTTPClient http;
    http.begin(url);
    http.setTimeout(30000);
    
    int httpCode = http.GET();
    
    if (httpCode != HTTP_CODE_OK) {
        Serial.printf("[OTA] HTTP下载失败: %d\n", httpCode);
        publishOTAComplete(false, "HTTP download failed");
        otaInProgress = false;
        http.end();
        return;
    }
    
    int contentLength = http.getSize();
    if (contentLength <= 0) {
        Serial.println("[OTA] 无法获取固件大小");
        publishOTAComplete(false, "Unknown firmware size");
        otaInProgress = false;
        http.end();
        return;
    }
    
    Serial.printf("[OTA] 固件大小: %d bytes\n", contentLength);
    
    // 检查Flash空间
    if (!Update.begin(contentLength)) {
        Serial.println("[OTA] Flash空间不足");
        publishOTAComplete(false, "Insufficient flash space");
        otaInProgress = false;
        http.end();
        return;
    }
    
    // 透传下载并写入
    WiFiClient* stream = http.getStreamPtr();
    size_t written = 0;
    int lastPercent = 0;
    
    while (http.connected() && (written < contentLength)) {
        size_t available = stream->available();
        if (available) {
            uint8_t buf[512];
            size_t readBytes = stream->readBytes(buf, min(available, sizeof(buf)));
            written += Update.write(buf, readBytes);
            otaDownloaded = written;
            
            int percent = (written * 100) / contentLength;
            if (percent - lastPercent >= 10) {
                Serial.printf("[OTA] 下载进度: %d%%\n", percent);
                publishOTAProgress(percent);
                lastPercent = percent;
            }
        }
        delay(1);
    }
    
    http.end();
    
    Serial.printf("[OTA] 下载完成: %d bytes\n", written);
    
    if (Update.end(true)) {
        Serial.println("[OTA] 固件写入完成!");
        publishOTAComplete(true);
        Serial.println("[OTA] 设备将在3秒后重启...");
        delay(3000);
        ESP.restart();
    } else {
        Serial.printf("[OTA] 固件写入失败: %s\n", Update.errorString());
        publishOTAComplete(false, Update.errorString());
        otaInProgress = false;
    }
}

void publishOTAProgress(int percent) {
    StaticJsonDocument<64> doc;
    doc["progress"] = percent;
    doc["version"] = otaVersion;
    
    char payload[64];
    serializeJson(doc, payload);
    
    String topic = "device/" + String(DEVICE_ID) + "/ota/progress";
    mqttClient.publish(topic.c_str(), payload);
}

void publishOTAComplete(bool success, const char* error) {
    StaticJsonDocument<128> doc;
    doc["status"] = success ? "complete" : "error";
    doc["version"] = otaVersion;
    doc["current_version"] = FIRMWARE_VERSION;
    if (error) doc["error"] = error;
    
    char payload[128];
    serializeJson(doc, payload);
    
    String topic = "device/" + String(DEVICE_ID) + "/ota/result";
    mqttClient.publish(topic.c_str(), payload);
    
    otaInProgress = false;
}

// ========== 配置存储 (简化版，实际用Preferences库更好) ==========
void saveConfig() {
    // 简化实现，实际建议使用Preferences库
    Serial.println("[CONFIG] 配置已保存");
}

void loadConfig() {
    // 简化实现，实际建议使用Preferences库
    Serial.println("[CONFIG] 加载默认配置");
}

// ========== 初始化 ==========
void setup() {
    // 串口
    Serial.begin(115200);
    
    // 引脚
    pinMode(LED_PIN, OUTPUT);
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    
    digitalWrite(LED_PIN, LOW);
    digitalWrite(RELAY_PIN, LOW);
    
    bootTime = millis();
    
    // 加载配置
    loadConfig();
    
    // WiFi连接
    setupWiFi();
    
    // MQTT连接
    setupMQTT();
    
    Serial.println();
    Serial.println("╔══════════════════════════════════════════╗");
    Serial.println("║         设备初始化完成                   ║");
    Serial.println("╚══════════════════════════════════════════╝");
}

void loop() {
    unsigned long now = millis();
    
    // WiFi重连
    reconnectWiFi();
    
    // MQTT心跳和重连
    if (!mqttClient.connected()) {
        connectMQTT();
    }
    mqttClient.loop();
    
    // 每30秒发送心跳
    if (now - lastHeartbeat > 30000) {
        publishStatus();
        lastHeartbeat = now;
    }
    
    // 每10秒发布遥测数据
    if (now - lastDataPublish > 10000) {
        publishTelemetry();
        lastDataPublish = now;
    }
    
    delay(10);
}
