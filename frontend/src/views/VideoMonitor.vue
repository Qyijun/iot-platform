<template>
  <div class="video-monitor">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📹 视频监控</span>
          <el-button type="primary" @click="loadCameras" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载摄像头...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="cameras.length === 0" class="empty-container">
        <el-icon :size="64" color="#909399"><VideoCamera /></el-icon>
        <p>暂无摄像头配置</p>
        <el-button type="primary" @click="addDialogVisible = true">添加摄像头</el-button>
      </div>

      <!-- 摄像头网格 -->
      <div v-else class="camera-grid">
        <el-card
          v-for="camera in cameras"
          :key="camera.id"
          class="camera-card"
          shadow="hover"
          @click="openVideo(camera)"
        >
          <div class="camera-preview">
            <div class="preview-placeholder">
              <el-icon :size="48" color="#c0c4cc"><VideoCamera /></el-icon>
              <span>点击查看</span>
            </div>
            <div class="camera-status" :class="camera.status">
              <span class="status-dot"></span>
              {{ camera.status === 'online' ? '在线' : '离线' }}
            </div>
          </div>
          <div class="camera-info">
            <h4>{{ camera.name }}</h4>
            <p class="location">{{ camera.location || '未知位置' }}</p>
            <p class="ip">{{ camera.ip }}</p>
          </div>
          <div class="camera-actions">
            <el-button size="small" @click.stop="editCameraConfig(camera)">编辑</el-button>
            <el-button size="small" type="danger" @click.stop="deleteCameraConfig(camera)">删除</el-button>
          </div>
        </el-card>
      </div>

      <!-- 添加按钮 -->
      <div class="add-camera-btn">
        <el-button type="primary" plain @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加摄像头
        </el-button>
      </div>
    </el-card>

    <!-- 添加/编辑摄像头对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="editCamera ? '编辑摄像头' : '添加摄像头'"
      width="500px"
    >
      <el-form :model="cameraForm" :rules="cameraRules" ref="cameraFormRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="cameraForm.name" placeholder="如：客厅、门口" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="cameraForm.ip" placeholder="192.168.1.100" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="cameraForm.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="cameraForm.username" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="cameraForm.password" type="password" show-password placeholder="密码" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="cameraForm.location" placeholder="如：客厅、卧室" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCamera" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 视频播放对话框 -->
    <el-dialog
      v-model="videoDialogVisible"
      :title="currentCamera?.name || '视频监控'"
      width="800px"
      fullscreen
    >
      <div class="video-container">
        <div v-if="streamUrl" class="video-info">
          <p><strong>RTSP地址：</strong>{{ streamUrl.rtspUrl }}</p>
        </div>
        <div class="video-placeholder">
          <el-icon :size="80" color="#c0c4cc"><VideoPlay /></el-icon>
          <p>视频播放区域</p>
          <p class="tip">需要后端FFmpeg转码支持</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="captureImage" :loading="capturing">
          <el-icon><Crop /></el-icon>
          抓拍
        </el-button>
        <el-button @click="videoDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const cameras = ref([])
const addDialogVisible = ref(false)
const videoDialogVisible = ref(false)
const editCamera = ref(null)
const saving = ref(false)
const capturing = ref(false)
const currentCamera = ref(null)
const streamUrl = ref(null)

const cameraForm = reactive({
  name: '',
  ip: '',
  port: 554,
  username: 'admin',
  password: 'admin',
  location: ''
})

const cameraRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP格式不正确', trigger: 'blur' }
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }]
}

const cameraFormRef = ref(null)

// 显示添加对话框
const showAddDialog = () => {
  editCamera.value = null
  Object.assign(cameraForm, {
    name: '',
    ip: '',
    port: 554,
    username: 'admin',
    password: '',
    location: ''
  })
  addDialogVisible.value = true
}

// 编辑摄像头
const editCameraConfig = (camera) => {
  editCamera.value = camera
  Object.assign(cameraForm, {
    name: camera.name,
    ip: camera.ip,
    port: camera.port || 554,
    username: camera.username || 'admin',
    password: camera.password || '',
    location: camera.location || ''
  })
  addDialogVisible.value = true
}

// 删除摄像头
const deleteCameraConfig = async (camera) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除摄像头 "${camera.name}" 吗？`,
      '删除确认',
      { type: 'warning' }
    )

    await axios.delete(`/api/video/cameras/${camera.id}`)
    ElMessage.success('删除成功')
    loadCameras()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 加载摄像头列表
const loadCameras = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/video/cameras')
    cameras.value = res.data.data || []
  } catch (err) {
    ElMessage.error('加载摄像头失败')
  }
  loading.value = false
}

// 保存摄像头
const handleSaveCamera = async () => {
  try {
    await cameraFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    if (editCamera.value) {
      await axios.put(`/api/video/cameras/${editCamera.value.id}`, cameraForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/video/cameras', cameraForm)
      ElMessage.success('添加成功')
    }
    addDialogVisible.value = false
    loadCameras()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
  saving.value = false
}

// 打开视频
const openVideo = async (camera) => {
  currentCamera.value = camera
  videoDialogVisible.value = true

  try {
    const res = await axios.get(`/api/video/stream/${camera.id}/url`)
    streamUrl.value = res.data.data
  } catch (err) {
    streamUrl.value = null
    ElMessage.warning('获取视频流失败')
  }
}

// 抓拍
const captureImage = async () => {
  if (!currentCamera.value) return

  capturing.value = true
  try {
    const res = await axios.post(`/api/video/cameras/${currentCamera.value.id}/capture`)
    if (res.data.success) {
      ElMessage.success(`抓拍成功: ${res.data.data.filename}`)
    } else {
      ElMessage.error(res.data.error || '抓拍失败')
    }
  } catch (err) {
    ElMessage.error('抓拍失败')
  }
  capturing.value = false
}

onMounted(() => {
  loadCameras()
})
</script>

<style scoped>
.video-monitor {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
}

.empty-container p {
  margin: 16px 0;
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.camera-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.camera-card:hover {
  transform: translateY(-4px);
}

.camera-preview {
  position: relative;
  height: 160px;
  background: #1a1a1a;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #606266;
}

.preview-placeholder span {
  margin-top: 8px;
  font-size: 12px;
}

.camera-status {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: 4px;
}

.camera-status.online {
  color: #67c23a;
}

.camera-status.offline {
  color: #909399;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.camera-info {
  padding: 12px 0;
}

.camera-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.camera-info .location {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.camera-info .ip {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.camera-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.add-camera-btn {
  margin-top: 20px;
  text-align: center;
}

.video-container {
  background: #000;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.video-info {
  width: 100%;
  padding: 12px;
  background: #1a1a1a;
  color: #fff;
  font-size: 12px;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #606266;
}

.video-placeholder .tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
