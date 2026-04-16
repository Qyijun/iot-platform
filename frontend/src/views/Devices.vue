<template>
  <div class="devices-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <div class="header-buttons">
            <el-select v-model="filterGroupId" placeholder="全部分组" clearable style="width: 180px; margin-right: 10px;">
              <el-option label="全部设备" :value="null" />
              <el-option v-for="g in groups" :key="g.id" :label="`${getIcon(g.icon)} ${g.name}`" :value="g.id" />
            </el-select>
            <el-button v-if="btnPerms.add" type="info" @click="showDiscoverDialog = true">
              <el-icon><Search /></el-icon>发现设备
            </el-button>
            <el-button v-if="btnPerms.add" type="primary" @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>手动添加
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="filteredDevices" v-loading="loading" style="width: 100%">
        <el-table-column prop="device_id" label="设备ID" min-width="150" />
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="type" label="设备类型" min-width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" min-width="130">
          <template #default="{ row }">
            {{ row.ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="last_seen" label="最后在线" min-width="150">
          <template #default="{ row }">
            {{ row.last_seen ? new Date(row.last_seen).toLocaleString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">
              详情
            </el-button>
            <el-button 
              v-if="btnPerms.control"
              type="success" 
              size="small" 
              :disabled="!row.online"
              @click="sendCommand(row)"
            >
              控制
            </el-button>
            <el-button 
              v-if="btnPerms.delete"
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加设备对话框 -->
    <el-dialog v-model="showAddDialog" title="添加设备" width="500px">
      <el-form :model="newDevice" :rules="deviceRules" ref="deviceFormRef">
        <el-form-item label="设备ID" prop="deviceId">
          <el-input v-model="newDevice.deviceId" placeholder="请输入设备唯一ID" />
        </el-form-item>
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="newDevice.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="newDevice.type" placeholder="选择设备协议" style="width: 100%">
            <el-option-group label="WiFi设备">
              <el-option label="ESP32 (WiFi)" value="esp32" />
              <el-option label="通用MQTT设备" value="generic" />
            </el-option-group>
            <el-option-group label="嵌入式设备">
              <el-option label="STM32" value="stm32" />
            </el-option-group>
            <el-option-group label="无线设备">
              <el-option label="蓝牙设备" value="bluetooth" />
              <el-option label="LoRa设备" value="lora" />
            </el-option-group>
            <el-option-group label="其他">
              <el-option label="自定义设备" value="custom" />
            </el-option-group>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addDevice" :loading="adding">确定</el-button>
      </template>
    </el-dialog>

    <!-- 发现设备对话框 -->
    <el-dialog v-model="showDiscoverDialog" title="发现设备" width="700px">
      <div class="discover-tip">
        <el-alert type="info" :closable="false">
          <template #title>
            <span>提示：以下设备正在 MQTT 服务中运行但尚未添加到系统</span>
          </template>
        </el-alert>
      </div>
      
      <div class="online-stats">
        <el-statistic title="在线设备总数" :value="onlineStats.total" />
        <el-statistic title="已入库" :value="onlineStats.registered" />
        <el-statistic title="待入库" :value="onlineStats.unregistered" />
      </div>
      
      <el-table 
        :data="discoveredDevices" 
        v-loading="discovering"
        max-height="300"
        style="margin-top: 15px"
      >
        <el-table-column prop="deviceId" label="设备ID" min-width="150" />
        <el-table-column prop="ip" label="IP地址" min-width="130">
          <template #default="{ row }">
            {{ row.ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="100">
          <template #default="{ row }">
            {{ row.version || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="rssi" label="信号强度" width="100">
          <template #default="{ row }">
            {{ row.rssi ? `${row.rssi} dBm` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="quickAddDevice(row)">
              添加
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="discoveredDevices.length > 0" class="batch-actions">
        <el-button type="success" @click="batchAddDevices" :loading="batchAdding">
          一键添加全部 ({{ discoveredDevices.length }})
        </el-button>
      </div>
      
      <div v-if="discoveredDevices.length === 0 && !discovering" class="no-device">
        <el-empty description="当前没有发现新的在线设备" />
      </div>
      
      <template #footer>
        <el-button @click="refreshDiscover">刷新</el-button>
        <el-button type="primary" @click="showDiscoverDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 发送命令对话框 -->
    <el-dialog v-model="showCommandDialog" title="发送命令" width="500px">
      <el-form :model="commandForm">
        <el-form-item label="目标设备">
          <el-input v-model="selectedDevice.device_id" disabled />
        </el-form-item>
        <el-form-item label="命令类型">
          <el-select v-model="commandForm.command" placeholder="选择命令" style="width: 100%">
            <el-option label="重启设备" value="reboot" />
            <el-option label="更新配置" value="update_config" />
            <el-option label="获取状态" value="get_status" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数 (JSON)">
          <el-input 
            v-model="commandForm.params" 
            type="textarea" 
            :rows="3"
            placeholder='{"key": "value"}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCommandDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSendCommand" :loading="sendingCommand">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useWebSocketStore } from '../stores/websocket'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const router = useRouter()
const wsStore = useWebSocketStore()
const userStore = useUserStore()

// 获取设备相关按钮权限
const btnPerms = computed(() => userStore.getButtonPermissions('device'))

const devices = ref([])
const groups = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const showCommandDialog = ref(false)
const showDiscoverDialog = ref(false)
const adding = ref(false)
const sendingCommand = ref(false)
const selectedDevice = ref({})
const filterGroupId = ref(null)
const devicesInGroups = ref({}) // deviceId -> groupIds

const iconMap = {
  folder: '📁', home: '🏠', factory: '🏭',
  warehouse: '📦', office: '🏢', lab: '🔬',
  outdoor: '🏕️', store: '🏪'
}
const getIcon = (icon) => iconMap[icon] || '📁'

// 按分组筛选设备
const filteredDevices = computed(() => {
  if (!filterGroupId.value) return devices.value
  return devices.value.filter(d => devicesInGroups.value[d.device_id]?.includes(filterGroupId.value))
})

// 发现设备相关
const discoveredDevices = ref([])
const discovering = ref(false)
const batchAdding = ref(false)
const onlineStats = ref({ total: 0, registered: 0, unregistered: 0 })

const newDevice = ref({
  deviceId: '',
  name: '',
  type: 'esp32'
})

const commandForm = ref({
  command: '',
  params: '{}'
})

const deviceFormRef = ref()

const deviceRules = {
  deviceId: [{ required: true, message: '请输入设备ID', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
}

onMounted(() => {
  fetchDevices()
  fetchGroups()
})

const fetchGroups = async () => {
  try {
    const res = await axios.get('/api/groups')
    groups.value = res.data
    // 获取每个设备所在的分组
    for (const g of res.data) {
      const devicesRes = await axios.get(`/api/groups/${g.id}/devices`)
      for (const d of devicesRes.data) {
        if (!devicesInGroups.value[d.device_id]) {
          devicesInGroups.value[d.device_id] = []
        }
        devicesInGroups.value[d.device_id].push(g.id)
      }
    }
  } catch (err) {
    console.error('获取分组失败', err)
  }
}

const fetchDevices = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/devices')
    devices.value = res.data
  } catch (err) {
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

const addDevice = async () => {
  const valid = await deviceFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  adding.value = true
  try {
    await axios.post('/api/devices', newDevice.value)
    ElMessage.success('设备添加成功')
    showAddDialog.value = false
    newDevice.value = { deviceId: '', name: '', type: 'esp32' }
    fetchDevices()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '添加失败')
  } finally {
    adding.value = false
  }
}

const viewDetail = (device) => {
  router.push(`/devices/${device.device_id}`)
}

const sendCommand = (device) => {
  selectedDevice.value = device
  commandForm.value = { command: '', params: '{}' }
  showCommandDialog.value = true
}

const confirmSendCommand = async () => {
  sendingCommand.value = true
  try {
    let params = {}
    try {
      params = JSON.parse(commandForm.value.params)
    } catch {
      // 如果不是JSON，作为字符串传递
      params = { data: commandForm.value.params }
    }
    
    await axios.post(`/api/devices/${selectedDevice.value.device_id}/command`, {
      command: commandForm.value.command,
      params
    })
    
    ElMessage.success('命令已发送')
    showCommandDialog.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '发送失败')
  } finally {
    sendingCommand.value = false
  }
}

const handleDelete = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${device.name}" (${device.device_id}) 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await axios.delete(`/api/devices/${device.device_id}`)
    ElMessage.success('设备已删除')
    fetchDevices()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.error || '删除失败')
    }
  }
}

// 发现设备
const refreshDiscover = async () => {
  discovering.value = true
  try {
    // 获取在线设备信息
    const onlineRes = await axios.get('/api/devices/online')
    onlineStats.value = {
      total: onlineRes.data.total,
      registered: onlineRes.data.online,
      unregistered: onlineRes.data.unregistered
    }
    
    // 获取未入库的设备
    const discoverRes = await axios.get('/api/devices/discover')
    discoveredDevices.value = discoverRes.data.devices
  } catch (err) {
    ElMessage.error('获取在线设备失败')
  } finally {
    discovering.value = false
  }
}

// 快速添加单个设备
const quickAddDevice = async (device) => {
  try {
    await axios.post('/api/devices/batch-add', {
      devices: [{ deviceId: device.deviceId }]
    })
    ElMessage.success('设备添加成功')
    // 从列表移除
    discoveredDevices.value = discoveredDevices.value.filter(d => d.deviceId !== device.deviceId)
    // 更新统计
    onlineStats.value.registered++
    onlineStats.value.unregistered--
    // 刷新设备列表
    fetchDevices()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '添加失败')
  }
}

// 批量添加设备
const batchAddDevices = async () => {
  if (discoveredDevices.value.length === 0) {
    ElMessage.warning('没有设备可添加')
    return
  }
  
  try {
    const devices = discoveredDevices.value.map(d => ({
      deviceId: d.deviceId,
      name: `设备_${d.deviceId.slice(-6)}`,
      type: d.type || '通用设备'  // 优先使用发现的类型
    }))
    
    await axios.post('/api/devices/batch-add', { devices })
    ElMessage.success('批量添加成功')
    discoveredDevices.value = []
    onlineStats.value.registered = onlineStats.value.total
    onlineStats.value.unregistered = 0
    // 刷新设备列表
    fetchDevices()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '批量添加失败')
  }
}

// 监听发现设备对话框打开
watch(showDiscoverDialog, (val) => {
  if (val) {
    refreshDiscover()
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.discover-tip {
  margin-bottom: 15px;
}

.online-stats {
  display: flex;
  gap: 30px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.online-stats :deep(.el-statistic__head) {
  font-size: 12px;
  color: #909399;
}

.batch-actions {
  margin-top: 15px;
  text-align: center;
}

.no-device {
  padding: 30px 0;
}
</style>
