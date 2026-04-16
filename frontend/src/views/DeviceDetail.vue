<template>
  <div class="device-detail">
    <el-page-header @back="$router.back()" title="设备详情" />
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
        <el-card>
          <template #header>基本信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="设备ID">{{ device.device_id }}</el-descriptions-item>
            <el-descriptions-item label="名称">
              <span v-if="!editingName">{{ device.name }}</span>
              <span v-else>
                <el-input v-model="newName" size="small" style="width: 200px;" @keyup.enter="saveName" />
                <el-button type="primary" size="small" link @click="saveName">保存</el-button>
                <el-button size="small" link @click="cancelEditName">取消</el-button>
              </span>
              <el-button type="primary" link @click="startEditName" style="margin-left: 8px;">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-descriptions-item>
            <el-descriptions-item label="设备协议">{{ getProtocolName(device.type) }}</el-descriptions-item>
            <el-descriptions-item label="协议类型">
              <el-tag size="small" :type="getProtocolTagType(device.type)">
                {{ device.type || 'generic' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="device.online ? 'success' : 'info'">
                {{ device.online ? '在线' : '离线' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="IP">{{ device.ip || '-' }}</el-descriptions-item>
            <el-descriptions-item label="固件版本">{{ device.version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="信号强度">
              <span v-if="device.rssi">{{ device.rssi }} dBm</span>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        
        <!-- OTA固件升级 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span><el-icon><Upload /></el-icon> 固件升级</span>
          </template>
          
          <!-- 设备不在线提示 -->
          <el-alert
            v-if="!device.online"
            title="设备不在线"
            description="设备离线时无法进行固件升级，请确保设备已连接网络"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 16px;"
          />
          
          <!-- 当前版本信息 -->
          <div class="version-compare">
            <div class="version-box current">
              <div class="version-label">当前版本</div>
              <div class="version-value">{{ device.version || '未知' }}</div>
            </div>
            <div class="version-arrow">
              <el-icon><Right /></el-icon>
            </div>
            <div class="version-box target" :class="{ 'has-select': selectedFirmware }">
              <div class="version-label">目标版本</div>
              <div class="version-value">{{ selectedFirmware ? getFirmwareVersion(selectedFirmware) : '-' }}</div>
            </div>
          </div>
          
          <!-- 升级步骤指示器 -->
          <el-steps :active="otaStep" finish-status="success" align-center style="margin: 20px 0;">
            <el-step title="选择固件" />
            <el-step title="下发升级" />
            <el-step title="下载固件" />
            <el-step title="写入Flash" />
            <el-step title="完成重启" />
          </el-steps>
          
          <!-- 固件选择 -->
          <div class="ota-select">
            <el-select 
              v-model="selectedFirmware" 
              placeholder="请选择要升级的固件版本" 
              style="width: 100%;"
              :disabled="otaStatus.inProgress"
              clearable
              @change="onFirmwareChange"
            >
              <template #empty>
                <div style="padding: 20px; text-align: center; color: #909399;">
                  <el-icon><Document /></el-icon>
                  <p>暂无固件，请先 <el-link type="primary" @click="$router.push('/firmware')">上传固件</el-link></p>
                </div>
              </template>
              <el-option
                v-for="fw in firmwares"
                :key="fw.filename"
                :label="`${fw.filename}`"
                :value="fw.filename"
              >
                <div class="firmware-option">
                  <span class="fw-name">{{ fw.filename }}</span>
                  <span class="fw-size">{{ formatSize(fw.size) }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
          
          <!-- 升级按钮 -->
          <div class="ota-action">
            <el-button 
              type="primary" 
              size="large"
              style="width: 100%;"
              :disabled="!canStartOTA"
              @click="confirmOTA"
            >
              <el-icon v-if="!otaStatus.inProgress"><Upload /></el-icon>
              <span v-if="otaStatus.inProgress">
                <el-icon class="is-loading"><Loading /></el-icon>
                {{ getStepDescription() }}
              </span>
              <span v-else>开始升级</span>
            </el-button>
          </div>
          
          <!-- 升级进度 -->
          <div v-if="otaStatus.inProgress" class="ota-progress">
            <div class="progress-header">
              <span>正在升级到 v{{ otaStatus.targetVersion }}</span>
              <span class="progress-percent">{{ otaStatus.progress }}%</span>
            </div>
            <el-progress 
              :percentage="otaStatus.progress" 
              :stroke-width="12"
              :status="otaStatus.progress === 100 ? 'success' : ''"
            >
              <template #default="{ percentage }">
                <span v-if="percentage < 100">下载中...</span>
                <span v-else>写入完成，准备重启...</span>
              </template>
            </el-progress>
            <div class="progress-tip">
              <el-icon><InfoFilled /></el-icon>
              请勿断开设备电源，等待自动重启
            </div>
          </div>
          
          <!-- 升级结果 -->
          <div v-if="otaStatus.result" class="ota-result">
            <el-result
              :icon="otaStatus.result === 'success' ? 'success' : 'error'"
              :title="otaStatus.result === 'success' ? '升级成功' : '升级失败'"
            >
              <template #sub-title>
                <p v-if="otaStatus.result === 'success'">
                  设备正在重启，新版本：v{{ otaStatus.targetVersion }}
                </p>
                <p v-else class="error-msg">
                  {{ otaStatus.error || '升级过程中出现错误' }}
                </p>
              </template>
              <template #extra>
                <el-button v-if="otaStatus.result === 'failed'" type="primary" @click="retryOTA">
                  重试升级
                </el-button>
                <el-button @click="resetOTA">确定</el-button>
              </template>
            </el-result>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>实时数据</span>
            <el-tag v-if="realtimeData || systemInfo" type="success" size="small" style="margin-left: 10px;" :class="{ 'blink': dataBlink }">实时</el-tag>
          </template>
          <div v-if="realtimeData || systemInfo" class="realtime-data">
            <!-- 传感器数据 -->
            <div v-if="realtimeData">
              <el-row :gutter="12">
                <el-col
                  v-for="(value, key) in realtimeData"
                  :key="key"
                  :xs="12" :sm="8" :md="6"
                  style="margin-bottom: 12px;"
                >
                  <div class="data-item">
                    <div class="data-value">{{ formatValue(value) }}</div>
                    <div class="data-label">{{ getLabel(key) }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <!-- 系统信息 -->
            <div v-if="systemInfo" class="system-info-section">
              <el-divider content-position="left">系统信息</el-divider>
              <el-row :gutter="12">
                <el-col v-if="systemInfo.uptime" :xs="12" :sm="6" style="margin-bottom: 8px;">
                  <div class="data-item small">
                    <div class="data-value">{{ formatUptime(systemInfo.uptime) }}</div>
                    <div class="data-label">运行时间</div>
                  </div>
                </el-col>
                <el-col v-if="systemInfo.version" :xs="12" :sm="6" style="margin-bottom: 8px;">
                  <div class="data-item small">
                    <div class="data-value">v{{ systemInfo.version }}</div>
                    <div class="data-label">固件版本</div>
                  </div>
                </el-col>
                <el-col v-if="systemInfo.ip" :xs="12" :sm="6" style="margin-bottom: 8px;">
                  <div class="data-item small">
                    <div class="data-value">{{ systemInfo.ip }}</div>
                    <div class="data-label">IP地址</div>
                  </div>
                </el-col>
                <el-col v-if="systemInfo.free_heap" :xs="12" :sm="6" style="margin-bottom: 8px;">
                  <div class="data-item small">
                    <div class="data-value">{{ formatMemory(systemInfo.free_heap) }}</div>
                    <div class="data-label">空闲内存</div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <div class="data-raw">
              <span class="data-time">更新时间: {{ lastUpdateTime }}</span>
              <el-link type="primary" size="small" @click="showRawData = !showRawData">
                {{ showRawData ? '收起' : '查看原始数据' }}
              </el-link>
              <div v-if="showRawData" class="raw-table">
                <table>
                  <thead>
                    <tr>
                      <th>字段</th>
                      <th>值</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(value, key) in { ...realtimeData, ...systemInfo }" :key="key">
                      <td>{{ getLabel(key) }}</td>
                      <td>{{ formatRawValue(value, key) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无实时数据，请等待设备上报数据..." />
        </el-card>

        <!-- 历史数据图表 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>历史数据</span>
            <el-radio-group v-model="chartPeriod" size="small" style="margin-left: 16px;" @change="fetchChartData">
              <el-radio-button value="1h">1小时</el-radio-button>
              <el-radio-button value="6h">6小时</el-radio-button>
              <el-radio-button value="24h">24小时</el-radio-button>
              <el-radio-button value="7d">7天</el-radio-button>
              <el-radio-button value="30d">30天</el-radio-button>
            </el-radio-group>
            <el-button type="primary" size="small" style="margin-left: 12px;" @click="fetchChartData" :loading="chartLoading">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </template>
          
          <!-- 字段选择 -->
          <div v-if="chartFields.length > 0" class="field-selector">
            <el-checkbox-group v-model="selectedFields" size="small">
              <el-checkbox v-for="field in chartFields" :key="field" :value="field" :label="field">
                {{ getLabel(field) }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
          
          <!-- 图表 -->
          <div v-loading="chartLoading" class="chart-container">
            <div v-if="chartData.length === 0 && !chartLoading" class="chart-empty">
              <el-empty description="暂无历史数据" />
            </div>
            <div v-else ref="chartRef" class="echarts-container"></div>
          </div>
          
          <!-- 数据概览 -->
          <div v-if="chartStats.length > 0" class="chart-stats">
            <el-row :gutter="12">
              <el-col v-for="stat in chartStats" :key="stat.field" :span="6">
                <div class="stat-card">
                  <div class="stat-label">{{ getLabel(stat.field) }}</div>
                  <div class="stat-row">
                    <span class="stat-item"><span class="stat-name">最新</span>{{ stat.latest?.toFixed(1) || '-' }}</span>
                    <span class="stat-item"><span class="stat-name">平均</span>{{ stat.avg?.toFixed(1) || '-' }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-item"><span class="stat-name">最高</span>{{ stat.max?.toFixed(1) || '-' }}</span>
                    <span class="stat-item"><span class="stat-name">最低</span>{{ stat.min?.toFixed(1) || '-' }}</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>快捷控制</template>
          <el-button-group>
            <el-button type="primary" @click="sendCmd('get_status')">获取状态</el-button>
            <el-button type="primary" @click="sendCmd('get_info')">设备信息</el-button>
            <el-button type="success" @click="sendCmd('relay_on')">继电器开</el-button>
            <el-button type="warning" @click="sendCmd('relay_off')">继电器关</el-button>
            <el-button type="danger" @click="sendCmd('reboot')">重启设备</el-button>
          </el-button-group>
        </el-card>
        
        <!-- OTA历史 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span><el-icon><Clock /></el-icon> 升级历史</span>
            <el-button size="small" type="primary" link @click="fetchOTAHistory">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </template>
          <el-table :data="otaHistory" style="width: 100%" size="small">
            <el-table-column prop="version" label="版本" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="started_at" label="开始时间" min-width="160">
              <template #default="{ row }">
                {{ new Date(row.started_at).toLocaleString('zh-CN') }}
              </template>
            </el-table-column>
            <el-table-column prop="error_message" label="备注" min-width="120">
              <template #default="{ row }">
                {{ row.error_message || '-' }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="otaHistory.length === 0" description="暂无升级记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Clock, Refresh, Right, Document, InfoFilled, Loading, Edit } from '@element-plus/icons-vue'
import { useWebSocketStore } from '../stores/websocket'
import axios from 'axios'
import * as echarts from 'echarts'

const route = useRoute()
const wsStore = useWebSocketStore()
const deviceId = route.params.id

const device = ref({})
const firmwares = ref([])
const selectedFirmware = ref('')
const otaHistory = ref([])

// 设备名称编辑
const editingName = ref(false)
const newName = ref('')
const showRawData = ref(false)
const lastUpdateTime = ref('')
const dataBlink = ref(false)

// 本地缓存的实时数据（页面加载时获取）
const cachedData = ref(null)
// 本地缓存的系统信息
const cachedSystemInfo = ref({})
// 实时的系统信息（直接用 ref 存储，确保响应式）
const realtimeSystemInfo = ref(null)

// 上一次的数据快照（用于比较是否变化）
let lastDataSnapshot = null

// 显示的字段（传感器数据：温度、湿度、电池电压、信号强度）
const DISPLAY_FIELDS = ['temperature', 'humidity', 'battery', 'rssi']
// 系统信息字段（显示在实时数据下方）
const SYSTEM_FIELDS = ['uptime', 'version', 'ip', 'free_heap']

// 实时数据：只显示传感器数据（温度、湿度、电池电压、信号强度）
const realtimeData = computed(() => {
  const wsData = wsStore.deviceData.get(deviceId)
  let sourceData = null
  
  // 优先使用 WebSocket 遥测数据
  if (wsData && wsData.temperature !== undefined) {
    sourceData = wsData
  } else if (cachedData.value && cachedData.value.temperature !== undefined) {
    // 否则使用缓存的遥测数据
    sourceData = cachedData.value
  }
  
  // 过滤只显示指定字段
  if (sourceData) {
    const filtered = {}
    DISPLAY_FIELDS.forEach(field => {
      if (sourceData[field] !== undefined) {
        filtered[field] = sourceData[field]
      }
    })
    
    // 检查数据是否真的变化了
    const currentStr = JSON.stringify(filtered)
    if (lastDataSnapshot !== currentStr && Object.keys(filtered).length > 0) {
      lastDataSnapshot = currentStr
      lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN')
      dataBlink.value = true
      setTimeout(() => { dataBlink.value = false }, 500)
    }
    
    return Object.keys(filtered).length > 0 ? filtered : null
  }
  
  return null
})

// 系统信息：运行时间、版本号、IP地址、内存（合并实时数据和缓存）
const systemInfo = computed(() => {
  const result = { ...cachedSystemInfo.value }
  // 从 WebSocket store 缓存获取
  const wsCache = wsStore.systemCache.get(deviceId)
  if (wsCache) {
    Object.assign(result, wsCache)
  }
  // 用实时数据覆盖
  if (realtimeSystemInfo.value) {
    Object.assign(result, realtimeSystemInfo.value)
  }
  return Object.keys(result).length > 0 ? result : null
})

// ============ 图表相关 ============
const chartRef = ref(null)
const chartInstance = ref(null)
const chartPeriod = ref('1h')
const chartLoading = ref(false)
const chartData = ref([])
const chartFields = ref([])
const selectedFields = ref([])
const chartStats = ref([])

const fetchChartData = async () => {
  chartLoading.value = true
  try {
    const res = await axios.get(`/api/devices/${deviceId}/chart`, {
      params: { period: chartPeriod.value }
    })
    
    if (res.data.success) {
      chartData.value = res.data.data
      chartFields.value = res.data.fields || []
      
      // 默认选中前两个字段
      if (selectedFields.value.length === 0 && chartFields.value.length > 0) {
        selectedFields.value = chartFields.value.slice(0, Math.min(2, chartFields.value.length))
      }
      
      // 计算统计数据
      updateChartStats()
      updateChart()
    }
  } catch (err) {
    console.error('获取图表数据失败:', err)
    ElMessage.error('获取历史数据失败')
  } finally {
    chartLoading.value = false
  }
}

const updateChartStats = () => {
  if (!chartData.value.length) {
    chartStats.value = []
    return
  }
  
  const stats = []
  selectedFields.value.forEach(field => {
    const values = chartData.value
      .map(d => d[field])
      .filter(v => typeof v === 'number' && !isNaN(v))
    
    if (values.length > 0) {
      stats.push({
        field,
        latest: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      })
    }
  })
  chartStats.value = stats
}

const updateChart = () => {
  nextTick(() => {
    if (!chartRef.value) return
    
    if (!chartInstance.value) {
      chartInstance.value = echarts.init(chartRef.value)
    }
    
    if (!selectedFields.value.length || !chartData.value.length) {
      chartInstance.value.clear()
      return
    }
    
    // 准备图表数据
    const series = selectedFields.value.map((field, index) => {
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
      return {
        name: getLabel(field),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        itemStyle: { color: colors[index % colors.length] },
        data: chartData.value.map(d => [d.time, d[field] ?? null]).filter(d => d[1] !== null)
      }
    })
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!params.length) return ''
          const time = new Date(params[0].value[0]).toLocaleString('zh-CN')
          let html = `<strong>${time}</strong><br/>`
          params.forEach(p => {
            if (p.value[1] !== null) {
              html += `${p.marker} ${p.seriesName}: <strong>${p.value[1].toFixed(2)}</strong><br/>`
            }
          })
          return html
        }
      },
      legend: {
        data: selectedFields.value.map(f => getLabel(f)),
        top: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 50,
        containLabel: true
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value) => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
      },
      yAxis: {
        type: 'value',
        scale: true
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100 }
      ],
      series
    }
    
    chartInstance.value.setOption(option, true)
  })
}

// 监听选中字段变化
watch(selectedFields, () => {
  updateChartStats()
  updateChart()
}, { deep: true })

// 窗口大小变化时重绘图表
const handleResize = () => {
  chartInstance.value?.resize()
}

// 协议名称映射
const protocolNames = {
  esp32: 'ESP32 WiFi设备',
  stm32: 'STM32微控制器',
  bluetooth: '蓝牙设备',
  lora: 'LoRa无线设备',
  generic: '通用MQTT设备',
  custom: '自定义设备'
}

const getProtocolName = (type) => {
  return protocolNames[type] || protocolNames.generic || type
}

const getProtocolTagType = (type) => {
  const types = {
    esp32: 'success',
    stm32: 'warning',
    bluetooth: 'primary',
    lora: 'info',
    generic: '',
    custom: ''
  }
  return types[type] || ''
}

// 格式化显示值
const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return value
}

// 获取字段中文标签（带单位）
const getLabel = (key) => {
  const labels = {
    battery: '电池电压 (V)',
    voltage: '电压 (V)',
    temperature: '温度 (°C)',
    temp: '温度 (°C)',
    humidity: '湿度 (%)',
    humidity2: '湿度2 (%)',
    rssi: '信号强度 (dBm)',
    adc: 'ADC值',
    gpio: 'GPIO状态',
    relay: '继电器',
    state: '状态',
    uptime: '运行时间',
    version: '固件版本',
    ip: 'IP地址',
    free_heap: '空闲内存 (KB)',
    reset_reason: '重启原因'
  }
  return labels[key] || key
}

// 格式化原始数据的值
const formatRawValue = (value, key) => {
  if (value === null || value === undefined) return '-'
  if (key === 'uptime') return formatUptime(value)
  if (key === 'free_heap') return formatMemory(value)
  if (typeof value === 'number') return value.toFixed(2)
  return value
}

// 格式化运行时间（秒转为天:时:分:秒）
const formatUptime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (days > 0) {
    return `${days}天 ${hours}小时 ${mins}分`
  } else if (hours > 0) {
    return `${hours}小时 ${mins}分 ${secs}秒`
  } else if (mins > 0) {
    return `${mins}分 ${secs}秒`
  }
  return `${secs}秒`
}

// 格式化内存（字节转为KB）
const formatMemory = (bytes) => {
  if (!bytes || isNaN(bytes)) return '-'
  const kb = bytes / 1024
  return `${kb.toFixed(1)} KB`
}

// OTA状态
const otaStatus = ref({
  inProgress: false,
  progress: 0,
  result: null,
  error: null,
  targetVersion: '',
  step: 1  // 1: 选择固件, 2: 下发升级, 3: 下载固件, 4: 写入Flash, 5: 完成重启
})

// OTA步骤（用于步骤指示器）
const otaStep = computed(() => {
  if (otaStatus.value.result === 'success') return 4
  if (otaStatus.value.result === 'failed') return otaStatus.value.step - 1
  if (!otaStatus.value.inProgress) return 0
  return otaStatus.value.step - 1
})

// 是否可以开始升级
const canStartOTA = computed(() => {
  return device.value.online && selectedFirmware.value && !otaStatus.value.inProgress
})

onMounted(() => {
  fetchDevice()
  fetchFirmwares()
  fetchChartData()  // 获取图表数据
  fetchLatestData()  // 获取最新实时数据
  wsStore.subscribeDevice(deviceId)
  window.addEventListener('resize', handleResize)

  // 监听 deviceData 变化，更新系统信息
  watch(() => wsStore.deviceData, (newData) => {
    const wsData = newData.get(deviceId)
    if (wsData) {
      const info = {}
      SYSTEM_FIELDS.forEach(field => {
        if (wsData[field] !== undefined) {
          info[field] = wsData[field]
        }
      })
      if (Object.keys(info).length > 0) {
        realtimeSystemInfo.value = info
      }
    }
  }, { deep: true })

  // 监听 lastMessage 变化（OTA状态）
  watch(() => wsStore.lastMessage, (msg) => {
    if (!msg || msg.deviceId !== deviceId) return

    switch (msg.type) {
      case 'ota_progress':
        animateProgress(msg.progress)
        if (msg.progress < 30) {
          otaStatus.value.step = 3
        } else if (msg.progress < 100) {
          otaStatus.value.step = 4
        }
        break
      case 'ota_complete':
        otaStatus.value.step = 5
        otaStatus.value.progress = 100
        otaStatus.value.result = 'success'
        ElMessage.success(`固件升级完成! 新版本: ${msg.version}`)
        setTimeout(() => {
          fetchDevice()
          fetchOTAHistory()
        }, 5000)
        break
      case 'ota_error':
        otaStatus.value.result = 'failed'
        otaStatus.value.error = msg.error
        ElMessage.error(`固件升级失败: ${msg.error}`)
        break
    }
  })
})

onUnmounted(() => {
  wsStore.unsubscribeDevice(deviceId)
  chartInstance.value?.dispose()
  chartInstance.value = null
  window.removeEventListener('resize', handleResize)
})

const fetchDevice = async () => {
  try {
    const res = await axios.get(`/api/devices/${deviceId}`)
    device.value = res.data

    // 保存设备详情中的系统信息到缓存（IP、版本等）
    const info = {}
    if (res.data.ip) info.ip = res.data.ip
    if (res.data.version) info.version = res.data.version
    if (res.data.rssi) info.rssi = res.data.rssi
    if (Object.keys(info).length > 0) {
      cachedSystemInfo.value = { ...cachedSystemInfo.value, ...info }
    }
  } catch (err) {
    ElMessage.error('获取设备信息失败')
  }
}

// 获取最新实时数据（页面加载时立即显示）
const fetchLatestData = async () => {
  try {
    const res = await axios.get(`/api/devices/${deviceId}/data`, {
      params: { limit: 5 }
    })

    if (res.data && res.data.length > 0) {
      const latest = res.data[0]
      try {
        const parsed = typeof latest.data_value === 'string'
          ? JSON.parse(latest.data_value)
          : latest.data_value

        // 添加缓存时间标记
        parsed._cachedAt = new Date(latest.created_at).toLocaleString('zh-CN')

        // 保存传感器数据到缓存
        cachedData.value = parsed
        lastUpdateTime.value = parsed._cachedAt

        // 保存系统信息到缓存（如果有）
        const sysInfo = {}
        SYSTEM_FIELDS.forEach(field => {
          if (parsed[field] !== undefined) {
            sysInfo[field] = parsed[field]
          }
        })
        if (Object.keys(sysInfo).length > 0) {
          cachedSystemInfo.value = { ...cachedSystemInfo.value, ...sysInfo }
        }
      } catch (e) {
        console.error('解析数据失败:', e)
      }
    }
  } catch (err) {
    console.error('获取最新数据失败:', err)
  }
}

const fetchFirmwares = async () => {
  try {
    const res = await axios.get('/api/firmware')
    firmwares.value = res.data
  } catch (err) {
    console.error('获取固件列表失败:', err)
  }
}

const fetchOTAHistory = async () => {
  try {
    const res = await axios.get(`/api/devices/${deviceId}/ota/history`)
    otaHistory.value = res.data
  } catch (err) {
    console.error('获取升级历史失败:', err)
  }
}

const getFirmwareVersion = (filename) => {
  const match = filename.match(/_v(.+)\.bin$/)
  return match ? match[1] : filename
}

// 平滑进度动画
let progressAnimationId = null
const animateProgress = (target) => {
  if (progressAnimationId) return
  const start = otaStatus.value.progress
  const diff = target - start
  if (diff <= 0) {
    otaStatus.value.progress = target
    return
  }
  const duration = 300 // 动画时长ms
  const startTime = performance.now()
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    // 缓动函数：ease-out
    const easeOut = 1 - Math.pow(1 - progress, 3)
    otaStatus.value.progress = Math.round(start + diff * easeOut)
    if (progress < 1) {
      progressAnimationId = requestAnimationFrame(animate)
    } else {
      progressAnimationId = null
    }
  }
  progressAnimationId = requestAnimationFrame(animate)
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const getStatusType = (status) => {
  const types = { pending: 'warning', success: 'success', failed: 'danger' }
  return types[status] || 'info'
}

// 固件选择变化
const onFirmwareChange = (val) => {
  if (val) {
    // 检查是否选择了比当前版本更低的版本
    const targetVersion = getFirmwareVersion(val)
    if (device.value.version && compareVersions(targetVersion, device.value.version) < 0) {
      ElMessage.warning(`目标版本 v${targetVersion} 低于当前版本 v${device.value.version}，是否继续？`)
    }
  }
}

// 版本比较
const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  return 0
}

// 获取步骤描述
const getStepDescription = () => {
  const stepTexts = {
    1: '准备升级...',
    2: '下发升级命令...',
    3: '下载固件中...',
    4: '写入Flash...',
    5: '升级完成，重启中...'
  }
  return stepTexts[otaStatus.value.step] || `升级中 ${otaStatus.value.progress}%`
}

// 确认升级
const confirmOTA = () => {
  console.log('confirmOTA called', {
    selectedFirmware: selectedFirmware.value,
    deviceOnline: device.value.online,
    canStartOTA: canStartOTA.value
  })
  
  if (!selectedFirmware.value) {
    ElMessage.warning('请选择固件版本')
    return
  }
  
  const targetVersion = getFirmwareVersion(selectedFirmware.value)
  
  ElMessageBox.confirm(
    `<div style="text-align: left;">
      <p><b>当前版本：</b>v${device.value.version || '未知'}</p>
      <p><b>目标版本：</b>v${targetVersion}</p>
      <p style="color: #E6A23C; margin-top: 10px;">⚠️ 升级过程中请勿断开设备电源</p>
    </div>`,
    '确认固件升级',
    {
      confirmButtonText: '确认升级',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true
    }
  ).then(() => {
    startOTA()
  }).catch(() => {})
}

// 开始升级
const startOTA = async () => {
  try {
    // 查找选中固件的完整URL（后端返回的）
    const selected = firmwares.value.find(fw => fw.filename === selectedFirmware.value)
    const firmwareUrl = selected?.url || `${window.location.origin}/firmware/${selectedFirmware.value}`
    const version = getFirmwareVersion(selectedFirmware.value)
    
    otaStatus.value = {
      inProgress: true,
      progress: 0,
      result: null,
      error: null,
      targetVersion: version,
      step: 2
    }
    
    await axios.post(`/api/devices/${deviceId}/ota`, {
      firmware_url: firmwareUrl,
      version: version
    })
    
    ElMessage.success('升级命令已下发，设备开始下载固件...')
  } catch (err) {
    otaStatus.value.result = 'failed'
    otaStatus.value.error = err.response?.data?.error || '下发升级命令失败'
    ElMessage.error(otaStatus.value.error)
  }
}

// 重试升级
const retryOTA = () => {
  resetOTA()
  // 重置后自动触发 startOTA
  startOTA()
}

// 重置OTA状态
const resetOTA = () => {
  otaStatus.value = {
    inProgress: false,
    progress: 0,
    result: null,
    error: null,
    targetVersion: '',
    step: 1
  }
}

// 编辑设备名称
const startEditName = () => {
  newName.value = device.value.name
  editingName.value = true
}

const saveName = async () => {
  if (!newName.value.trim()) {
    ElMessage.warning('设备名称不能为空')
    return
  }
  try {
    await axios.put(`/api/devices/${deviceId}`, { name: newName.value })
    device.value.name = newName.value.trim()
    editingName.value = false
    ElMessage.success('设备名称已更新')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '更新失败')
  }
}

const cancelEditName = () => {
  editingName.value = false
  newName.value = device.value.name
}

const sendCmd = async (cmd) => {
  try {
    await axios.post(`/api/devices/${deviceId}/command`, {
      command: cmd,
      params: {}
    })
    ElMessage.success('命令已发送')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '发送失败')
  }
}
</script>

<style scoped>
/* 数据闪烁动画 */
.blink {
  animation: blink 0.5s ease-in-out;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; background-color: #67c23a; }
}

.realtime-data {
  padding: 20px;
}

.data-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.data-item.small {
  padding: 12px;
}

.data-item.small .data-value {
  font-size: 16px;
}

.data-item.small .data-label {
  font-size: 12px;
}

.system-info-section {
  margin-top: 10px;
}

.data-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.data-label {
  margin-top: 8px;
  color: #909399;
}

.data-raw {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}

.data-time {
  color: #909399;
  font-size: 12px;
}

.raw-table {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  overflow-x: auto;
}

.raw-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.raw-table th,
.raw-table td {
  padding: 6px 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.raw-table th {
  color: #909399;
  font-weight: normal;
  width: 40%;
}

.raw-table td:last-child {
  color: #303133;
  font-family: monospace;
}

/* OTA 升级卡片样式 */
.version-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
  border-radius: 12px;
  margin-bottom: 8px;
}

.version-box {
  text-align: center;
  padding: 12px 20px;
  border-radius: 8px;
  min-width: 100px;
}

.version-box.current {
  background: #fff;
  border: 2px solid #dcdfe6;
}

.version-box.target {
  background: #fff;
  border: 2px dashed #dcdfe6;
  transition: all 0.3s;
}

.version-box.target.has-select {
  border-color: #409EFF;
  background: #ecf5ff;
}

.version-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.version-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.version-box.current .version-value {
  color: #909399;
}

.version-box.target.has-select .version-value {
  color: #409EFF;
}

.version-arrow {
  color: #909399;
  font-size: 20px;
}

.ota-select {
  margin: 16px 0;
}

.firmware-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fw-name {
  font-size: 13px;
}

.fw-size {
  font-size: 12px;
  color: #909399;
}

.ota-action {
  margin-top: 8px;
}

.ota-progress {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #303133;
}

.progress-percent {
  font-weight: bold;
  color: #409EFF;
  font-size: 16px;
}

.progress-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

.ota-result {
  margin-top: 16px;
}

.error-msg {
  color: #F56C6C;
}

/* 图表样式 */
.field-selector {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.chart-container {
  min-height: 350px;
  margin-top: 16px;
}

.echarts-container {
  width: 100%;
  height: 350px;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.chart-stats {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 4px;
}

.stat-item {
  font-size: 14px;
  color: #303133;
}

.stat-item .stat-name {
  font-size: 12px;
  color: #909399;
  margin-right: 4px;
}
</style>
