<template>
  <div class="firmware-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Files /></el-icon> 固件管理</span>
          <el-button v-if="btnPerms.upload" type="primary" @click="showUploadDialog = true">
            <el-icon><Upload /></el-icon> 上传固件
          </el-button>
        </div>
      </template>
      
      <el-table :data="firmwares" v-loading="loading" style="width: 100%">
        <el-table-column prop="filename" label="文件名" min-width="200" />
        <el-table-column prop="version" label="版本" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ getVersion(row.filename) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="created" label="上传时间" min-width="160">
          <template #default="{ row }">
            {{ new Date(row.created).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="btnPerms.download" type="primary" size="small" @click="downloadFirmware(row)">
              <el-icon><Download /></el-icon> 下载
            </el-button>
            <el-button v-if="btnPerms.delete" type="danger" size="small" @click="deleteFirmware(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && firmwares.length === 0" description="暂无固件">
        <el-button v-if="btnPerms.upload" type="primary" @click="showUploadDialog = true">上传固件</el-button>
      </el-empty>
    </el-card>
    
    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传固件" width="500px">
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef">
        <el-form-item label="固件文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".bin"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">支持 .bin 文件，最大 4MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="uploadForm.deviceType" placeholder="选择设备类型" style="width: 100%">
            <el-option label="通用设备" value="generic" />
            <el-option label="传感器" value="sensor" />
            <el-option label="开关/继电器" value="switch" />
            <el-option label="环境监测" value="environment" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="uploadForm.version" placeholder="例如: 1.0.0">
            <template #prepend>v</template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="uploadForm.note" type="textarea" :rows="2" placeholder="版本说明(可选)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">
          上传
        </el-button>
      </template>
    </el-dialog>
    
    <!-- OTA批量升级对话框 -->
    <el-dialog v-model="showBatchDialog" title="批量升级" width="600px">
      <div class="batch-info">
        <p>选择要升级的设备，目标固件: <strong>{{ selectedFirmwareInfo }}</strong></p>
      </div>
      
      <el-table 
        :data="onlineDevices" 
        style="width: 100%; margin-top: 20px;"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="device_id" label="设备ID" min-width="120" />
        <el-table-column prop="name" label="名称" min-width="100" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="ip" label="IP" width="130" />
      </el-table>
      
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="startBatchOTA" 
          :disabled="selectedDevices.length === 0"
          :loading="batchOtaLoading"
        >
          升级 {{ selectedDevices.length }} 台设备
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Files, Upload, Download, Delete, UploadFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const btnPerms = computed(() => userStore.getButtonPermissions('firmware'))

const firmwares = ref([])
const loading = ref(false)
const showUploadDialog = ref(false)
const showBatchDialog = ref(false)
const uploading = ref(false)
const batchOtaLoading = ref(false)

const uploadRef = ref()
const uploadFormRef = ref()
const selectedDevices = ref([])

const uploadForm = ref({
  file: null,
  deviceType: 'generic',
  version: '',
  note: ''
})

const onlineDevices = ref([])

const uploadRules = {
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式: x.y.z', trigger: 'blur' }
  ]
}

const selectedFirmwareInfo = computed(() => {
  if (!selectedFirmware.value) return ''
  const fw = firmwares.value.find(f => f.filename === selectedFirmware.value)
  return fw ? `${fw.filename} (${formatSize(fw.size)})` : selectedFirmware.value
})

const selectedFirmware = ref('')

onMounted(() => {
  fetchFirmwares()
  fetchOnlineDevices()
})

const fetchFirmwares = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/firmware')
    firmwares.value = res.data
  } catch (err) {
    ElMessage.error('获取固件列表失败')
  } finally {
    loading.value = false
  }
}

const fetchOnlineDevices = async () => {
  try {
    const res = await axios.get('/api/devices')
    onlineDevices.value = res.data.filter(d => d.online)
  } catch (err) {
    console.error('获取设备列表失败:', err)
  }
}

const getVersion = (filename) => {
  const match = filename.match(/_v(.+)\.bin$/)
  return match ? match[1] : '-'
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
}

const handleFileRemove = () => {
  uploadForm.value.file = null
}

const handleUpload = async () => {
  const valid = await uploadFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择固件文件')
    return
  }
  
  uploading.value = true
  
  const formData = new FormData()
  formData.append('firmware', uploadForm.value.file)
  formData.append('device_type', uploadForm.value.deviceType)
  formData.append('version', uploadForm.value.version)
  formData.append('note', uploadForm.value.note)
  
  try {
    await axios.post('/api/firmware/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    ElMessage.success('固件上传成功')
    showUploadDialog.value = false
    uploadForm.value = { file: null, deviceType: 'generic', version: '', note: '' }
    fetchFirmwares()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '上传失败')
  } finally {
    uploading.value = false
  }
}

const downloadFirmware = (firmware) => {
  window.open(`/firmware/${firmware.filename}`, '_blank')
}

const deleteFirmware = async (firmware) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除固件 "${firmware.filename}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await axios.delete(`/api/firmware/${firmware.filename}`)
    ElMessage.success('固件已删除')
    fetchFirmwares()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.error || '删除失败')
    }
  }
}

const handleSelectionChange = (selection) => {
  selectedDevices.value = selection
}

const startBatchOTA = async () => {
  if (selectedDevices.value.length === 0) {
    ElMessage.warning('请选择要升级的设备')
    return
  }
  
  if (!selectedFirmware.value) {
    ElMessage.warning('请选择固件')
    return
  }
  
  batchOtaLoading.value = true
  
  try {
    const firmwareUrl = `/firmware/${selectedFirmware.value}`
    const version = getVersion(selectedFirmware.value)
    
    for (const device of selectedDevices.value) {
      await axios.post(`/api/devices/${device.device_id}/ota`, {
        firmware_url: firmwareUrl,
        version: version
      })
    }
    
    ElMessage.success(`已向 ${selectedDevices.value.length} 台设备下发升级命令`)
    showBatchDialog.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '批量升级失败')
  } finally {
    batchOtaLoading.value = false
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-info {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.batch-info p {
  margin: 0;
}
</style>
