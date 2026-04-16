<template>
  <div class="logs-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <div class="header-actions">
            <el-select v-model="filterAction" placeholder="操作类型" clearable style="width: 150px; margin-right: 10px;">
              <el-option label="全部" :value="null" />
              <el-option v-for="action in actionTypes" :key="action.value" :label="action.label" :value="action.value" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px; margin-right: 10px;"
            />
            <el-button type="primary" @click="fetchLogs">搜索</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="logs" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="操作用户" width="120" />
        <el-table-column prop="action" label="操作类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="操作详情" min-width="300" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="created_at" label="操作时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchLogs"
          @current-change="fetchLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const logs = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterAction = ref(null)
const dateRange = ref(null)

const actionTypes = [
  { value: 'login', label: '登录' },
  { value: 'logout', label: '退出' },
  { value: 'device_control', label: '设备控制' },
  { value: 'group_create', label: '创建分组' },
  { value: 'group_edit', label: '编辑分组' },
  { value: 'group_delete', label: '删除分组' },
  { value: 'group_device_add', label: '添加设备到分组' },
  { value: 'group_device_add_batch', label: '批量添加分组设备' },
  { value: 'group_device_remove', label: '从分组移除设备' },
  { value: 'group_device_move', label: '移动分组设备' },
  { value: 'group_device_clear', label: '清空分组设备' },
  { value: 'user_create', label: '创建用户' },
  { value: 'user_edit', label: '编辑用户' },
  { value: 'user_delete', label: '删除用户' },
  { value: 'role_create', label: '创建角色' },
  { value: 'role_edit', label: '编辑角色' },
  { value: 'role_delete', label: '删除角色' },
  { value: 'role_permission', label: '分配权限' },
  { value: 'settings_change', label: '设置修改' },
]

const getActionType = (action) => {
  if (action.includes('login')) return 'success'
  if (action.includes('delete')) return 'danger'
  if (action.includes('create') || action.includes('add')) return 'primary'
  if (action.includes('edit')) return 'warning'
  return 'info'
}

const getActionLabel = (action) => {
  const found = actionTypes.find(a => a.value === action)
  return found ? found.label : action
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (filterAction.value) {
      params.action = filterAction.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await axios.get('/api/admin/logs', { params })
    logs.value = res.data.logs
    total.value = res.data.total
  } catch (err) {
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterAction.value = null
  dateRange.value = null
  currentPage.value = 1
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.logs-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
