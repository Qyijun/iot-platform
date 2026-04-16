<template>
  <div class="groups-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设备分组</span>
          <el-button v-if="btnPerms.add" type="primary" :icon="Plus" @click="openAddDialog">新建分组</el-button>
        </div>
      </template>

      <el-row :gutter="20" v-loading="loading">
        <el-col :span="6" v-for="group in sortedGroups" :key="group.id">
          <el-card class="group-card" shadow="hover" :body-style="{ padding: '0px' }">
            <div class="group-header" :style="{ backgroundColor: group.color }">
              <span class="group-icon">{{ getIcon(group.icon) }}</span>
              <span class="group-name">{{ group.name }}</span>
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, group)">
                <el-button type="info" plain size="small" class="more-btn">更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" :disabled="!btnPerms.edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="devices">查看设备</el-dropdown-item>
                    <el-dropdown-item command="move" :disabled="!btnPerms.deviceMove || allGroups.length <= 1">移动设备</el-dropdown-item>
                    <el-dropdown-item command="clear" :disabled="!btnPerms.deviceClear || group.device_count === 0">清空设备</el-dropdown-item>
                    <el-dropdown-item command="delete" divided :disabled="!btnPerms.delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="group-body">
              <p class="group-desc">{{ group.description || '暂无描述' }}</p>
              <div class="group-footer">
                <span class="device-count">{{ group.device_count }} 台设备</span>
                <span class="sort-order">排序: {{ group.sort_order }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6" v-if="groups.length === 0">
          <el-empty description="暂无分组，点击右上角创建">
            <template #image>
              <el-icon :size="60"><FolderAdd /></el-icon>
            </template>
          </el-empty>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新建/编辑分组对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingGroup ? '编辑分组' : '新建分组'" width="500px">
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="分组名称">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="groupForm.description" type="textarea" rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="groupForm.icon" placeholder="选择图标" style="width: 100%">
            <el-option label="文件夹" value="folder">📁 文件夹</el-option>
            <el-option label="办公区域" value="office">🏢 办公区域</el-option>
            <el-option label="家庭" value="home">🏠 家庭</el-option>
            <el-option label="工厂" value="factory">🏭 工厂</el-option>
            <el-option label="仓库" value="warehouse">📦 仓库</el-option>
            <el-option label="实验室" value="lab">🔬 实验室</el-option>
            <el-option label="户外" value="outdoor">🏕️ 户外</el-option>
            <el-option label="商场" value="store">🏪 商场</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="groupForm.color" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="groupForm.sort_order" :min="0" :max="999" />
          <span class="sort-tip">数值越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGroup" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分组设备对话框 -->
    <el-dialog v-model="showDevicesDialog" :title="`${currentGroup?.name || ''} - 设备列表`" width="900px">
      <div class="dialog-toolbar">
        <el-button v-if="btnPerms.deviceAdd" type="primary" @click="openAddDevicesDialog">添加设备</el-button>
        <el-button v-if="btnPerms.deviceMove" type="warning" @click="openMoveDialog" :disabled="!selectedDevices.length">
          移动到其他分组
        </el-button>
        <el-button v-if="btnPerms.deviceRemove" type="danger" @click="removeSelectedDevices" :disabled="!selectedDevices.length">
          移除选中 ({{ selectedDevices.length }})
        </el-button>
        <el-button v-if="btnPerms.deviceClear" type="warning" plain @click="clearAllDevices" :disabled="!groupDevices.length">
          一键清空
        </el-button>
      </div>
      
      <el-table :data="groupDevices" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="设备名称" />
        <el-table-column prop="device_id" label="设备ID" width="180" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'" size="small">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDevice(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 添加设备对话框 -->
    <el-dialog v-model="showAddDevicesDialog" title="添加设备到分组" width="700px">
      <el-table 
        ref="addDevicesTable" 
        :data="availableDevices" 
        @selection-change="handleAddSelectionChange" 
        border
        height="350"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="设备名称" />
        <el-table-column prop="device_id" label="设备ID" />
        <el-table-column prop="type" label="类型" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'" size="small">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="add-tip">已选 {{ addSelected.length }} 台设备</div>
      <template #footer>
        <el-button @click="showAddDevicesDialog = false">取消</el-button>
        <el-button type="primary" @click="addSelectedDevices" :disabled="!addSelected.length">
          添加 ({{ addSelected.length }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 移动设备对话框 -->
    <el-dialog v-model="showMoveDialog" title="移动设备到其他分组" width="500px">
      <el-form-item label="目标分组">
        <el-select v-model="targetGroupId" placeholder="请选择目标分组" style="width: 100%">
          <el-option
            v-for="g in otherGroups"
            :key="g.id"
            :label="`${getIcon(g.icon)} ${g.name}`"
            :value="g.id"
          />
        </el-select>
      </el-form-item>
      <div class="move-tip">
        将移动 {{ selectedDevices.length }} 台设备到目标分组
      </div>
      <template #footer>
        <el-button @click="showMoveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveDevices" :disabled="!targetGroupId">
          确认移动
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, FolderAdd } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()
const btnPerms = computed(() => userStore.getButtonPermissions('group'))

const loading = ref(false)
const saving = ref(false)
const groups = ref([])
const showAddDialog = ref(false)
const showDevicesDialog = ref(false)
const showAddDevicesDialog = ref(false)
const showMoveDialog = ref(false)
const editingGroup = ref(null)
const currentGroup = ref(null)
const groupDevices = ref([])
const availableDevices = ref([])
const selectedDevices = ref([])
const addSelected = ref([])
const allDevices = ref([])
const targetGroupId = ref(null)

const groupForm = reactive({
  name: '',
  description: '',
  icon: 'folder',
  color: '#409EFF',
  sort_order: 0
})

const iconMap = {
  folder: '📁',
  home: '🏠',
  factory: '🏭',
  warehouse: '📦',
  office: '🏢',
  lab: '🔬',
  outdoor: '🏕️',
  store: '🏪'
}

const getIcon = (icon) => iconMap[icon] || '📁'

// 按排序字段排序
const sortedGroups = computed(() => {
  return [...groups.value].sort((a, b) => a.sort_order - b.sort_order)
})

// 除当前分组外的其他分组（用于移动）
const otherGroups = computed(() => {
  return groups.value.filter(g => g.id !== currentGroup.value?.id)
})

const allGroups = computed(() => groups.value)

const fetchGroups = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/groups')
    groups.value = res.data
  } catch (err) {
    ElMessage.error('获取分组失败')
  } finally {
    loading.value = false
  }
}

const fetchAllDevices = async () => {
  try {
    const res = await axios.get('/api/devices')
    allDevices.value = res.data
  } catch (err) {
    console.error('获取设备列表失败', err)
  }
}

const fetchGroupDevices = async (groupId) => {
  try {
    const res = await axios.get(`/api/groups/${groupId}/devices`)
    groupDevices.value = res.data
  } catch (err) {
    ElMessage.error('获取分组设备失败')
  }
}

const fetchAvailableDevices = async () => {
  try {
    const res = await axios.get('/api/devices')
    const inGroupIds = new Set(groupDevices.value.map(d => d.device_id))
    availableDevices.value = res.data
      .filter(d => !inGroupIds.has(d.device_id))
      .map(d => ({
        ...d,
        online: onlineDevices.has(d.device_id)
      }))
  } catch (err) {
    console.error('获取可用设备失败', err)
  }
}

// 模拟在线设备（后续可对接WebSocket状态）
const onlineDevices = ref(new Set())

const openAddDialog = () => {
  editingGroup.value = null
  resetForm()
  showAddDialog.value = true
}

const saveGroup = async () => {
  if (!groupForm.name) {
    return ElMessage.warning('请输入分组名称')
  }
  saving.value = true
  try {
    if (editingGroup.value) {
      await axios.put(`/api/groups/${editingGroup.value.id}`, groupForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/groups', groupForm)
      ElMessage.success('创建成功')
    }
    showAddDialog.value = false
    resetForm()
    fetchGroups()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  groupForm.name = ''
  groupForm.description = ''
  groupForm.icon = 'folder'
  groupForm.color = '#409EFF'
  groupForm.sort_order = groups.value.length
  editingGroup.value = null
}

const handleCommand = async (cmd, group) => {
  if (cmd === 'edit') {
    editingGroup.value = group
    Object.assign(groupForm, {
      name: group.name,
      description: group.description,
      icon: group.icon,
      color: group.color,
      sort_order: group.sort_order
    })
    showAddDialog.value = true
  } else if (cmd === 'devices') {
    currentGroup.value = group
    selectedDevices.value = []
    await fetchGroupDevices(group.id)
    showDevicesDialog.value = true
  } else if (cmd === 'move') {
    currentGroup.value = group
    selectedDevices.value = []
    await fetchGroupDevices(group.id)
    showDevicesDialog.value = true
  } else if (cmd === 'clear') {
    ElMessageBox.confirm(`确定清空分组 "${group.name}" 下的所有设备吗？设备不会被删除，只是从分组移除。`, '提示', {
      type: 'warning'
    }).then(async () => {
      try {
        await axios.delete(`/api/groups/${group.id}/devices/all`)
        ElMessage.success('清空成功')
        fetchGroups()
      } catch (err) {
        ElMessage.error('清空失败')
      }
    }).catch(() => {})
  } else if (cmd === 'delete') {
    ElMessageBox.confirm(`确定删除分组 "${group.name}" 吗？分组内的设备不会被删除。`, '提示', {
      type: 'warning'
    }).then(async () => {
      await axios.delete(`/api/groups/${group.id}`)
      ElMessage.success('删除成功')
      fetchGroups()
    }).catch(() => {})
  }
}

const handleSelectionChange = (selection) => {
  selectedDevices.value = selection
}

const handleAddSelectionChange = (selection) => {
  addSelected.value = selection
}

const viewDevice = (device) => {
  router.push(`/devices/${device.device_id}`)
}

const openAddDevicesDialog = async () => {
  // 确保先获取分组内的设备
  await fetchGroupDevices(currentGroup.value.id)
  await fetchAvailableDevices()
  showAddDevicesDialog.value = true
}

const openMoveDialog = () => {
  if (otherGroups.value.length === 0) {
    return ElMessage.warning('没有其他分组可移动')
  }
  targetGroupId.value = null
  showMoveDialog.value = true
}

const confirmMoveDevices = async () => {
  if (!targetGroupId.value) {
    return ElMessage.warning('请选择目标分组')
  }
  try {
    await axios.post('/api/groups/move-devices', {
      deviceIds: selectedDevices.value.map(d => d.device_id),
      fromGroupId: currentGroup.value.id,
      toGroupId: targetGroupId.value
    })
    ElMessage.success('移动成功')
    showMoveDialog.value = false
    fetchGroupDevices(currentGroup.value.id)
    fetchGroups()
    selectedDevices.value = []
  } catch (err) {
    ElMessage.error('移动失败')
  }
}

const removeSelectedDevices = async () => {
  if (!selectedDevices.value.length) return
  try {
    for (const device of selectedDevices.value) {
      await axios.delete(`/api/groups/${currentGroup.value.id}/devices/${device.device_id}`)
    }
    ElMessage.success('移除成功')
    fetchGroupDevices(currentGroup.value.id)
    fetchGroups()
    selectedDevices.value = []
  } catch (err) {
    ElMessage.error('移除失败')
  }
}

const clearAllDevices = async () => {
  ElMessageBox.confirm(`确定清空该分组下的所有 ${groupDevices.value.length} 台设备吗？`, '确认清空', {
    type: 'warning'
  }).then(async () => {
    try {
      await axios.delete(`/api/groups/${currentGroup.value.id}/devices/all`)
      ElMessage.success('清空成功')
      fetchGroupDevices(currentGroup.value.id)
      fetchGroups()
      selectedDevices.value = []
    } catch (err) {
      ElMessage.error('清空失败')
    }
  }).catch(() => {})
}

const addSelectedDevices = async () => {
  if (!addSelected.value.length) return
  try {
    await axios.post(`/api/groups/${currentGroup.value.id}/devices/batch`, {
      deviceIds: addSelected.value.map(d => d.device_id)
    })
    ElMessage.success('添加成功')
    showAddDevicesDialog.value = false
    fetchGroupDevices(currentGroup.value.id)
    fetchGroups()
    addSelected.value = []
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

onMounted(() => {
  fetchGroups()
  fetchAllDevices()
})
</script>

<style scoped>
.groups-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-card {
  margin-bottom: 20px;
  min-height: 160px;
}

.group-header {
  display: flex;
  align-items: center;
  padding: 20px;
  color: white;
  min-height: 60px;
}

.group-icon {
  font-size: 28px;
  margin-right: 12px;
}

.group-name {
  flex: 1;
  font-size: 18px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-btn {
  background: rgba(255,255,255,0.2) !important;
  border: none !important;
  color: white !important;
  font-size: 14px;
}

.more-btn:hover {
  background: rgba(255,255,255,0.4) !important;
}

.group-body {
  padding: 20px;
  min-height: 80px;
}

.group-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
  min-height: 44px;
  line-height: 1.5;
}

.group-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #606266;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.device-count {
  font-weight: 600;
  color: #409EFF;
}

.sort-order {
  color: #909399;
}

.sort-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.dialog-toolbar {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.add-tip {
  margin-top: 10px;
  color: #409EFF;
  font-size: 14px;
}

.move-tip {
  margin-top: 15px;
  padding: 10px;
  background: #f4f4f5;
  border-radius: 4px;
  color: #606266;
}

/* 下拉菜单文字放大 */
:deep(.el-dropdown-menu__item) {
  font-size: 15px;
  padding: 10px 24px;
}
</style>
