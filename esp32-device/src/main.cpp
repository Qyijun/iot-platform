#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include <Update.h>
#include <HTTPClient.h>

// ========== 设备配置 (修改这里适配你的设备) ==========
// 设备类型: sensor(传感器), switch(开关), relay(继电器), gateway(网关), custom(自定义)
const char* DEVICE_TYPE = "sensor";

// 设备唯一ID (每个设备必须唯一)
const char* DEVICE_ID = "device_001";

// 固件版本
const char* FIRMWARE_VERSION = "1.0.0";

// ========== WiFi配置 (可通过蓝牙配网修改) ==========
char WIFI_SSID[32] = "YOUR_WIFI_SSID";
char WIFI_PASSWORD[64] = "YOUR_WIFI_PASSWORD";

// ========== MQTT服务器配置 ==========
const char* MQTT_SERVER = "192.168.1.100";  // 修改为你的服务器IP
const int MQTT_PORT = 1883;
const char* MQTT_USER = "";                  // MQTT用户名(可选)
const char* MQTT_PASS = "";                  // MQTT密码(可选)

// ========== 蓝牙配网服务UUID ==========
#define BLE_SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// ========== 引脚定义 (根据你的硬件修改) ==========
#ifdef ESP32
  #define LED_PIN 2          // 板载LED
  #define RELAY_PIN 4        // 继电器控制引脚
  #define BUTTON_PIN 0       // 按键(配网模式触发)
  #define DHT_PIN 5          // DHT传感器引脚
#endif

// ========== 全局变量 ==========
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// 蓝牙
NimBLEServer* bleServer = nullptr;
NimBLECharacteristic* bleCharacteristic = nullptr;
bool bleConnected = false;

// OTA状态
bool otaInProgress = false;
unsigned long otaProgress = 0;
String otaVersion = "";
unsigned long otaStartTime = 0;

// 设备状态
struct DeviceState {
    bool relayState;          // 继电器状态
    float temperature;        // 温度
    float humidity;           // 湿度
    float batteryVoltage;     // 电池电压
    int rssi;                 // WiFi信号强度
    bool ledState;            // LED状态
} deviceState = {false, 0, 0, 0, 0, false};

// ========== 蓝牙回调 ==========
class BLEServerCallbacks: public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) {
        bleConnected = true;
        Serial.println("[BLE] 客户端已连接");
    }

    void onDisconnect(NimBLEServer* pServer) {
        bleConnected = false;
        Serial.println("[BLE] 客户端已断开");
        // 重新开始广播
        NimBLEDevice::startAdvertising();
    }
};

class BLECharacteristicCallbacks: public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic *pCharacteristic) {
        std::string rxValue = pCharacteristic->getValue();
        
        if (rxValue.length() > 0) {
            Serial.print("[BLE] 收到数据: ");
            Serial.println(rxValue.c_str());
            
            // 解析JSON配置
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, rxValue);
            
            if (!error) {
                // 处理WiFi配置
                if (doc.containsKey("ssid") && doc.containsKey("password")) {
                    const char* newSsid = doc["ssid"];
                    const char* newPass = doc["password"];
                    
                    strncpy(WIFI_SSID, newSsid, sizeof(WIFI_SSID) - 1);
                    strncpy(WIFI_PASSWORD, newPass, sizeof(WIFI_PASSWORD) - 1);
                    
                    Serial.println("[BLE] WiFi配置已更新，准备重启...");
                    
                    // 发送响应
                    StaticJsonDocument<128> response;
                    response["status"] = "success";
                    response["message"] = "WiFi configured, rebooting...";
                    
                    String responseStr;
                    serializeJson(response, responseStr);
                    pCharacteristic->setValue(responseStr.c_str());
                    pCharacteristic->notify();
                    
                    delay(1000);
                    ESP.restart();
                }
                // 处理查询请求
                else if (doc.containsKey("action") && strcmp(doc["action"], "status") == 0) {
                    StaticJsonDocument<256> response;
                    response["device_id"] = DEVICE_ID;
                    response["device_type"] = DEVICE_TYPE;
                    response["firmware"] = FIRMWARE_VERSION;
                    response["ip"] = WiFi.localIP().toString();
                    response["rssi"] = WiFi.RSSI();
                    response["uptime"] = millis() / 1000;
                    
                    String responseStr;
                    serializeJson(response, responseStr);
                    pCharacteristic->setValue(responseStr.c_str());
                    pCharacteristic->notify();
                }
            }
        }
    }
};

// ========== 函数声明 ==========
void setupWiFi();
void setupMQTT();
void setupBLE();
void connectWiFi();
void connectMQTT();
void publishStatus();
void publishTelemetry();
void sendHeartbeat();
void handleMQTTMessage(char* topic, byte* payload, unsigned int length);
void enterProvisioningMode();
void readSensorData();
void controlRelay(bool state);
void blinkLED(int times);
void startOTAUpdate(const char* url, const char* version);
void publishOTAProgress(int progress);
void publishOTAComplete(bool success, const char* error = nullptr);

// ========== Setup ==========
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println();
    Serial.println("╔══════════════════════════════════════════╗");
    Serial.println("║     IoT Device Firmware v" + String(FIRMWARE_VERSION) + "            ║");
    Serial.println("║     Device ID: " + String(DEVICE_ID) + "                  ║");
    Serial.println("║     Device Type: " + String(DEVICE_TYPE) + "                 ║");
    Serial.println("╚══════════════════════════════════════════╝");
    
    bootTime = millis();
    
    // 初始化引脚
    pinMode(LED_PIN, OUTPUT);
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    digitalWrite(LED_PIN, LOW);
    digitalWrite(RELAY_PIN, LOW);
    
    // 检查是否进入配网模式 (按住按钮上电)
    if (digitalRead(BUTTON_PIN) == LOW) {
        Serial.println("[BOOT] 检测到配网模式按钮");
        enterProvisioningMode();
    }
    
    // 初始化BLE
    setupBLE();
    
    // 初始化WiFi
    setupWiFi();
    
    // 初始化MQTT
    setupMQTT();
    
    // 指示灯闪烁表示启动完成
    blinkLED(3);
    
    Serial.println("[BOOT] 系统启动完成");
}

// ========== Loop ==========
void loop() {
    unsigned long now = millis();
    
    // WiFi管理
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WIFI] 连接断开，尝试重连...");
        connectWiFi();
    }
    
    // MQTT管理
    if (!mqttClient.connected()) {
        if (now - reconnectAttempts > 5000) {
            reconnectAttempts = now;
            if (connectMQTT()) {
                reconnectAttempts = 0;
            }
        }
    } else {
        mqttClient.loop();
    }
    
    // 心跳 (每30秒)
    if (now - lastHeartbeat > 30000) {
        sendHeartbeat();
        lastHeartbeat = now;
    }
    
    // 遥测数据 (每10秒)
    if (now - lastDataPublish > 10000) {
        readSensorData();
        publishTelemetry();
        lastDataPublish = now;
    }
    
    // OTA进度上报 (每5秒)
    if (otaInProgress && now - otaStartTime > 5000) {
        publishOTAProgress((otaProgress * 100) / Update.getSize());
        otaStartTime = now;
    }
    
    delay(10);
}

// ========== 初始化函数 ==========
void setupWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.persistent(false);
    connectWiFi();
}

void setupMQTT() {
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(handleMQTTMessage);
    mqttClient.setBufferSize(512);
}

void setupBLE() {
    Serial.println("[BLE] 初始化蓝牙服务...");
    
    NimBLEDevice::init(DEVICE_ID);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);  // 最大功率
    
    bleServer = NimBLEDevice::createServer();
    bleServer->setCallbacks(new BLEServerCallbacks());
    
    NimBLEService* bleService = bleServer->createService(BLE_SERVICE_UUID);
    
    bleCharacteristic = bleService->createCharacteristic(
        BLE_CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ | 
        NIMBLE_PROPERTY::WRITE | 
        NIMBLE_PROPERTY::NOTIFY
    );
    bleCharacteristic->setCallbacks(new BLECharacteristicCallbacks());
    
    bleService->start();
    
    // 设置广播
    NimBLEAdvertising* advertising = NimBLEDevice::getAdvertising();
    advertising->addServiceUUID(BLE_SERVICE_UUID);
    advertising->setScanResponse(true);
    advertising->setMinPreferred(0x06);
    advertising->start();
    
    Serial.println("[BLE] 蓝牙服务已启动，等待配网连接...");
}

// ========== 连接函数 ==========
void connectWiFi() {
    Serial.printf("[WIFI] 连接到: %s\n", WIFI_SSID);
    
    if (strlen(WIFI_SSID) == 0 || strcmp(WIFI_SSID, "YOUR_WIFI_SSID") == 0) {
        Serial.println("[WIFI] 未配置WiFi，请使用蓝牙配网");
        return;
    }
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
        
        // LED闪烁指示
        if (attempts % 2 == 0) {
            digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        }
    }
    
    digitalWrite(LED_PIN, LOW);
    
    if (WiFi.status() == WL_CONNECTED) {
        provisioned = true;
        Serial.println();
        Serial.println("[WIFI] WiFi连接成功!");
        Serial.printf("       IP地址: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("       信号强度: %d dBm\n", WiFi.RSSI());
    } else {
        Serial.println();
        Serial.println("[WIFI] WiFi连接失败");
    }
}

bool connectMQTT() {
    Serial.println("[MQTT] 连接服务器...");
    
    String clientId = String(DEVICE_ID) + "-" + String(millis());
    
    bool connected;
    if (strlen(MQTT_USER) > 0) {
        connected = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
    } else {
        connected = mqttClient.connect(clientId.c_str());
    }
    
    if (connected) {
        Serial.println("[MQTT] 连接成功!");
        
        // 订阅命令主题
        String commandTopic = String("device/") + DEVICE_ID + "/command";
        mqttClient.subscribe(commandTopic.c_str());
        Serial.printf("[MQTT] 已订阅: %s\n", commandTopic.c_str());
        
        // 订阅WiFi配置主题
        String wifiConfigTopic = String("device/") + DEVICE_ID + "/config/wifi";
        mqttClient.subscribe(wifiConfigTopic.c_str());
        
        // 发布上线状态
        publishStatus();
        
        return true;
    } else {
        Serial.printf("[MQTT] 连接失败，错误码: %d\n", mqttClient.state());
        return false;
    }
}

// ========== 发布函数 ==========
void publishStatus() {
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["device_type"] = DEVICE_TYPE;
    doc["firmware"] = FIRMWARE_VERSION;
    doc["status"] = "online";
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    doc["uptime"] = millis() / 1000;
    
    char payload[256];
    serializeJson(doc, payload);
    
    String topic = String("device/") + DEVICE_ID + "/status";
    mqttClient.publish(topic.c_str(), payload, true);
    
    Serial.printf("[MQTT] 发布状态: %s\n", payload);
}

void publishTelemetry() {
    StaticJsonDocument<512> doc;
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = millis();
    doc["uptime"] = millis() / 1000;
    doc["rssi"] = WiFi.RSSI();
    
    // 根据设备类型添加对应数据
    if (strcmp(DEVICE_TYPE, "sensor") == 0 || strcmp(DEVICE_TYPE, "custom") == 0) {
        doc["temperature"] = deviceState.temperature;
        doc["humidity"] = deviceState.humidity;
        doc["battery"] = deviceState.batteryVoltage;
    }
    
    if (strcmp(DEVICE_TYPE, "switch") == 0 || strcmp(DEVICE_TYPE, "relay") == 0) {
        doc["relay"] = deviceState.relayState;
        doc["led"] = deviceState.ledState;
    }
    
    char payload[512];
    serializeJson(doc, payload);
    
    String topic = String("device/") + DEVICE_ID + "/telemetry";
    mqttClient.publish(topic.c_str(), payload);
    
    Serial.printf("[MQTT] 发布遥测: %s\n", payload);
}

void sendHeartbeat() {
    StaticJsonDocument<128> doc;
    doc["device_id"] = DEVICE_ID;
    doc["rssi"] = WiFi.RSSI();
    doc["uptime"] = millis() / 1000;
    doc["free_heap"] = ESP.getFreeHeap();
    doc["timestamp"] = millis();
    
    char payload[128];
    serializeJson(doc, payload);
    
    String topic = String("device/") + DEVICE_ID + "/heartbeat";
    mqttClient.publish(topic.c_str(), payload);
}

// ========== MQTT消息处理 ==========
void handleMQTTMessage(char* topic, byte* payload, unsigned int length) {
    // 复制消息内容
    char message[length + 1];
    memcpy(message, payload, length);
    message[length] = '\0';
    
    Serial.printf("[MQTT] 收到消息 [%s]: %s\n", topic, message);
    
    // 提取命令
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (error) {
        Serial.println("[MQTT] JSON解析失败");
        return;
    }
    
    const char* cmd = doc["command"];
    
    if (cmd == nullptr) {
        Serial.println("[MQTT] 无效命令");
        return;
    }
    
    Serial.printf("[MQTT] 执行命令: %s\n", cmd);
    
    // ========== 命令处理 ==========
    
    // 系统命令
    if (strcmp(cmd, "ping") == 0) {
        StaticJsonDocument<64> response;
        response["ack"] = "pong";
        char respBuffer[64];
        serializeJson(response, respBuffer);
        String topic = String("device/") + DEVICE_ID + "/response";
        mqttClient.publish(topic.c_str(), respBuffer);
    }
    else if (strcmp(cmd, "reboot") == 0) {
        Serial.println("[CMD] 执行重启...");
        delay(500);
        ESP.restart();
    }
    else if (strcmp(cmd, "get_status") == 0) {
        publishStatus();
        publishTelemetry();
    }
    
    // 开关/继电器控制
    else if (strcmp(cmd, "relay_on") == 0) {
        controlRelay(true);
    }
    else if (strcmp(cmd, "relay_off") == 0) {
        controlRelay(false);
    }
    else if (strcmp(cmd, "relay_toggle") == 0) {
        controlRelay(!deviceState.relayState);
    }
    else if (strcmp(cmd, "led_on") == 0) {
        deviceState.ledState = true;
        digitalWrite(LED_PIN, HIGH);
    }
    else if (strcmp(cmd, "led_off") == 0) {
        deviceState.ledState = false;
        digitalWrite(LED_PIN, LOW);
    }
    
    // WiFi配置更新
    else if (strcmp(cmd, "update_wifi") == 0) {
        if (doc.containsKey("ssid") && doc.containsKey("password")) {
            const char* newSsid = doc["ssid"];
            const char* newPass = doc["password"];
            
            strncpy(WIFI_SSID, newSsid, sizeof(WIFI_SSID) - 1);
            strncpy(WIFI_PASSWORD, newPass, sizeof(WIFI_PASSWORD) - 1);
            
            Serial.println("[CMD] WiFi配置已更新，准备重启...");
            delay(1000);
            ESP.restart();
        }
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
        String topic = String("device/") + DEVICE_ID + "/info";
        mqttClient.publish(topic.c_str(), respBuffer);
    }
    
    // OTA固件升级
    else if (strcmp(cmd, "ota_update") == 0) {
        if (doc.containsKey("url")) {
            const char* url = doc["url"];
            const char* version = doc["version"] || "unknown";
            
            Serial.println("[OTA] 收到固件升级请求");
            Serial.printf("[OTA] URL: %s\n", url);
            Serial.printf("[OTA] Version: %s\n", version);
            
            startOTAUpdate(url, version);
        } else {
            Serial.println("[OTA] 错误: 未提供固件URL");
            publishOTAComplete(false, "No URL provided");
        }
    }
    
    // 自定义命令 (可通过代码扩展)
    else {
        Serial.printf("[CMD] 未知命令: %s\n", cmd);
    }
}

// ========== 硬件控制函数 ==========
void readSensorData() {
    // 模拟传感器数据 (替换为实际传感器读取代码)
    deviceState.temperature = 20.0 + random(-50, 50) / 10.0;
    deviceState.humidity = 50.0 + random(-100, 100) / 10.0;
    deviceState.batteryVoltage = 3.7 + random(-20, 20) / 100.0;
    deviceState.rssi = WiFi.RSSI();
    
    // 实际项目中可以添加:
    // #include <DHT.h>
    // DHT dht(DHT_PIN, DHT11);
    // deviceState.temperature = dht.readTemperature();
    // deviceState.humidity = dht.readHumidity();
    
    // 读取ADC获取电池电压
    // deviceState.batteryVoltage = analogRead(BAT_ADC_PIN) * 3.3 / 4096.0 * 2;
}

void controlRelay(bool state) {
    deviceState.relayState = state;
    digitalWrite(RELAY_PIN, state ? HIGH : LOW);
    Serial.printf("[RELAY] 继电器: %s\n", state ? "开启" : "关闭");
    
    // 发布继电器状态
    StaticJsonDocument<64> doc;
    doc["relay"] = state;
    char payload[64];
    serializeJson(doc, payload);
    String topic = String("device/") + DEVICE_ID + "/relay";
    mqttClient.publish(topic.c_str(), payload);
}

void blinkLED(int times) {
    for (int i = 0; i < times; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
    }
}

// ========== 配网模式 ==========
void enterProvisioningMode() {
    Serial.println();
    Serial.println("╔══════════════════════════════════════════╗");
    Serial.println("║         进入蓝牙配网模式                  ║");
    Serial.println("╚══════════════════════════════════════════╝");
    Serial.println();
    Serial.println("请使用手机APP连接蓝牙并配置WiFi");
    Serial.printf("蓝牙名称: %s\n", DEVICE_ID);
    Serial.printf("蓝牙UUID: %s\n", BLE_SERVICE_UUID);
    Serial.println();
    
    // LED快闪指示配网模式
    while (true) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
        
        // 处理蓝牙连接
        delay(100);
    }
}

// ========== OTA固件升级 ==========
void startOTAUpdate(const char* url, const char* version) {
    Serial.println("[OTA] 开始固件升级...");
    
    // 闪烁LED表示正在升级
    otaInProgress = true;
    otaProgress = 0;
    otaVersion = version;
    otaStartTime = millis();
    
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
    
    Update.setProgressCallback([](size_t current, size_t total) {
        otaProgress = current;
    });
    
    // 写入固件
    File file = SPIFFS.open("/temp_firmware.bin", FILE_WRITE);
    if (!file) {
        Serial.println("[OTA] 无法创建临时文件");
        publishOTAComplete(false, "Cannot create temp file");
        otaInProgress = false;
        http.end();
        return;
    }
    
    // 透传下载
    WiFiClient* stream = http.getStreamPtr();
    size_t written = 0;
    int lastProgress = 0;
    
    while (http.connected() && (written < contentLength)) {
        size_t available = stream->available();
        if (available) {
            uint8_t buf[512];
            size_t readBytes = stream->readBytes(buf, min(available, sizeof(buf)));
            file.write(buf, readBytes);
            written += readBytes;
            
            int progress = (written * 100) / contentLength;
            if (progress - lastProgress >= 10) {
                Serial.printf("[OTA] 下载进度: %d%%\n", progress);
                lastProgress = progress;
            }
        }
        delay(1);
    }
    
    file.close();
    http.end();
    
    Serial.printf("[OTA] 下载完成: %d bytes\n", written);
    
    // 执行更新
    Serial.println("[OTA] 开始写入固件...");
    
    file = SPIFFS.open("/temp_firmware.bin", FILE_READ);
    if (!file) {
        Serial.println("[OTA] 无法读取临时文件");
        publishOTAComplete(false, "Cannot read temp file");
        otaInProgress = false;
        return;
    }
    
    written = 0;
    while (file.available()) {
        uint8_t buf[512];
        size_t readBytes = file.readBytes(buf, sizeof(buf));
        written += Update.write(buf, readBytes);
        
        if (written % 4096 == 0) {
            Serial.printf("[OTA] 写入进度: %d/%d\n", written, contentLength);
        }
    }
    
    file.close();
    SPIFFS.remove("/temp_firmware.bin");
    
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

void publishOTAProgress(int progress) {
    StaticJsonDocument<64> doc;
    doc["progress"] = progress;
    doc["version"] = otaVersion;
    
    char payload[64];
    serializeJson(doc, payload);
    
    String topic = String("device/") + DEVICE_ID + "/ota/progress";
    mqttClient.publish(topic.c_str(), payload);
}

void publishOTAComplete(bool success, const char* error) {
    StaticJsonDocument<128> doc;
    doc["status"] = success ? "complete" : "error";
    doc["version"] = otaVersion;
    doc["current_version"] = FIRMWARE_VERSION;
    
    if (error) {
        doc["error"] = error;
    }
    
    char payload[128];
    serializeJson(doc, payload);
    
    String topic = String("device/") + DEVICE_ID + "/ota/result";
    mqttClient.publish(topic.c_str(), payload);
    
    otaInProgress = false;
}
