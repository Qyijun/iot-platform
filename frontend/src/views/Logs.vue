<template>
  <div class="logs-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>日志报表</span>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item label="操作类型">
          <el-select v-model="filterAction" placeholder="全部" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="登录" value="login" />
            <el-option label="修改密码" value="change_password" />
            <el-option label="创建用户" value="user_add" />
            <el-option label="编辑用户" value="user_edit" />
            <el-option label="删除用户" value="user_delete" />
            <el-option label="分配角色" value="user_role" />
            <el-option label="创建角色" value="role_add" />
            <el-option label="编辑角色" value="role_edit" />
            <el-option label="删除角色" value="role_delete" />
            <el-option label="设备控制" value="device_control" />
            <el-option label="设备上线" value="device_online" />
            <el-option label="设备离线" value="device_offline" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport">导出xlsx</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 日志列表 -->
      <el-table :data="logs" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column prop="action" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="150" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const logs = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterAction = ref('')
const dateRange = ref([])

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      action: filterAction.value || undefined,
      startDate: dateRange.value?.[0] || undefined,
      endDate: dateRange.value?.[1] || undefined
    }
    const res = await axios.get('/api/admin/logs', { params })
    logs.value = res.data.logs
    total.value = res.data.total
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '获取日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchLogs()
}

const handleReset = () => {
  filterAction.value = ''
  dateRange.value = []
  currentPage.value = 1
  fetchLogs()
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchLogs()
}

const handlePageChange = () => {
  fetchLogs()
}

const handleExport = () => {
  if (logs.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  // 动态导入 xlsx
  import('xlsx').then(XLSX => {
    // 准备数据
    const data = logs.value.map(log => ({
      'ID': log.id,
      '账号': log.username,
      '操作类型': getActionText(log.action),
      '详情': log.detail || '',
      'IP地址': log.ip_address || '',
      '时间': formatDate(log.created_at)
    }))
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(data)
    
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '日志报表')
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 6 },   // ID
      { wch: 15 },  // 账号
      { wch: 12 },  // 操作类型
      { wch: 50 },  // 详情
      { wch: 18 },  // IP地址
      { wch: 22 }   // 时间
    ]
    
    // 导出文件
    const fileName = `日志报表_${new Date().toISOString().slice(0,10)}.xlsx`
    XLSX.writeFile(wb, fileName)
    ElMessage.success('导出成功')
  }).catch(err => {
    console.error('导出失败:', err)
    ElMessage.error('导出失败')
  })
}

const getActionType = (action) => {
  const types = {
    'login': 'success',
    'change_password': 'warning',
    'user_add': 'primary',
    'user_edit': 'warning',
    'user_delete': 'danger',
    'user_role': 'info',
    'role_add': 'primary',
    'role_edit': 'warning',
    'role_delete': 'danger',
    'device_control': 'info',
    'device_online': 'success',
    'device_offline': 'danger'
  }
  return types[action] || 'info'
}

const getActionText = (action) => {
  const texts = {
    'login': '登录',
    'change_password': '修改密码',
    'user_add': '创建用户',
    'user_edit': '编辑用户',
    'user_delete': '删除用户',
    'user_role': '分配角色',
    'role_add': '创建角色',
    'role_edit': '编辑角色',
    'role_delete': '删除角色',
    'device_control': '设备控制',
    'device_online': '设备上线',
    'device_offline': '设备离线',
    'system': '系统'
  }
  return texts[action] || action
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
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
  font-size: 18px;
  font-weight: bold;
}

.filter-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
