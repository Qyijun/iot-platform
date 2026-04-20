<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务器配置</span>
        </div>
      </template>

      <el-form :model="serverConfig" label-width="100px">
        <el-form-item label="协议类型">
          <el-radio-group v-model="serverConfig.protocol">
            <el-radio label="http">HTTP</el-radio>
            <el-radio label="https">HTTPS</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="IP版本">
          <el-radio-group v-model="serverConfig.ipVersion">
            <el-radio label="ipv4">IPv4</el-radio>
            <el-radio label="ipv6">IPv6</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="服务器地址">
          <el-input v-model="serverConfig.host" placeholder="如: 192.168.1.100 或 [::1]">
            <template #prepend>
              <el-select v-model="serverConfig.protocol" style="width: 90px">
                <el-option label="http" value="http" />
                <el-option label="https" value="https" />
              </el-select>
            </template>
            <template #append>
              <el-input-number v-model="serverConfig.port" :min="1" :max="65535" style="width: 100px" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="完整地址">
          <el-input :value="fullUrl" readonly class="full-url">
            <template #suffix>
              <el-button link @click="copyUrl" title="复制">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
          <el-button @click="testConnection">测试连接</el-button>
          <el-button @click="resetToDefault">恢复默认</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="status-info">
        <el-tag :type="connectionStatus.type">{{ connectionStatus.text }}</el-tag>
        <span class="current-url">当前使用: {{ currentUrl }}</span>
      </div>
    </el-card>

    <el-card class="mt-16">
      <template #header>
        <div class="card-header">
          <span>预设服务器</span>
          <el-button size="small" @click="addPreset">添加预设</el-button>
        </div>
      </template>

      <el-table :data="presets" style="width: 100%">
        <el-table-column prop="name" label="名称" width="120" />
        <el-table-column prop="url" label="地址" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="usePreset(row)">使用</el-button>
            <el-button link type="danger" @click="removePreset(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'

const serverConfig = ref({
  protocol: 'http',
  ipVersion: 'ipv4',
  host: '192.168.3.59',
  port: 3000
})

const connectionStatus = ref({ type: 'info', text: '未测试' })
const currentUrl = ref('')
const presets = ref([])

const fullUrl = computed(() => {
  const { protocol, host, port } = serverConfig.value
  return `${protocol}://${host}:${port}`
})

const currentFullUrl = computed(() => {
  return `${serverConfig.value.protocol}://${serverConfig.value.host}:${serverConfig.value.port}`
})

const saveConfig = () => {
  localStorage.setItem('iot_server_config', JSON.stringify(serverConfig.value))
  ElMessage.success('配置已保存')
  currentUrl.value = fullUrl.value
  
  // 更新全局API地址
  window.IOT_API_BASE = fullUrl.value
}

const testConnection = async () => {
  connectionStatus.value = { type: 'warning', text: '测试中...' }
  
  try {
    const res = await fetch(`${fullUrl.value}/api/devices`, {
      headers: { 'Authorization': localStorage.getItem('iot_token') ? `Bearer ${localStorage.getItem('iot_token')}` : '' }
    })
    
    if (res.ok) {
      connectionStatus.value = { type: 'success', text: '连接成功' }
      ElMessage.success('服务器连接正常')
    } else {
      connectionStatus.value = { type: 'danger', text: '连接失败' }
      ElMessage.error(`连接失败: ${res.status}`)
    }
  } catch (e) {
    connectionStatus.value = { type: 'danger', text: '连接失败' }
    ElMessage.error('无法连接到服务器')
  }
}

const resetToDefault = () => {
  serverConfig.value = {
    protocol: 'http',
    ipVersion: 'ipv4',
    host: '192.168.3.59',
    port: 3000
  }
  saveConfig()
}

const copyUrl = () => {
  navigator.clipboard.writeText(fullUrl.value)
  ElMessage.success('地址已复制')
}

const addPreset = () => {
  const name = prompt('请输入预设名称:')
  if (name) {
    presets.value.push({ name, url: fullUrl.value })
    localStorage.setItem('iot_server_presets', JSON.stringify(presets.value))
  }
}

const usePreset = (preset) => {
  try {
    const url = new URL(preset.url)
    serverConfig.value.protocol = url.protocol.replace(':', '')
    serverConfig.value.host = url.hostname.replace('[', '').replace(']', '')
    serverConfig.value.port = parseInt(url.port)
    saveConfig()
    ElMessage.success(`已切换到: ${preset.name}`)
  } catch (e) {
    ElMessage.error('预设地址格式错误')
  }
}

const removePreset = (preset) => {
  presets.value = presets.value.filter(p => p.url !== preset.url)
  localStorage.setItem('iot_server_presets', JSON.stringify(presets.value))
}

onMounted(() => {
  // 加载保存的配置
  const saved = localStorage.getItem('iot_server_config')
  if (saved) {
    serverConfig.value = JSON.parse(saved)
    currentUrl.value = fullUrl.value
  }

  // 加载预设
  const savedPresets = localStorage.getItem('iot_server_presets')
  if (savedPresets) {
    presets.value = JSON.parse(savedPresets)
  }
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.full-url {
  font-family: monospace;
  background: #f5f7fa;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-url {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.mt-16 {
  margin-top: 16px;
}
</style>
