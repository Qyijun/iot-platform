#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <Update.h>
#include <ArduinoJson.h>
#include <esp_system.h>

#define AP_SSID "ESP32-Config"
#define AP_PASS "12345678"
#define FIRMWARE_VERSION "1.4.0"
#define DEVICE_ID "device_001"

bool otaInProgress = false;
String otaVersion = "";
int otaProgress = 0;

struct DeviceState { bool relayState, ledState; float temp, hum; } ds = {false, false, 0, 0};
unsigned long lastHeartbeat = 0, lastDataPublish = 0;

void startOTAUpdate(const char* url, const char* version);
void publishOTAProgress(int percent);
void publishOTAComplete(bool success, const char* error);
void publishStatus();
void publishTelemetry();

WebServer server(80);
Preferences prefs;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

bool isConfigMode = false;
bool isConnected = false;

#define FLASH_BTN 0
int flashPressCount = 0;
unsigned long flashPressStart = 0;
unsigned long lastFlashPress = 0;

const char HTML_PAGE[] PROGMEM = R"=====(<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>ESP32 Config</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:15px}.container{background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.3);width:100%;max-width:480px}.header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:20px;text-align:center;border-radius:20px 20px 0 0}.content{padding:20px}.section-title{font-size:13px;color:#667eea;margin:15px 0 10px;font-weight:600}.form-group{margin-bottom:12px}.form-group label{display:block;color:#333;margin-bottom:4px;font-size:13px}.form-group input{width:100%;padding:10px;border:2px solid #e1e1e1;border-radius:8px;font-size:14px}.form-group input:focus{border-color:#667eea;outline:none}.wifi-list{max-height:150px;overflow-y:auto;border:2px solid #e1e1e1;border-radius:8px;margin-top:8px}.wifi-item{padding:10px;border-bottom:1px solid #eee;cursor:pointer}.wifi-item:last-child{border-bottom:none}.wifi-item:hover{background:#f5f5f5}.wifi-name{font-weight:500}.wifi-signal{font-size:12px;color:#888}.scan-btn{width:100%;padding:10px;background:#fff;color:#667eea;border:2px solid #667eea;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px}.scan-btn:hover{background:#667eea;color:#fff}.btn{width:100%;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:15px}.status{margin-top:12px;padding:10px;border-radius:8px;text-align:center;font-size:13px;display:none}.status.ok{background:#d4edda;color:#155724;display:block}.status.err{background:#f8d7da;color:#721c24;display:block}.footer{text-align:center;padding:12px;color:#888;font-size:11px;border-top:1px solid #eee}</style></head><body><div class="container"><div class="header"><h1>ESP32 Config</h1><small id="devId">ID: -</small></div><div class="content"><form id="f"><div class="section-title">WiFi Settings</div><button type="button" class="scan-btn" id="scanBtn">Scan WiFi</button><div class="wifi-list" id="wifiList" style="display:none"></div><div class="form-group" style="margin-top:12px"><label>SSID</label><input type="text" id="ssid" placeholder="Input or select WiFi" required></div><div class="form-group"><label>Password</label><input type="password" id="pass" placeholder="WiFi password"></div><div class="section-title">MQTT Server</div><div class="form-group"><label>Server</label><input type="text" id="msrv" placeholder="192.168.1.3" required></div><div class="form-group"><label>Port</label><input type="number" id="mport" value="1883"></div><div class="form-group"><label>Username</label><input type="text" id="muser" placeholder="MQTT username"></div><div class="form-group"><label>Password</label><input type="password" id="mpass" placeholder="MQTT password"></div><button type="submit" class="btn" id="btn">Save</button><div class="status" id="st"></div></form></div><div class="footer">v)E( | <span id="devStatus">Loading...</span></div></div><script>var sn=[];function G(i){return document.getElementById(i)}function scan(){var b=G('scanBtn');b.disabled=true;b.textContent='Scanning...';G('wifiList').style.display='block';G('wifiList').innerHTML='<div style=padding:15px;text-align:center;color:#888>Scanning...</div>';function poll(){fetch('/api/wifi/scan').then(function(r){return r.json()}).then(function(d){if(d.scanning){G('wifiList').innerHTML='<div style=padding:15px;text-align:center;color:#888>Scanning...</div>';setTimeout(poll,800)}else{sn=d;var h='';for(var i=0;i<d.length;i++){h=h+'<div class=wifi-item onclick=sel('+i+')><div class=wifi-name>'+d[i].ssid+'</div><div class=wifi-signal>'+d[i].rssi+'dBm</div></div>'}if(d.length===0){h='<div style=padding:15px;text-align:center;color:#888>No networks found</div>'}G('wifiList').innerHTML=h;b.disabled=false;b.textContent='Scan WiFi'}}).catch(function(){G('wifiList').innerHTML='<div style=padding:15px;text-align:center;color:#f56c6c>Scan failed</div>';b.disabled=false;b.textContent='Scan WiFi'})}poll()}function sel(i){G('ssid').value=sn[i].ssid}G('scanBtn').onclick=scan;fetch('/api/cfg').then(function(r){return r.json()}).then(function(d){G('devId').textContent='ID: '+(d.device_id||'-');G('msrv').value=d.mqtt_server||'';G('mport').value=d.mqtt_port||1883;G('muser').value=d.mqtt_user||'';G('devStatus').textContent='Configured'}).catch(function(){G('devStatus').textContent='Not configured'});G('f').onsubmit=function(e){e.preventDefault();var d={wifi_ssid:G('ssid').value,wifi_pass:G('pass').value,mqtt_server:G('msrv').value,mqtt_port:parseInt(G('mport').value)||1883,mqtt_user:G('muser').value,mqtt_pass:G('mpass').value};G('btn').textContent='Saving...';G('btn').disabled=true;fetch('/api/cfg',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(r){var s=G('st');if(r.success){s.className='status ok';s.textContent='Saved! Restarting...'}else{s.className='status err';s.textContent='Error'}}).catch(function(){var s=G('st');s.className='status err';s.textContent='Save failed'});G('btn').textContent='Save';G('btn').disabled=false};</script></body></html>)=====";

void handleWifiScan() {
    StaticJsonDocument<4096> doc;
    JsonArray networks = doc.to<JsonArray>();
    int n = WiFi.scanComplete();
    if (n == -2) {
        WiFi.scanNetworks(true);
        doc.set("scanning");
    } else if (n >= 0) {
        for (int i = 0; i < n; i++) {
            JsonObject net = networks.add<JsonObject>();
            net["ssid"] = WiFi.SSID(i);
            net["rssi"] = WiFi.RSSI(i);
            net["channel"] = WiFi.channel(i);
            net["encrypted"] = WiFi.encryptionType(i) != 5;
        }
        WiFi.scanDelete();
    }
    String output;
    serializeJson(doc, output);
    server.send(200, "application/json", output);
}

void handleGetConfig() {
    StaticJsonDocument<512> doc;
    doc["device_id"] = prefs.getString("device_id", "");
    doc["wifi_ssid"] = prefs.getString("wifi_ssid", "");
    doc["mqtt_server"] = prefs.getString("mqtt_server", "");
    doc["mqtt_port"] = prefs.getInt("mqtt_port", 1883);
    doc["mqtt_user"] = prefs.getString("mqtt_user", "");
    doc["firmware_version"] = FIRMWARE_VERSION;
    String output;
    serializeJson(doc, output);
    server.send(200, "application/json", output);
}

void handleSaveConfig() {
    StaticJsonDocument<1024> doc;
    if (deserializeJson(doc, server.arg(0)) || !doc.containsKey("wifi_ssid")) {
        server.send(200, "application/json", "{\"success\":false,\"error\":\"Invalid\"}");
        return;
    }
    prefs.putString("wifi_ssid", doc["wifi_ssid"].as<String>());
    prefs.putString("wifi_pass", doc["wifi_pass"].as<String>());
    prefs.putString("mqtt_server", doc["mqtt_server"].as<String>());
    prefs.putInt("mqtt_port", doc["mqtt_port"] | 1883);
    prefs.putString("mqtt_user", doc["mqtt_user"].as<String>());
    prefs.putString("mqtt_pass", doc["mqtt_pass"].as<String>());
    prefs.putBool("configured", true);
    server.send(200, "application/json", "{\"success\":true}");
    delay(1000);
    ESP.restart();
}

void startConfigMode() {
    isConfigMode = true;
    Serial.println("[CONFIG] Entering config mode...");
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.printf("[CONFIG] AP: %s @ %s\n", AP_SSID, WiFi.softAPIP().toString().c_str());
    server.on("/", []() { server.send_P(200, "text/html", HTML_PAGE); });
    server.on("/api/wifi/scan", handleWifiScan);
    server.on("/api/cfg", HTTP_GET, handleGetConfig);
    server.on("/api/cfg", HTTP_POST, handleSaveConfig);
    server.begin();
    Serial.println("[CONFIG] Web server started");
}

bool connectWiFi() {
    String ssid = prefs.getString("wifi_ssid", "");
    String pass = prefs.getString("wifi_pass", "");
    if (ssid.length() == 0) return false;
    Serial.printf("[WIFI] Connecting to: %s\n", ssid.c_str());
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
        isConnected = true;
        return true;
    }
    Serial.println("\n[WIFI] Connection failed");
    return false;
}

void mqttCallback(char* topic, byte* payload, unsigned int len) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, payload, len)) return;
    const char* cmd = doc["command"];
    if (!cmd) return;
    Serial.printf("[MQTT] Command: %s\n", cmd);
    if (!strcmp(cmd, "relay")) {
        bool state = doc["state"];
        digitalWrite(2, state ? HIGH : LOW);
        ds.relayState = state;
        publishStatus();
    }
    else if (!strcmp(cmd, "led")) {
        bool state = doc["state"];
        digitalWrite(4, state ? HIGH : LOW);
        ds.ledState = state;
        publishStatus();
    }
    else if (!strcmp(cmd, "reboot")) {
        Serial.println("[MQTT] Reboot command received");
        delay(500);
        ESP.restart();
    }
    else if (!strcmp(cmd, "ota_update") && doc.containsKey("url")) {
        const char* url = doc["url"].as<const char*>();
        const char* ver = doc["version"] | "unknown";
        Serial.printf("[OTA] 收到升级请求: %s -> v%s\n", url, ver);
        startOTAUpdate(url, ver);
    }
    else if (!strcmp(cmd, "read_dht")) {
        ds.temp = random(200, 300) / 10.0;
        ds.hum = random(400, 800) / 10.0;
        publishTelemetry();
    }
    else if (!strcmp(cmd, "reset_config")) {
        prefs.clear();
        Serial.println("[CONFIG] Config cleared, restarting...");
        delay(1000);
        ESP.restart();
    }
    else if (!strcmp(cmd, "get_status")) {
        publishStatus();
    }
}

bool connectMQTT() {
    String mqtt_server = prefs.getString("mqtt_server", "");
    if (mqtt_server.length() == 0) return false;
    int port = prefs.getInt("mqtt_port", 1883);
    String mqtt_user = prefs.getString("mqtt_user", "");
    String mqtt_pass = prefs.getString("mqtt_pass", "");
    Serial.printf("[MQTT] Server: %s:%d\n", mqtt_server.c_str(), port);
    mqttClient.setServer(mqtt_server.c_str(), port);
    mqttClient.setCallback(mqttCallback);
    String clientId = "ESP32-" + String(DEVICE_ID);
    if (mqtt_user.length() > 0) {
        mqttClient.connect(clientId.c_str(), mqtt_user.c_str(), mqtt_pass.c_str());
    } else {
        mqttClient.connect(clientId.c_str());
    }
    if (!mqttClient.connected()) {
        Serial.printf("[MQTT] Failed, state: %d\n", mqttClient.state());
        return false;
    }
    Serial.println("[MQTT] Connected!");
    mqttClient.subscribe(("device/" + String(DEVICE_ID) + "/command").c_str());
    mqttClient.subscribe(("device/" + String(DEVICE_ID) + "/ota").c_str());
    publishStatus();
    return true;
}

void publishStatus() {
    StaticJsonDocument<256> doc;
    doc["online"] = true;
    doc["version"] = FIRMWARE_VERSION;
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    doc["relay"] = ds.relayState;
    doc["led"] = ds.ledState;
    doc["temp"] = ds.temp;
    doc["hum"] = ds.hum;
    char buf[256];
    serializeJson(doc, buf);
    mqttClient.publish(("device/" + String(DEVICE_ID) + "/status").c_str(), buf);
}

void publishTelemetry() {
    StaticJsonDocument<128> doc;
    doc["temp"] = ds.temp;
    doc["hum"] = ds.hum;
    char buf[128];
    serializeJson(doc, buf);
    mqttClient.publish(("device/" + String(DEVICE_ID) + "/telemetry").c_str(), buf);
    Serial.printf("[MQTT] Telemetry: %.1fC %.1f%%\n", ds.temp, ds.hum);
}

void startOTAUpdate(const char* url, const char* version) {
    Serial.println("[OTA] 开始固件升级...");
    Serial.printf("[OTA] 固件URL: %s\n", url);
    Serial.printf("[OTA] 目标版本: %s\n", version);
    otaInProgress = true;
    otaVersion = version;
    otaProgress = 0;
    publishOTAProgress(0);
    HTTPClient http;
    http.begin(url);
    http.setTimeout(30000);
    int httpCode = http.GET();
    if (httpCode != HTTP_CODE_OK) {
        Serial.printf("[OTA] HTTP错误: %d\n", httpCode);
        publishOTAComplete(false, "HTTP下载失败");
        otaInProgress = false;
        http.end();
        return;
    }
    int contentLength = http.getSize();
    if (contentLength <= 0) {
        Serial.println("[OTA] 固件大小未知");
        publishOTAComplete(false, "固件大小未知");
        otaInProgress = false;
        http.end();
        return;
    }
    Serial.printf("[OTA] 固件大小: %d 字节\n", contentLength);
    if (!Update.begin(contentLength)) {
        Serial.println("[OTA] Flash空间不足");
        publishOTAComplete(false, "Flash空间不足");
        otaInProgress = false;
        http.end();
        return;
    }
    WiFiClient* stream = http.getStreamPtr();
    size_t written = 0;
    int lastPct = 0;
    unsigned long lastPublish = 0;
    while (http.connected() && written < contentLength) {
        size_t avail = stream->available();
        if (avail) {
            uint8_t buf[512];
            size_t read = stream->readBytes(buf, min(avail, sizeof(buf)));
            written += Update.write(buf, read);
            otaProgress = (written * 100) / contentLength;
            // 每5%或每500ms发布一次进度
            unsigned long now = millis();
            if (otaProgress - lastPct >= 5 || now - lastPublish >= 500) {
                Serial.printf("[OTA] 进度: %d%%\n", otaProgress);
                publishOTAProgress(otaProgress);
                lastPct = otaProgress;
                lastPublish = now;
            }
        }
        delay(1);
    }
    // 确保发布100%
    if (otaProgress < 100) {
        publishOTAProgress(100);
    }
    http.end();
    Serial.printf("[OTA] 已下载: %d 字节\n", written);
    if (Update.end(true)) {
        Serial.println("[OTA] 升级完成!");
        publishOTAComplete(true, nullptr);
        Serial.println("[OTA] 3秒后重启...");
        delay(3000);
        ESP.restart();
    } else {
        Serial.printf("[OTA] 写入失败: %s\n", Update.errorString());
        publishOTAComplete(false, Update.errorString());
        otaInProgress = false;
    }
}

void publishOTAProgress(int percent) {
    StaticJsonDocument<64> doc;
    doc["progress"] = percent;
    doc["version"] = otaVersion;
    char buf[64];
    serializeJson(doc, buf);
    mqttClient.publish(("device/" + String(DEVICE_ID) + "/ota/progress").c_str(), buf);
}

void publishOTAComplete(bool success, const char* error) {
    StaticJsonDocument<128> doc;
    doc["status"] = success ? "complete" : "error";
    doc["version"] = otaVersion;
    doc["current_version"] = FIRMWARE_VERSION;
    if (error) doc["error"] = error;
    char buf[128];
    serializeJson(doc, buf);
    mqttClient.publish(("device/" + String(DEVICE_ID) + "/ota/result").c_str(), buf);
    otaInProgress = false;
}

void checkFlashButton() {
    int state = digitalRead(FLASH_BTN);
    unsigned long now = millis();
    if (state == LOW) {
        if (flashPressStart == 0) {
            flashPressStart = now;
            flashPressCount++;
            lastFlashPress = now;
        }
        if (now - flashPressStart > 5000 && flashPressCount >= 1) {
            Serial.println("[BTN] Long press - clearing config!");
            prefs.clear();
            delay(100);
            ESP.restart();
        }
    }
    if (now - lastFlashPress > 2000) {
        if (flashPressCount >= 3 && flashPressCount < 10) {
            Serial.println("[BTN] 3x press - entering config mode!");
            prefs.putBool("configured", false);
            delay(100);
            ESP.restart();
        }
        flashPressCount = 0;
        flashPressStart = 0;
    }
}

void setup() {
    Serial.begin(115200);
    Serial.printf("\n[START] ESP32 Firmware v%s\n", FIRMWARE_VERSION);
    pinMode(2, OUTPUT);
    pinMode(4, OUTPUT);
    digitalWrite(2, LOW);
    digitalWrite(4, LOW);
    pinMode(FLASH_BTN, INPUT_PULLUP);
    prefs.begin("iot-device", false);
    bool configured = prefs.getBool("configured", false);
    Serial.printf("[CONFIG] Mode: %s\n", configured ? "WiFi" : "Config");
    if (configured && connectWiFi()) {
        if (connectMQTT()) {
            Serial.println("[READY] Device ready!");
            return;
        }
        Serial.println("[WARN] MQTT failed, entering config mode");
    }
    startConfigMode();
}

void loop() {
    if (isConfigMode) {
        server.handleClient();
        checkFlashButton();
    } else {
        if (!mqttClient.connected()) {
            Serial.println("[MQTT] Reconnecting...");
            if (connectMQTT()) {
                Serial.println("[MQTT] Reconnected!");
            }
        }
        mqttClient.loop();
        unsigned long now = millis();
        if (now - lastHeartbeat > 60000) {
            lastHeartbeat = now;
            publishStatus();
        }
        if (now - lastDataPublish > 300000) {
            lastDataPublish = now;
            ds.temp = random(200, 300) / 10.0;
            ds.hum = random(400, 800) / 10.0;
            publishTelemetry();
        }
    }
}
