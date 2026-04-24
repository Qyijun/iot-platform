<template>
  <div class="settings-page">
    <el-card>
      <template #header>
        <span>网络配置</span>
      </template>
      
      <el-alert
        title="前端服务器配置"
        description="配置前端连接的后端服务器地址。切换服务器后需要重新登录。"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <el-form 
        ref="formRef"
        :model="config" 
        :rules="rules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="后端服务器" prop="apiServer">
          <el-input 
            v-model="config.apiServer" 
            placeholder="http://192.168.1.100:3000 或 http://[::1]:3000"
            clearable
          >
            <template #prefix>
              <el-icon><Connection /></el-icon>
            </template>
            <template #append>
              <el-button @click="detectServerUrl">当前浏览器</el-button>
            </template>
          </el-input>
          <div class="form-tip">
            支持 IPv4 和 IPv6 地址，例如：<br/>
            • IPv4: <code>http://192.168.1.100:3000</code><br/>
            • IPv6: <code>http://[::1]:3000</code> 或 <code>http://[fe80::1]:3000</code>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="saveConfig"
            :loading="saving"
          >
            <el-icon v-if="!saving"><Check /></el-icon>
            保存并应用
          </el-button>
          <el-button @click="resetForm">
            重置
          </el-button>
          <el-button @click="clearConfig">
            使用默认（当前页面）
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-divider content-position="left">连接测试</el-divider>
      
      <div class="test-section">
        <el-button 
          @click="testConnection"
          :loading="testing"
        >
          <el-icon><Connection /></el-icon>
          测试连接
        </el-button>
        <span v-if="testResult" class="test-result" :class="testResult.status">
          {{ testResult.message }}
        </span>
      </div>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>MQTT服务器配置</span>
      </template>
      <el-alert
        title="ESP32设备连接配置"
        description="配置ESP32设备连接的MQTT服务器地址和端口。此配置用于设备发现和固件升级时的固件下载地址。"
        type="warning"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <el-form 
        ref="mqttFormRef"
        :model="mqttConfig" 
        :rules="mqttRules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="MQTT服务器" prop="mqttServer">
          <el-input 
            v-model="mqttConfig.mqttServer" 
            placeholder="192.168.1.100 或 [::1]"
            clearable
          >
            <template #prefix>
              <el-icon><Connection /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            支持 IPv4、IPv6 地址或域名，例如：<br/>
            • IPv4: <code>192.168.1.100</code><br/>
            • IPv6: <code>[::1]</code> 或 <code>[fe80::1]</code>
          </div>
        </el-form-item>
        
        <el-form-item label="MQTT端口" prop="mqttPort">
          <el-input-number 
            v-model="mqttConfig.mqttPort" 
            :min="1" 
            :max="65535"
            style="width: 200px;"
          />
        </el-form-item>
        
        <el-form-item label="固件下载地址" prop="serverUrl">
          <el-input 
            v-model="mqttConfig.serverUrl" 
            placeholder="http://192.168.1.100:3000"
            clearable
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            用于OTA固件升级时设备下载固件的地址
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="saveMqttConfig"
            :loading="mqttSaving"
          >
            <el-icon v-if="!mqttSaving"><Check /></el-icon>
            保存MQTT配置
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-divider content-position="left">设备配置代码</el-divider>
      
      <el-alert
        title="ESP32设备配置"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p style="margin-bottom: 10px;">在ESP32固件代码中配置以下参数：</p>
          <pre class="config-code">#define MQTT_SERVER "{{ formatMqttServer(mqttConfig.mqttServer) }}"
#define MQTT_PORT {{ mqttConfig.mqttPort || 1883 }}
#define OTA_SERVER "{{ mqttConfig.serverUrl || 'http://192.168.1.100:3000' }}"</pre>
          <p style="margin-top: 10px; color: #909399; font-size: 12px;">
            修改固件代码后需要重新烧录才能生效，或使用OTA远程升级
          </p>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Link, Check } from '@element-plus/icons-vue'
import axios from 'axios'

const formRef = ref()
const mqttFormRef = ref()
const saving = ref(false)
const mqttSaving = ref(false)
const testing = ref(false)
const testResult = ref(null)

const config = reactive({
  apiServer: ''
})

const mqttConfig = reactive({
  mqttServer: '',
  mqttPort: 1883,
  serverUrl: ''
})

const rules = {
  apiServer: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' },
    { pattern: /^https?:\/\/(\[[\da-fA-F:]+\]|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9])(:\d+)?\/?$/, message: '请输入有效的URL（IPv4/IPv6/域名）', trigger: 'blur' }
  ]
}

const mqttRules = {
  mqttServer: [
    { required: true, message: '请输入MQTT服务器地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$|^\[[\da-fA-F:]+\]$|^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]$/, message: '请输入有效的IPv4/IPv6地址或域名', trigger: 'blur' }
  ],
  mqttPort: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号范围1-65535', trigger: 'blur' }
  ]
}

// 格式化MQTT服务器地址（ESP32代码中需要处理IPv6）
const formatMqttServer = (server) => {
  if (!server) return '192.168.1.100'
  // 如果是IPv6地址，已经带有方括号
  if (server.startsWith('[')) return server
  return server
}

// 加载配置
const loadConfig = async () => {
  // 加载前端服务器配置
  config.apiServer = localStorage.getItem('apiBaseUrl') || window.location.origin
  
  // 加载MQTT配置
  try {
    const res = await axios.get('/api/admin/network-config')
    mqttConfig.mqttServer = res.data.mqttServer || '192.168.1.100'
    mqttConfig.mqttPort = res.data.mqttPort || 1883
    mqttConfig.serverUrl = res.data.serverUrl || ''
  } catch (err) {
    console.error('加载MQTT配置失败:', err)
    mqttConfig.mqttServer = '192.168.1.100'
    mqttConfig.mqttPort = 1883
  }
}

// 解析并处理 URL（支持 IPv6 Zone ID）
const parseUrl = (url) => {
  try {
    // 检测 IPv6 链路本地地址（如 fe80::1%eth0 或 fe80::1%17）
    const ipv6LinkLocal = url.match(/^https?:\/\/\[fe80::[^\]]+%[^\]]+\]/i)
    if (ipv6LinkLocal) {
      // 移除 Zone ID（浏览器通常无法处理）
      return url.replace(/%[^%]+%?\](:|$)/, ']$1')
    }
    return url
  } catch {
    return url
  }
}

// 保存前端服务器配置
const saveConfig = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  
  saving.value = true
  try {
    const newUrl = parseUrl(config.apiServer.trim())
    
    // 测试新服务器连接
    try {
      const testApi = axios.create({ baseURL: newUrl, timeout: 5000 })
      await testApi.get('/api/devices')
    } catch (err) {
      ElMessage.warning('连接测试失败，但仍将保存配置')
    }
    
    // 保存到 localStorage
    localStorage.setItem('apiBaseUrl', newUrl)
    
    // 更新 axios 默认配置
    axios.defaults.baseURL = newUrl
    
    ElMessage.success('服务器地址已保存，将跳转到新服务器')
    
    // 延迟跳转到新服务器
    setTimeout(() => {
      window.location.href = newUrl + '/#/login'
    }, 1000)
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存MQTT配置
const saveMqttConfig = async () => {
  const valid = await mqttFormRef.value?.validate().catch(() => false)
  if (!valid) return
  
  mqttSaving.value = true
  try {
    await axios.put('/api/admin/network-config', {
      mqttServer: mqttConfig.mqttServer,
      mqttPort: mqttConfig.mqttPort,
      serverUrl: mqttConfig.serverUrl
    })
    ElMessage.success('MQTT配置已保存')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    mqttSaving.value = false
  }
}

// 重置表单
const resetForm = () => {
  loadConfig()
}

// 清除配置，使用当前浏览器地址
const clearConfig = () => {
  ElMessageBox.confirm(
    '将使用当前浏览器地址连接服务器，并清除已保存的配置？',
    '确认',
    { type: 'warning' }
  ).then(() => {
    localStorage.removeItem('apiBaseUrl')
    axios.defaults.baseURL = ''
    config.apiServer = window.location.origin
    ElMessage.success('已恢复使用当前浏览器地址')
  }).catch(() => {})
}

// 自动检测服务器地址
const detectServerUrl = () => {
  config.apiServer = window.location.origin
  ElMessage.success(`已设置为: ${config.apiServer}`)
}

// 测试连接
const testConnection = async () => {
  testing.value = true
  testResult.value = null
  
  const targetUrl = parseUrl(config.apiServer.trim())
  
  try {
    const testApi = axios.create({ 
      baseURL: targetUrl, 
      timeout: 5000,
      headers: {} // 不携带 Authorization
    })
    
    // 尝试访问登录接口（不需要 Token）
    await testApi.post('/api/auth/login', {}, { validateStatus: () => true })
    
    testResult.value = {
      status: 'success',
      message: `连接成功！服务器正常响应`
    }
    ElMessage.success('连接成功')
  } catch (err) {
    // 即使是 401/403 也表示服务器是通的
    if (err.response) {
      testResult.value = {
        status: 'success',
        message: `服务器连接正常（状态码: ${err.response.status}）`
      }
      ElMessage.success('服务器连接正常')
    } else {
      testResult.value = {
        status: 'error',
        message: `连接失败: ${err.message}`
      }
      ElMessage.error('连接失败')
    }
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.settings-page {
  padding: 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.test-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.test-result {
  font-size: 14px;
}

.test-result.success {
  color: #67c23a;
}

.test-result.error {
  color: #f56c6c;
}

.config-code {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  color: #409eff;
  margin: 8px 0;
}
</style>
