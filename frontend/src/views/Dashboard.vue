<template>
  <div class="dashboard">
    <!-- 欢迎信息 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>欢迎回来，{{ userStore.username }}</h2>
        <p>这是您的IoT设备管理控制台</p>
      </div>
      <div class="quick-time">
        <el-icon size="20"><Clock /></el-icon>
        <span>{{ currentTime }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-blue" @click="router.push('/devices')">
          <div class="stat-bg-icon"><el-icon size="48"><Cpu /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalDevices }}</div>
            <div class="stat-label">设备总数</div>
          </div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-green">
          <div class="stat-bg-icon"><el-icon size="48"><CircleCheck /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.onlineDevices }}</div>
            <div class="stat-label">在线设备</div>
          </div>
          <div class="online-rate">
            {{ stats.totalDevices > 0 ? ((stats.onlineDevices / stats.totalDevices) * 100).toFixed(0) : 0 }}%
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-orange">
          <div class="stat-bg-icon"><el-icon size="48"><Warning /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.offlineDevices }}</div>
            <div class="stat-label">离线设备</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6">
        <div class="stat-card stat-gray">
          <div class="stat-bg-icon"><el-icon size="48"><DataLine /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.todayMessages }}</div>
            <div class="stat-label">今日消息</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 第二行：快捷操作 + 系统状态 -->
    <el-row :gutter="20" class="action-row">
      <el-col :xs="24" :sm="8">
        <el-card class="quick-actions">
          <template #header>
            <div class="card-header">
              <span><el-icon><Lightning /></el-icon> 快捷操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary" plain @click="router.push('/devices')">
              <el-icon><Grid /></el-icon>
              设备列表
            </el-button>
            <el-button type="success" plain @click="router.push('/bluetooth')">
              <el-icon><Monitor /></el-icon>
              蓝牙配网
            </el-button>
            <el-button type="warning" plain @click="router.push('/settings')">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="16">
        <el-card class="system-status">
          <template #header>
            <div class="card-header">
              <span><el-icon><Monitor /></el-icon> 系统状态</span>
              <el-tag :type="wsStore.isConnected ? 'success' : 'danger'" size="small">
                {{ wsStore.isConnected ? '已连接' : '未连接' }}
              </el-tag>
            </div>
          </template>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">运行时间</span>
              <span class="status-value">{{ systemStatus.uptime }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">内存占用</span>
              <span class="status-value">{{ systemStatus.memory }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">在线设备</span>
              <span class="status-value success">{{ wsStore.deviceList.length }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">消息数</span>
              <span class="status-value">{{ stats.todayMessages }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 在线设备列表 -->
    <el-card class="device-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><Connection /></el-icon> 在线设备</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
            <el-button type="primary" size="small" plain @click="router.push('/devices')">
              查看全部
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-if="wsStore.deviceList.length > 0" class="device-grid">
        <div 
          v-for="device in wsStore.deviceList.slice(0, 8)" 
          :key="device.deviceId"
          class="device-item"
          @click="viewDevice(device.deviceId)"
        >
          <div class="device-header">
            <el-icon size="20" color="#409EFF"><Cpu /></el-icon>
            <span class="device-status" :class="device.rssi > -70 ? 'online' : 'weak'"></span>
          </div>
          <div class="device-id">{{ device.deviceId.substring(0, 12) }}...</div>
          <div class="device-info">
            <span><el-icon><Location /></el-icon> {{ device.ip || '-' }}</span>
            <span><el-icon><Aim /></el-icon> {{ device.rssi }} dBm</span>
          </div>
          <div class="device-time">{{ formatTime(device.lastSeen) }}</div>
        </div>
      </div>
      
      <el-empty v-else description="暂无在线设备">
        <el-button type="primary" @click="router.push('/bluetooth')">去配网</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Cpu,
  CircleCheck,
  Warning,
  DataLine,
  Refresh,
  Clock,
  Top,
  Lightning,
  Grid,
  Monitor,
  Setting,
  Connection,
  Location,
  Aim
} from '@element-plus/icons-vue'
import { useWebSocketStore } from '../stores/websocket'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const router = useRouter()
const wsStore = useWebSocketStore()
const userStore = useUserStore()

const stats = ref({
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0,
  todayMessages: 0
})

const systemStatus = ref({
  uptime: '-',
  memory: '-'
})

const currentTime = ref('')
let timeInterval

onMounted(() => {
  fetchStats()
  fetchSystemStatus()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timeInterval)
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/devices')
    const devices = res.data
    stats.value.totalDevices = devices.length
    stats.value.onlineDevices = devices.filter(d => d.online).length
    stats.value.offlineDevices = devices.filter(d => !d.online).length
  } catch (err) {
    console.error('获取统计失败:', err)
  }
}

const fetchSystemStatus = async () => {
  try {
    const res = await axios.get('/api/system/status')
    const data = res.data
    systemStatus.value.uptime = formatUptime(data.uptime)
    systemStatus.value.memory = `${(data.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`
  } catch (err) {
    console.error('获取系统状态失败:', err)
  }
}

const refreshData = () => {
  fetchStats()
  fetchSystemStatus()
}

const viewDevice = (deviceId) => {
  router.push(`/devices/${deviceId}`)
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatUptime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}小时${minutes}分钟`
}
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* 欢迎区域 */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
}

.welcome-text h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
}

.welcome-text p {
  margin: 0;
  opacity: 0.8;
  font-size: 14px;
}

.quick-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

/* 统计卡片 */
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 120px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-bg-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  opacity: 0.1;
  color: #fff;
}

.stat-blue .stat-bg-icon { background: #409EFF; }
.stat-green .stat-bg-icon { background: #67C23A; }
.stat-orange .stat-bg-icon { background: #E6A23C; }
.stat-gray .stat-bg-icon { background: #909399; }

.stat-content {
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-trend {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.stat-trend.up {
  background: #f0f9eb;
  color: #67C23A;
}

.online-rate {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #67C23A;
}

/* 操作区域 */
.action-row {
  margin-bottom: 20px;
}

.quick-actions .action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions .el-button {
  justify-content: flex-start;
  padding-left: 16px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.status-label {
  color: #909399;
  font-size: 14px;
}

.status-value {
  font-weight: 600;
  color: #303133;
}

.status-value.success {
  color: #67C23A;
}

/* 设备卡片 */
.device-card {
  margin-top: 20px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.device-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.device-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.device-status.online {
  background: #67C23A;
  box-shadow: 0 0 8px #67C23A;
}

.device-status.weak {
  background: #E6A23C;
}

.device-id {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  font-family: monospace;
}

.device-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.device-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.device-time {
  font-size: 11px;
  color: #c0c4cc;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}
</style>
