/**
 * ESP32 IoT 物联网设备固件 (精简版)
 * 支持: MQTT通信、OTA升级、心跳灯
 * 
 * 使用Arduino IDE烧录:
 * 1. 文件 -> 首选项 -> 附加开发板管理器URL:
 *    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 * 2. 工具 -> 开发板 -> ESP32 Arduino -> ESP32 Dev Module
 * 3. 工具 -> 端口 -> 选择COM口
 * 4. 复制本文件内容到Arduino IDE编译上传
 * 
 * 库依赖:
 * - PubSubClient (by Nick O'Leary)
 * - ArduinoJson (by Benoit Blanchon)
 * - Update (内置)
 * - HTTPClient (内置)
 */

// ========== 设备配置 (修改这里) ==========
#define DEVICE_TYPE "sensor"
#define DEVICE_ID "device_001"
#define FIRMWARE_VERSION "2.0.1"

// ========== WiFi配置 (手动修改) ==========
char WIFI_SSID[32] = "WiFi名";
char WIFI_PASSWORD[64] = "WiFi密码";

// ========== MQTT服务器配置 ==========
#define MQTT_SERVER "服务器ip"
#define MQTT_PORT 1883
#define MQTT_USER "你的mqtt用户名"
#define MQTT_PASS "你的mqtt密码"

// ========== 引脚定义 ==========
#define LED_PIN 2              // 板载LED（可被命令控制 + 心跳灯）
#define RELAY_PIN 4            // 继电器控制
#define BUTTON_PIN 0           // 配网按钮
#define USE_BOARD_LED          // 启用板载LED作为心跳灯（注释此行则使用GPIO5外接LED）

#ifndef USE_BOARD_LED
#define HEARTBEAT_LED_PIN 5   // 如果不用板载LED，需要外接LED到GPIO5
#endif

// ========== 时间间隔配置 (毫秒) ==========
#define WIFI_RECONNECT_INTERVAL 5000
#define MQTT_RECONNECT_INTERVAL 5000
#define HEARTBEAT_INTERVAL 30000
#define TELEMETRY_INTERVAL 10000
#define WIFI_CONNECT_TIMEOUT 15000
#define HEARTBEAT_FLASH_DURATION 100

// ========== 库引入 ==========
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Update.h>
#include <HTTPClient.h>

// ========== 全局变量 ==========
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// OTA状态
bool otaInProgress = false;
size_t otaTotalSize = 0;
size_t otaDownloaded = 0;
char otaVersion[32] = "";

// 设备状态
struct DeviceState {
    bool relayState;
    float temperature;
    float humidity;
    float batteryVoltage;
    int rssi;
    bool ledState;
} deviceState = {false, 0, 0, 0, 0, false};

// WiFi状态
bool wifiConnecting = false;
uint32_t wifiConnectStart = 0;

// 心跳灯状态
bool heartbeatLedActive = false;
uint32_t heartbeatLedFlashStart = 0;

// 时间记录
uint32_t lastWifiReconnect = 0;
uint32_t lastMqttReconnect = 0;
uint32_t lastHeartbeat = 0;
uint32_t lastDataPublish = 0;
uint32_t bootTime = 0;
bool mqttFirstConnected = false;

// ========== MQTT消息处理 ==========
void handleMQTTMessage(char* topic, uint8_t* payload, unsigned int length) {
    char msg[256] = {0};
    if (length < sizeof(msg) - 1) {
        memcpy(msg, payload, length);
        msg[length] = '\0';
    }
    
    Serial.printf("[MQTT] 收到: %s -> %s\n", topic, msg);
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, msg);
    if (error) return;
    
    const char* cmd = doc["command"];
    if (!cmd) return;
    
    Serial.printf("[CMD] %s\n", cmd);
    
    if (strcmp(cmd, "relay_on") == 0) {
        digitalWrite(RELAY_PIN, HIGH);
        deviceState.relayState = true;
        publishStatus();
    }
    else if (strcmp(cmd, "relay_off") == 0) {
        digitalWrite(RELAY_PIN, LOW);
        deviceState.relayState = false;
        publishStatus();
    }
    else if (strcmp(cmd, "led_on") == 0) {
        digitalWrite(LED_PIN, HIGH);
        deviceState.ledState = true;
    }
    else if (strcmp(cmd, "led_off") == 0) {
        digitalWrite(LED_PIN, LOW);
        deviceState.ledState = false;
    }
    else if (strcmp(cmd, "get_info") == 0) {
        publishDeviceInfo();
    }
    else if (strcmp(cmd, "ota_update") == 0) {
        if (doc.containsKey("url")) {
            const char* url = doc["url"];
            const char* version = doc["version"] | "unknown";
            Serial.printf("[OTA] 收到升级请求: %s -> v%s\n", url, version);
            startOTAUpdate(url, version);
        }
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
    
    char topic[64];
    snprintf(topic, sizeof(topic), "device/%s/status", DEVICE_ID);
    mqttClient.publish(topic, buffer);
    
    Serial.printf("[MQTT] 发布状态(上线): %s\n", buffer);
}

void publishHeartbeat() {
    // 读取电池电压（如果有 ADC 连接）
    float voltage = 3.3 + random(0, 500) / 1000.0;  // 模拟电压 3.3-3.8V
    
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["type"] = DEVICE_TYPE;
    doc["version"] = FIRMWARE_VERSION;
    doc["rssi"] = WiFi.RSSI();
    doc["ip"] = WiFi.localIP().toString();
    doc["voltage"] = voltage;      // 电压(V)
    doc["uptime"] = millis() / 1000;
    doc["free_heap"] = ESP.getFreeHeap();
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    char topic[64];
    snprintf(topic, sizeof(topic), "device/%s/heartbeat", DEVICE_ID);
    mqttClient.publish(topic, buffer);
    
    Serial.printf("[MQTT] 心跳: RSSI=%d, voltage=%.2fV, uptime=%lus\n", WiFi.RSSI(), voltage, millis() / 1000);
    
    triggerHeartbeatLed();
}

void publishTelemetry() {
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    
    deviceState.temperature = random(200, 300) / 10.0;
    deviceState.humidity = random(400, 700) / 10.0;
    deviceState.batteryVoltage = 3.3 + random(0, 500) / 1000.0;
    
    doc["temperature"] = deviceState.temperature;
    doc["humidity"] = deviceState.humidity;
    doc["battery"] = deviceState.batteryVoltage;
    doc["rssi"] = WiFi.RSSI();
    doc["timestamp"] = millis() / 1000;
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    char topic[64];
    snprintf(topic, sizeof(topic), "device/%s/telemetry", DEVICE_ID);
    mqttClient.publish(topic, buffer);
    
    Serial.printf("[MQTT] 遥测: %.1f°C %.1f%% %.2fV\n", 
        deviceState.temperature, deviceState.humidity, deviceState.batteryVoltage);
}

void publishDeviceInfo() {
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
    
    char topic[64];
    snprintf(topic, sizeof(topic), "device/%s/info", DEVICE_ID);
    mqttClient.publish(topic, respBuffer);
}

void publishOTAProgress(int percent) {
    StaticJsonDocument<128> doc;
    doc["device_id"] = DEVICE_ID;
    doc["progress"] = percent;
    doc["downloaded"] = otaDownloaded;
    doc["total"] = otaTotalSize;
    
    char buffer[128];
    serializeJson(doc, buffer);
    
    char topic[64];
    snprintf(topic, sizeof(topic), "device/%s/ota", DEVICE_ID);
    mqttClient.publish(topic, buffer);
}

void publishOTAComplete(bool success, const char* error) {
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["success"] = success;
    doc["version"] = otaVersion;
    if (error) doc["error"] = error;
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    char topic[64];
    snprintf(topic, sizeof(topic), "device/%s/ota", DEVICE_ID);
    mqttClient.publish(topic, buffer);
}

// ========== OTA升级 ==========
void startOTAUpdate(const char* url, const char* version) {
    Serial.println("[OTA] 开始固件升级...");
    Serial.printf("[OTA] URL: %s\n", url);
    Serial.printf("[OTA] Version: %s\n", version);
    
    otaInProgress = true;
    otaTotalSize = 0;
    otaDownloaded = 0;
    strncpy(otaVersion, version, sizeof(otaVersion) - 1);
    
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
    
    if (!Update.begin(contentLength)) {
        Serial.println("[OTA] Flash空间不足");
        publishOTAComplete(false, "Insufficient flash space");
        otaInProgress = false;
        http.end();
        return;
    }
    
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
        publishOTAComplete(true, "success");
        Serial.println("[OTA] 设备将在3秒后重启...");
        delay(3000);
        ESP.restart();
    } else {
        Serial.printf("[OTA] 固件写入失败: %s\n", Update.errorString());
        publishOTAComplete(false, Update.errorString());
        otaInProgress = false;
    }
}

// ========== 心跳灯控制 ==========
void triggerHeartbeatLed() {
    // 板载LED是低电平亮（有些板子是反的）
    #if defined(USE_BOARD_LED)
    digitalWrite(LED_PIN, LOW);  // 低电平亮
    heartbeatLedActive = true;
    heartbeatLedFlashStart = millis();
    #endif
}

void updateHeartbeatLed() {
    #if defined(USE_BOARD_LED)
    if (!heartbeatLedActive) return;
    
    uint32_t now = millis();
    if (now - heartbeatLedFlashStart >= HEARTBEAT_FLASH_DURATION) {
        digitalWrite(LED_PIN, HIGH);  // 熄灭
        heartbeatLedActive = false;
    }
    #endif
}

// ========== 定时器辅助函数 ==========
inline bool shouldRun(uint32_t interval, uint32_t& lastRun) {
    uint32_t now = millis();
    if (now - lastRun >= interval) {
        lastRun = now;
        return true;
    }
    return false;
}

// ========== WiFi连接 (非阻塞) ==========
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
    Serial.printf("Flash大小: %d bytes\n", ESP.getFlashChipSize());
    Serial.printf("可用内存: %d bytes\n", ESP.getFreeHeap());
    Serial.println();
    
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(false);
    
    Serial.printf("[WiFi] 正在连接: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    wifiConnecting = true;
    wifiConnectStart = millis();
}

void connectWiFiNonBlocking() {
    if (WiFi.status() == WL_CONNECTED) {
        if (wifiConnecting) {
            wifiConnecting = false;
            Serial.printf("[WiFi] 已连接! IP: %s\n", WiFi.localIP().toString().c_str());
            Serial.printf("[WiFi] 信号强度: %d dBm\n", WiFi.RSSI());
        }
        return;
    }
    
    if (!wifiConnecting) {
        Serial.printf("[WiFi] 正在重连: %s\n", WIFI_SSID);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        wifiConnecting = true;
        wifiConnectStart = millis();
    }
    
    if (millis() - wifiConnectStart >= WIFI_CONNECT_TIMEOUT) {
        Serial.println("[WiFi] 连接超时");
        wifiConnecting = false;
    }
}

// ========== MQTT连接 (非阻塞) ==========
void setupMQTT() {
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(handleMQTTMessage);
}

void connectMQTTNonBlocking() {
    static uint32_t lastAttempt = 0;
    if (!shouldRun(MQTT_RECONNECT_INTERVAL, lastAttempt)) return;
    
    if (WiFi.status() != WL_CONNECTED) return;
    
    Serial.printf("[MQTT] 正在连接: %s:%d\n", MQTT_SERVER, MQTT_PORT);
    
    char clientId[64];
    snprintf(clientId, sizeof(clientId), "ESP32-%s", DEVICE_ID);
    
    if (mqttClient.connect(clientId, MQTT_USER, MQTT_PASS)) {
        Serial.println("[MQTT] 连接成功!");
        
        if (!mqttFirstConnected) {
            publishStatus();
            mqttFirstConnected = true;
            Serial.println("[MQTT] 设备已上线");
        }
        
        char cmdTopic[64];
        snprintf(cmdTopic, sizeof(cmdTopic), "device/%s/command", DEVICE_ID);
        mqttClient.subscribe(cmdTopic);
        Serial.printf("[MQTT] 订阅: %s\n", cmdTopic);
        
        char otaTopic[64];
        snprintf(otaTopic, sizeof(otaTopic), "device/%s/ota", DEVICE_ID);
        mqttClient.subscribe(otaTopic);
        Serial.printf("[MQTT] 订阅: %s\n", otaTopic);
    } else {
        Serial.printf("[MQTT] 连接失败, rc=%d\n", mqttClient.state());
    }
}

// ========== 初始化 ==========
void setup() {
    Serial.begin(115200);
    
    pinMode(LED_PIN, OUTPUT);
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    
    #ifndef USE_BOARD_LED
    pinMode(HEARTBEAT_LED_PIN, OUTPUT);
    digitalWrite(HEARTBEAT_LED_PIN, LOW);
    #endif
    
    digitalWrite(LED_PIN, LOW);
    digitalWrite(RELAY_PIN, LOW);
    
    bootTime = millis();
    
    setupWiFi();
    setupMQTT();
    
    Serial.println();
    Serial.println("╔══════════════════════════════════════════╗");
    Serial.println("║         设备初始化完成                   ║");
    Serial.println("╚══════════════════════════════════════════╝");
}

void loop() {
    updateHeartbeatLed();
    
    connectWiFiNonBlocking();
    
    if (WiFi.status() != WL_CONNECTED) {
        delay(10);
        return;
    }
    
    if (!mqttClient.connected()) {
        connectMQTTNonBlocking();
    } else {
        mqttClient.loop();
    }
    
    if (!otaInProgress && mqttClient.connected()) {
        if (shouldRun(HEARTBEAT_INTERVAL, lastHeartbeat)) {
            publishHeartbeat();
        }
        
        if (shouldRun(TELEMETRY_INTERVAL, lastDataPublish)) {
            publishTelemetry();
        }
    }
    
    delay(10);
}
