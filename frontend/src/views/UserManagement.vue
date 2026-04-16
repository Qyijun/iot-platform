<template>
  <div class="user-management">
    <div class="header">
      <h2>用户管理</h2>
      <el-button v-if="btnPerms.add" type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </div>
    
    <el-table :data="users" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="账号" width="150" />
      <el-table-column prop="display_name" label="用户名" width="150" />
      <el-table-column prop="roles" label="角色" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role.id"
            :type="role.code === 'admin' ? 'danger' : role.code === 'operator' ? 'warning' : 'success'"
            style="margin-right: 5px"
          >
            {{ role.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button v-if="btnPerms.view" type="info" size="small" @click="handleView(row)">
            查看
          </el-button>
          <el-button v-if="btnPerms.edit" type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button v-if="btnPerms.role" type="warning" size="small" @click="handleAssignRoles(row)">
            分配角色
          </el-button>
          <el-button 
            v-if="btnPerms.delete"
            type="danger" 
            size="small" 
            :disabled="row.username === currentUser"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加用户对话框 -->
    <el-dialog v-model="showAddDialog" title="添加用户" width="550px">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="addForm.username" placeholder="登录账号，至少3个字符" />
        </el-form-item>
        <el-form-item label="用户名" prop="displayName">
          <el-input v-model="addForm.displayName" placeholder="用户显示名称（可与账号相同）" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addForm.password" type="password" placeholder="至少6个字符" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="addForm.roleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in allRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <!-- 角色权限预览 -->
        <el-form-item label="权限预览" v-if="addForm.roleIds.length > 0">
          <div class="perm-preview">
            <el-tag
              v-for="perm in selectedRolePermissions"
              :key="perm"
              size="small"
              style="margin: 2px"
              type="info"
            >
              {{ perm }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 分配角色对话框 -->
    <el-dialog v-model="showRoleDialog" title="分配角色" width="550px">
      <el-form label-width="80px">
        <el-form-item label="账号">
          <span>{{ selectedUser?.username }}</span>
        </el-form-item>
        <el-form-item label="用户名">
          <span>{{ selectedUser?.display_name || selectedUser?.username }}</span>
        </el-form-item>
        <el-form-item label="分配角色">
          <el-select v-model="selectedRoleIds" multiple placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in allRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <!-- 角色权限预览 -->
        <el-form-item label="权限预览" v-if="selectedRoleIds.length > 0">
          <div class="perm-preview">
            <el-tag
              v-for="perm in editRolePermissions"
              :key="perm"
              size="small"
              style="margin: 2px"
              type="info"
            >
              {{ perm }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveRoles">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看用户对话框 -->
    <el-dialog v-model="showViewDialog" title="用户详情" width="500px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ viewUser?.id }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ viewUser?.username }}</el-descriptions-item>
        <el-descriptions-item label="用户名" :span="2">{{ viewUser?.display_name || viewUser?.username }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(viewUser?.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="角色" :span="2">
          <el-tag
            v-for="role in viewUser?.roles"
            :key="role.id"
            :type="role.code === 'admin' ? 'danger' : role.code === 'operator' ? 'warning' : 'success'"
            style="margin-right: 5px"
          >
            {{ role.name }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="拥有权限" :span="2">
          <div class="view-perm-list">
            <el-tag
              v-for="perm in viewUserPermissions"
              :key="perm"
              size="small"
              style="margin: 2px"
              type="info"
            >
              {{ perm }}
            </el-tag>
          </div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="showViewDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑用户" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="用户ID">
          <el-input :value="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="editForm.username" placeholder="登录账号，至少3个字符" />
        </el-form-item>
        <el-form-item label="用户名" prop="displayName">
          <el-input v-model="editForm.displayName" placeholder="用户显示名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const currentUser = userStore.username

// 获取用户相关按钮权限
const btnPerms = computed(() => userStore.getButtonPermissions('user'))

const users = ref([])
const allRoles = ref([])
const showAddDialog = ref(false)
const showRoleDialog = ref(false)
const showViewDialog = ref(false)
const showEditDialog = ref(false)
const adding = ref(false)
const saving = ref(false)
const addFormRef = ref(null)
const editFormRef = ref(null)
const selectedUser = ref(null)
const selectedRoleIds = ref([])
const viewUser = ref(null)

const addForm = reactive({
  username: '',
  displayName: '',
  password: '',
  roleIds: []
})

const addRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少3个字符', trigger: 'blur' }
  ],
  displayName: [
    { required: false, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  roleIds: [
    { required: true, message: '请至少选择一个角色', trigger: 'change', type: 'array' }
  ]
}

const editRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少3个字符', trigger: 'blur' }
  ],
  displayName: [
    { required: false, message: '请输入用户名', trigger: 'blur' }
  ]
}

const editForm = reactive({
  id: null,
  username: '',
  displayName: ''
})

// 查看用户的权限列表
const viewUserPermissions = computed(() => {
  if (!viewUser.value?.roles) return []
  const perms = new Set()
  viewUser.value.roles.forEach(role => {
    const roleInfo = allRoles.value.find(r => r.id === role.id)
    if (roleInfo?.permissionNames) {
      roleInfo.permissionNames.forEach(p => perms.add(p))
    }
  })
  return Array.from(perms).sort()
})

// 计算选中角色的权限集合
const selectedRolePermissions = computed(() => {
  const perms = new Set()
  addForm.roleIds.forEach(roleId => {
    const role = allRoles.value.find(r => r.id === roleId)
    if (role?.permissionNames) {
      role.permissionNames.forEach(p => perms.add(p))
    }
  })
  return Array.from(perms).sort()
})

// 编辑时选中角色的权限集合
const editRolePermissions = computed(() => {
  const perms = new Set()
  selectedRoleIds.value.forEach(roleId => {
    const role = allRoles.value.find(r => r.id === roleId)
    if (role?.permissionNames) {
      role.permissionNames.forEach(p => perms.add(p))
    }
  })
  return Array.from(perms).sort()
})

const fetchUsers = async () => {
  try {
    const res = await axios.get('/api/admin/users')
    users.value = res.data
  } catch (err) {
    ElMessage.error('获取用户列表失败')
  }
}

const fetchRoles = async () => {
  try {
    const res = await axios.get('/api/admin/roles')
    allRoles.value = res.data
  } catch (err) {
    ElMessage.error('获取角色列表失败')
  }
}

// 格式化时间
const formatDateTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const handleAdd = async () => {
  try {
    await addFormRef.value.validate()
  } catch {
    return
  }
  
  adding.value = true
  try {
    await axios.post('/api/admin/users', {
      username: addForm.username,
      displayName: addForm.displayName || addForm.username,
      password: addForm.password,
      roleIds: addForm.roleIds
    })
    ElMessage.success('添加成功')
    showAddDialog.value = false
    addForm.username = ''
    addForm.displayName = ''
    addForm.password = ''
    addForm.roleIds = []
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '添加失败')
  } finally {
    adding.value = false
  }
}

const handleAssignRoles = (user) => {
  selectedUser.value = user
  selectedRoleIds.value = user.roles.map(r => r.id)
  showRoleDialog.value = true
}

// 查看用户详情
const handleView = (user) => {
  viewUser.value = user
  showViewDialog.value = true
}

// 编辑用户
const handleEdit = (user) => {
  editForm.id = user.id
  editForm.username = user.username
  editForm.displayName = user.display_name || ''
  showEditDialog.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
  try {
    await editFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    await axios.put(`/api/admin/users/${editForm.id}`, {
      username: editForm.username,
      displayName: editForm.displayName
    })
    ElMessage.success('用户信息已更新')
    showEditDialog.value = false
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '更新失败')
  } finally {
    saving.value = false
  }
}

const handleSaveRoles = async () => {
  if (selectedRoleIds.value.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }
  
  saving.value = true
  try {
    await axios.put(`/api/admin/users/${selectedUser.value.id}/roles`, {
      roleIds: selectedRoleIds.value
    })
    ElMessage.success('角色分配成功')
    showRoleDialog.value = false
    fetchUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '分配失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await axios.delete(`/api/admin/users/${row.id}`)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.error || '删除失败')
    }
  }
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.perm-preview {
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.view-perm-list {
  max-height: 150px;
  overflow-y: auto;
}
</style>
