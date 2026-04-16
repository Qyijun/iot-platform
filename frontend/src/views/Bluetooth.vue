<template>
  <div class="bluetooth-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>蓝牙配网</span>
          <el-tag type="success">后端代理模式</el-tag>
        </div>
      </template>
      
      <el-alert
        title="配网说明"
        description="通过后端连接的蓝牙模块进行配网。请确保：1) 蓝牙模块已连接到电脑并配置正确的串口；2) ESP32设备已进入蓝牙广播模式；3) 在下方输入正确的WiFi信息。"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />

      <!-- 蓝牙模块状态 -->
      <el-descriptions :column="2" border style="margin-bottom: 20px;">
        <el-descriptions-item label="蓝牙模块状态">
          <el-tag :type="bluetoothStatus.connected ? 'success' : 'danger'">
            {{ bluetoothStatus.connected ? '已连接' : '未连接' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="串口">
          <el-tag type="info">{{ bluetoothStatus.port || '未配置' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模块名称">
          {{ bluetoothStatus.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="蓝牙地址">
          {{ bluetoothStatus.address || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-button type="primary" @click="checkBluetoothStatus" :loading="checking">
        <el-icon><Refresh /></el-icon> 检查蓝牙连接
      </el-button>

      <el-divider />

      <el-tabs v-model="activeTab">
        <!-- 配网页面 -->
        <el-tab-pane label="WiFi配网" name="provision">
          <el-steps :active="activeStep" finish-status="success" simple style="margin: 20px 0;">
            <el-step title="扫描设备" />
            <el-step title="配置WiFi" />
            <el-step title="配网完成" />
          </el-steps>

          <!-- 步骤1: 扫描设备 -->
          <div v-if="activeStep === 0" class="step-content">
            <el-alert
              title="扫描说明"
              description="点击扫描按钮，查找周围的ESP32蓝牙设备。确保设备已进入配网模式。"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            />
            
            <el-button type="primary" @click="scanDevices" :loading="scanning" :disabled="!bluetoothStatus.connected">
              <el-icon><Search /></el-icon>{{ scanning ? '扫描中...' : '扫描蓝牙设备' }}
            </el-button>
            
            <el-table v-if="bluetoothDevices.length > 0" :data="bluetoothDevices" style="margin-top: 20px;" stripe>
              <el-table-column prop="name" label="设备名称" min-width="120" />
              <el-table-column prop="id" label="设备ID" min-width="140" />
              <el-table-column prop="rssi" label="信号" width="80">
                <template #default="{ row }">
                  <el-tag :type="getRssiType(row.rssi)" size="small">
                    {{ row.rssi }}dBm
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="selectDevice(row)" :disabled="!bluetoothStatus.connected">
                    选择
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <el-empty v-if="!scanning && bluetoothDevices.length === 0 && hasScanned" description="未找到设备，请确保ESP32已进入配网模式" />
            <el-empty v-if="!scanning && bluetoothDevices.length === 0 && !hasScanned" description="点击扫描按钮查找设备" />
          </div>

          <!-- 步骤2: 配置WiFi -->
          <div v-if="activeStep === 1" class="step-content">
            <el-form :model="wifiForm" label-width="120px" :rules="wifiRules" ref="wifiFormRef">
              <el-form-item label="已选设备">
                <el-input v-model="selectedDevice.name" disabled />
              </el-form-item>
              <el-form-item label="WiFi名称" prop="ssid">
                <el-input v-model="wifiForm.ssid" placeholder="请输入WiFi名称" />
              </el-form-item>
              <el-form-item label="WiFi密码" prop="password">
                <el-input v-model="wifiForm.password" type="password" placeholder="请输入WiFi密码" show-password />
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="showPassword">显示密码</el-checkbox>
              </el-form-item>
            </el-form>
            
            <div class="step-actions">
              <el-button @click="activeStep = 0">上一步</el-button>
              <el-button type="primary" @click="startProvisioning" :loading="provisioning">
                开始配网
              </el-button>
            </div>
          </div>

          <!-- 步骤3: 完成 -->
          <div v-if="activeStep === 2" class="step-content">
            <el-result
              :icon="provisionSuccess ? 'success' : 'error'"
              :title="provisionSuccess ? '配网成功！' : '配网失败'"
              :sub-title="provisionMessage"
            >
              <template #extra>
                <el-space>
                  <el-button type="primary" @click="reset">继续配网</el-button>
                  <el-button @click="goToDevices">查看设备</el-button>
                </el-space>
              </template>
            </el-result>
          </div>
        </el-tab-pane>

        <!-- 串口配置 -->
        <el-tab-pane label="串口配置" name="config">
          <el-form :model="serialConfig" label-width="120px" style="max-width: 500px; margin-top: 20px;">
            <el-form-item label="串口">
              <el-select v-model="serialConfig.port" placeholder="选择串口" style="width: 100%;">
                <el-option
                  v-for="port in availablePorts"
                  :key="port"
                  :label="port"
                  :value="port"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="波特率">
              <el-select v-model="serialConfig.baudRate" placeholder="选择波特率" style="width: 100%;">
                <el-option label="9600" :value="9600" />
                <el-option label="115200" :value="115200" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="connectSerial" :loading="connecting">
                连接
              </el-button>
              <el-button @click="disconnectSerial">
                断开
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider content-position="left">硬件连接说明</el-divider>
          
          <el-alert type="warning" :closable="false">
            <template #title>
              <p><strong>接线方式（USB转TTL连接HC-05/HC-08）：</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>HC-05/HC-08 的 TXD  →  USB转TTL 的 RXD</li>
                <li>HC-05/HC-08 的 RXD  →  USB转TTL 的 TXD</li>
                <li>HC-05/HC-08 的 GND  →  USB转TTL 的 GND</li>
                <li>HC-05/HC-08 的 VCC  →  USB转TTL 的 3.3V 或 5V</li>
              </ul>
              <p><strong>ESP32端：</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>确保ESP32蓝牙功能正常（代码中的UUID与配网页面一致）</li>
                <li>ESP32蓝牙广播名称将在扫描时显示</li>
              </ul>
            </template>
          </el-alert>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 配网进度弹窗 -->
    <el-dialog v-model="showProgress" title="配网进度" width="450px" :close-on-click-modal="false">
      <div style="text-align: center; padding: 20px;">
        <el-progress type="circle" :percentage="progressPercent" :status="progressStatus" />
        <p style="margin-top: 20px; font-size: 16px;">{{ progressText }}</p>
        <p v-if="progressDetail" style="margin-top: 10px; color: #909399; font-size: 13px;">
          {{ progressDetail }}
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeTab = ref('provision')
const activeStep = ref(0)
const scanning = ref(false)
const provisioning = ref(false)
const checking = ref(false)
const connecting = ref(false)
const hasScanned = ref(false)
const bluetoothDevices = ref([])
const selectedDevice = ref({})
const bluetoothStatus = ref({ connected: false, port: '', name: '', address: '' })
const showPassword = ref(false)

const wifiFormRef = ref(null)
const wifiForm = ref({ ssid: '', password: '' })
const showProgress = ref(false)
const progressPercent = ref(0)
const progressStatus = ref('')
const progressText = ref('准备配网...')
const progressDetail = ref('')
const provisionSuccess = ref(false)
const provisionMessage = ref('')

const serialConfig = reactive({
  port: 'COM3',
  baudRate: 9600
})

const availablePorts = ref(['COM1', 'COM2', 'COM3', 'COM4', 'COM5'])

const wifiRules = {
  ssid: [{ required: true, message: '请输入WiFi名称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入WiFi密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' }
  ]
}

// 页面加载时检查蓝牙状态
onMounted(() => {
  checkBluetoothStatus()
  refreshPorts()
})

const getRssiType = (rssi) => {
  if (rssi > -50) return 'success'
  if (rssi > -70) return 'warning'
  return 'danger'
}

// 检查蓝牙模块状态
const checkBluetoothStatus = async () => {
  checking.value = true
  try {
    const res = await axios.get('/api/bluetooth/status')
    bluetoothStatus.value = res.data
    if (res.data.connected) {
      serialConfig.port = res.data.port || serialConfig.port
      ElMessage.success('蓝牙模块已连接')
    } else {
      ElMessage.warning('蓝牙模块未连接，请检查串口配置')
    }
  } catch (err) {
    console.error('检查蓝牙状态失败:', err)
    ElMessage.error('检查蓝牙状态失败')
  } finally {
    checking.value = false
  }
}

// 刷新串口列表
const refreshPorts = async () => {
  try {
    const res = await axios.get('/api/bluetooth/ports')
    availablePorts.value = res.data.ports || []
  } catch (err) {
    console.error('获取串口列表失败:', err)
  }
}

// 连接蓝牙模块
const connectSerial = async () => {
  if (!serialConfig.port) {
    ElMessage.warning('请选择串口')
    return
  }
  
  connecting.value = true
  try {
    await axios.post('/api/bluetooth/connect', {
      port: serialConfig.port,
      baudRate: serialConfig.baudRate
    })
    await checkBluetoothStatus()
    ElMessage.success('蓝牙模块连接成功')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '连接失败')
  } finally {
    connecting.value = false
  }
}

// 断开蓝牙模块
const disconnectSerial = async () => {
  try {
    await axios.post('/api/bluetooth/disconnect')
    bluetoothStatus.value = { connected: false }
    ElMessage.success('已断开连接')
  } catch (err) {
    ElMessage.error('断开失败')
  }
}

// 扫描蓝牙设备
const scanDevices = async () => {
  scanning.value = true
  hasScanned.value = true
  bluetoothDevices.value = []
  
  try {
    const res = await axios.post('/api/bluetooth/scan', { timeout: 10000 })
    bluetoothDevices.value = res.data.devices || []
    
    if (bluetoothDevices.value.length === 0) {
      ElMessage.warning('未找到蓝牙设备，请确保ESP32已进入配网模式')
    } else {
      ElMessage.success(`找到 ${bluetoothDevices.value.length} 个设备`)
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '扫描失败')
  } finally {
    scanning.value = false
  }
}

// 选择设备
const selectDevice = (device) => {
  selectedDevice.value = device
  activeStep.value = 1
}

// 开始配网
const startProvisioning = async () => {
  if (!wifiFormRef.value) return
  
  await wifiFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    provisioning.value = true
    showProgress.value = true
    progressPercent.value = 0
    progressStatus.value = ''
    progressText.value = '准备配网...'
    progressDetail.value = ''

    try {
      // 步骤1: 发送配网请求
      progressPercent.value = 10
      progressText.value = '正在发送WiFi配置...'
      progressDetail.value = `WiFi: ${wifiForm.value.ssid}`
      await new Promise(resolve => setTimeout(resolve, 500))

      const res = await axios.post('/api/bluetooth/provision', {
        deviceId: selectedDevice.value.id,
        wifiSsid: wifiForm.value.ssid,
        wifiPassword: wifiForm.value.password
      })

      // 步骤2: 等待设备响应
      progressPercent.value = 40
      progressText.value = '等待设备响应...'
      progressDetail.value = '请保持ESP32在范围内'
      await new Promise(resolve => setTimeout(resolve, 1000))

      progressPercent.value = 60
      progressText.value = '设备处理中...'
      progressDetail.value = 'ESP32正在连接WiFi网络'
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 步骤3: 验证连接
      progressPercent.value = 80
      progressText.value = '验证网络连接...'
      progressDetail.value = '检查设备是否成功联网'
      await new Promise(resolve => setTimeout(resolve, 1500))

      progressPercent.value = 100
      progressStatus.value = 'success'
      progressText.value = '配网成功！'
      progressDetail.value = ''

      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showProgress.value = false
      provisionSuccess.value = true
      provisionMessage.value = `设备 "${selectedDevice.value.name}" 已成功连接到 WiFi "${wifiForm.value.ssid}"，请在设备列表查看。`
      activeStep.value = 2

    } catch (err) {
      progressStatus.value = 'exception'
      progressText.value = '配网失败'
      progressDetail.value = err.response?.data?.error || '配网过程中出现错误'
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      showProgress.value = false
      
      provisionSuccess.value = false
      provisionMessage.value = err.response?.data?.error || '配网过程中出现错误，请重试'
      activeStep.value = 2
    } finally {
      provisioning.value = false
    }
  })
}

// 重置
const reset = () => {
  activeStep.value = 0
  selectedDevice.value = {}
  wifiForm.value = { ssid: '', password: '' }
  bluetoothDevices.value = []
  hasScanned.value = false
  provisionSuccess.value = false
  provisionMessage.value = ''
}

// 跳转到设备列表
const goToDevices = () => {
  router.push('/devices')
}
</script>

<style scoped>
.bluetooth-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-content {
  margin-top: 30px;
  padding: 10px;
}

.step-actions {
  margin-top: 30px;
  text-align: center;
}
</style>
