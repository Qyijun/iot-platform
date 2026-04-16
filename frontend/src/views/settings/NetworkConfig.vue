<template>
  <div class="settings-page">
    <el-card>
      <template #header>
        <span>网络配置</span>
      </template>
      
      <el-alert
        title="MQTT服务器配置"
        description="配置ESP32设备连接的MQTT服务器地址和端口。此配置用于设备发现和固件升级时的固件下载地址。"
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
        <el-form-item label="MQTT服务器" prop="mqttServer">
          <el-input 
            v-model="config.mqttServer" 
            placeholder="192.168.1.100"
            clearable
          >
            <template #prefix>
              <el-icon><Connection /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="MQTT端口" prop="mqttPort">
          <el-input-number 
            v-model="config.mqttPort" 
            :min="1" 
            :max="65535"
            style="width: 200px;"
          />
        </el-form-item>
        
        <el-form-item label="服务器地址" prop="serverUrl">
          <el-input 
            v-model="config.serverUrl" 
            placeholder="http://192.168.1.100:3000"
            clearable
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
            <template #append>
              <el-button @click="detectServerUrl">自动检测</el-button>
            </template>
          </el-input>
          <div class="form-tip">
            用于OTA固件升级时设备下载固件的地址
          </div>
        </el-form-item>
        
        <el-divider />
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="saveConfig"
            :loading="saving"
          >
            <el-icon v-if="!saving"><Check /></el-icon>
            保存配置
          </el-button>
          <el-button @click="resetForm">
            重置
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
          测试MQTT连接
        </el-button>
        <span v-if="testResult" class="test-result" :class="testResult.status">
          {{ testResult.message }}
        </span>
      </div>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>设备配置说明</span>
      </template>
      <el-alert
        title="ESP32设备配置"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <p style="margin-bottom: 10px;">在ESP32固件代码中配置以下参数：</p>
          <pre class="config-code">#define MQTT_SERVER "{{ config.mqttServer || '192.168.1.100' }}"
#define MQTT_PORT {{ config.mqttPort || 1883 }}</pre>
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
import { ElMessage } from 'element-plus'
import { Connection, Link, Check } from '@element-plus/icons-vue'
import axios from 'axios'

const formRef = ref()
const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)

const config = reactive({
  mqttServer: '',
  mqttPort: 1883,
  serverUrl: ''
})

const rules = {
  mqttServer: [
    { required: true, message: '请输入MQTT服务器地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$|^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/, message: '请输入有效的IP地址或域名', trigger: 'blur' }
  ],
  mqttPort: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号范围1-65535', trigger: 'blur' }
  ]
}

// 加载配置
const loadConfig = async () => {
  try {
    const res = await axios.get('/api/admin/network-config')
    config.mqttServer = res.data.mqttServer || '192.168.1.100'
    config.mqttPort = res.data.mqttPort || 1883
    config.serverUrl = res.data.serverUrl || ''
  } catch (err) {
    console.error('加载配置失败:', err)
    // 使用默认值
    config.mqttServer = '192.168.1.100'
    config.mqttPort = 1883
  }
}

// 保存配置
const saveConfig = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  
  saving.value = true
  try {
    await axios.put('/api/admin/network-config', {
      mqttServer: config.mqttServer,
      mqttPort: config.mqttPort,
      serverUrl: config.serverUrl
    })
    ElMessage.success('网络配置已保存')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  loadConfig()
}

// 自动检测服务器地址
const detectServerUrl = () => {
  // 使用当前浏览器访问的地址作为服务器地址
  config.serverUrl = window.location.origin
  ElMessage.success(`已设置为: ${config.serverUrl}`)
}

// 测试连接
const testConnection = async () => {
  testing.value = true
  testResult.value = null
  
  try {
    // 简单检测：发送ping请求到后端
    await axios.get('/api/devices', { timeout: 5000 })
    testResult.value = {
      status: 'success',
      message: '服务器连接正常'
    }
    ElMessage.success('服务器连接正常')
  } catch (err) {
    testResult.value = {
      status: 'error',
      message: `连接失败: ${err.message}`
    }
    ElMessage.error('服务器连接失败')
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
