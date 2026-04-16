<template>
  <div class="db-config-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Connection /></el-icon> 数据库配置</span>
          <el-button type="primary" @click="fetchConfig" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="restartRequired"
        title="配置已更新，需要重启服务"
        type="warning"
        description="数据库配置已保存，请在服务器上重启 Node.js 服务以使配置生效"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />

      <!-- 当前配置 -->
      <div class="current-config">
        <h4>当前数据库类型：<el-tag :type="currentTypeTag">{{ currentConfig.type?.toUpperCase() }}</el-tag></h4>
      </div>

      <el-tabs v-model="activeTab" type="border-card">
        <!-- SQLite -->
        <el-tab-pane label="SQLite" name="sqlite">
          <el-form :model="sqliteForm" label-width="120px">
            <el-form-item label="数据库路径">
              <el-input v-model="sqliteForm.path" placeholder="./data/database.sqlite" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveConfig('sqlite')" :loading="saving">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- MySQL -->
        <el-tab-pane label="MySQL" name="mysql">
          <el-form :model="mysqlForm" label-width="120px">
            <el-form-item label="主机地址">
              <el-input v-model="mysqlForm.host" placeholder="192.168.1.100" />
            </el-form-item>
            <el-form-item label="端口">
              <el-input-number v-model="mysqlForm.port" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="mysqlForm.user" placeholder="root" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="mysqlForm.password" type="password" show-password placeholder="密码" />
            </el-form-item>
            <el-form-item label="数据库名">
              <el-input v-model="mysqlForm.database" placeholder="iot_platform" />
            </el-form-item>
            <el-form-item>
              <el-button @click="testConnection('mysql')" :loading="testing">
                测试连接
              </el-button>
              <el-button type="primary" @click="saveConfig('mysql')" :loading="saving">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- PostgreSQL -->
        <el-tab-pane label="PostgreSQL" name="postgresql">
          <el-form :model="pgForm" label-width="120px">
            <el-form-item label="主机地址">
              <el-input v-model="pgForm.host" placeholder="192.168.1.100" />
            </el-form-item>
            <el-form-item label="端口">
              <el-input-number v-model="pgForm.port" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="pgForm.user" placeholder="postgres" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="pgForm.password" type="password" show-password placeholder="密码" />
            </el-form-item>
            <el-form-item label="数据库名">
              <el-input v-model="pgForm.database" placeholder="iot_platform" />
            </el-form-item>
            <el-form-item>
              <el-button @click="testConnection('postgresql')" :loading="testing">
                测试连接
              </el-button>
              <el-button type="primary" @click="saveConfig('postgresql')" :loading="saving">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 重置数据库 -->
      <el-divider />
      <div class="danger-zone">
        <h4><el-icon><Warning /></el-icon> 危险区域</h4>
        <p>重置数据库将删除所有数据，重新创建表结构和默认管理员账号</p>
        <el-button type="danger" @click="resetDatabase" :loading="resetting">
          重置数据库
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Refresh, Warning } from '@element-plus/icons-vue'
import axios from 'axios'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const resetting = ref(false)
const restartRequired = ref(false)
const currentConfig = ref({ type: 'sqlite' })

const activeTab = ref('sqlite')

const sqliteForm = ref({
  path: './data/database.sqlite'
})

const mysqlForm = ref({
  host: '',
  port: 3306,
  user: '',
  password: '',
  database: ''
})

const pgForm = ref({
  host: '',
  port: 5432,
  user: '',
  password: '',
  database: ''
})

const currentTypeTag = computed(() => {
  const map = { sqlite: 'info', mysql: 'success', postgresql: 'warning' }
  return map[currentConfig.value.type] || 'info'
})

onMounted(() => {
  fetchConfig()
})

const fetchConfig = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/admin/database/config')
    currentConfig.value = res.data.config
    restartRequired.value = false

    // 切换到对应标签页
    activeTab.value = currentConfig.value.type || 'sqlite'

    // 填充表单
    if (currentConfig.value.type === 'sqlite') {
      sqliteForm.value.path = currentConfig.value.path || './data/database.sqlite'
    } else if (currentConfig.value.type === 'mysql') {
      mysqlForm.value.host = currentConfig.value.host || ''
      mysqlForm.value.port = currentConfig.value.port || 3306
      mysqlForm.value.user = currentConfig.value.user || ''
      mysqlForm.value.password = currentConfig.value.password || ''
      mysqlForm.value.database = currentConfig.value.database || ''
    } else if (currentConfig.value.type === 'postgresql') {
      pgForm.value.host = currentConfig.value.host || ''
      pgForm.value.port = currentConfig.value.port || 5432
      pgForm.value.user = currentConfig.value.user || ''
      pgForm.value.password = currentConfig.value.password || ''
      pgForm.value.database = currentConfig.value.database || ''
    }
  } catch (err) {
    ElMessage.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

const testConnection = async (type) => {
  testing.value = true
  try {
    let data = { type }
    if (type === 'mysql') {
      data = { ...data, ...mysqlForm.value }
    } else if (type === 'postgresql') {
      data = { ...data, ...pgForm.value }
    }

    const res = await axios.post('/api/admin/database/test', data)
    if (res.data.success) {
      ElMessage.success(res.data.message)
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (err) {
    ElMessage.error('连接测试失败')
  } finally {
    testing.value = false
  }
}

const saveConfig = async (type) => {
  saving.value = true
  try {
    let data = { type }
    if (type === 'sqlite') {
      data.path = sqliteForm.value.path
    } else if (type === 'mysql') {
      data = { ...data, ...mysqlForm.value }
    } else if (type === 'postgresql') {
      data = { ...data, ...pgForm.value }
    }

    const res = await axios.post('/api/admin/database/config', data)
    ElMessage.success(res.data.message)
    
    if (res.data.restartRequired) {
      restartRequired.value = true
      currentConfig.value.type = type
      activeTab.value = type  // 同步切换标签页
    }
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetDatabase = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将删除所有数据，包括设备、用户、配置等。确定要重置吗？',
      '警告',
      { type: 'warning' }
    )
    
    resetting.value = true
    const res = await axios.post('/api/admin/database/reset')
    ElMessage.success(res.data.message)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('重置失败')
    }
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.db-config-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-config {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.current-config h4 {
  margin: 0;
}

.danger-zone {
  padding: 20px;
  background: #fff6f6;
  border-radius: 4px;
  border: 1px solid #fde2e2;
}

.danger-zone h4 {
  color: #f56c6c;
  margin-top: 0;
}

.danger-zone p {
  color: #909399;
  margin: 10px 0 20px;
}
</style>
