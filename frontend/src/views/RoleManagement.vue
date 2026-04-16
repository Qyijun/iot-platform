<template>
  <div class="role-management">
    <div class="header">
      <h2>角色权限管理</h2>
      <el-button v-if="btnPerms.add" type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>新建角色
      </el-button>
    </div>
    
    <el-table :data="roles" stripe style="width: 100%">
      <el-table-column prop="code" label="角色代码" width="150">
        <template #default="{ row }">
          <el-tag :type="isSystemRole(row.code) ? 'info' : ''">
            {{ row.code }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="角色名称" width="150" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="permissions" label="权限数量" width="100">
        <template #default="{ row }">
          <el-tag type="warning">{{ row.permissions?.length || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="btnPerms.edit" type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button 
            v-if="btnPerms.delete"
            type="danger" 
            size="small" 
            :disabled="isSystemRole(row.code)"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑角色' : '新建角色'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="角色代码" v-if="!isEdit">
          <el-input v-model="form.code" placeholder="如: operator2" />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="form.name" placeholder="如: 操作员2" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="权限分配">
          <div class="perm-tip">勾选父级菜单时，子权限将自动勾选</div>
          <el-tree
            ref="permTreeRef"
            :data="permTreeData"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            show-checkbox
            default-expand-all
            :check-strictly="false"
            @check="handleCheckChange"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
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

// 获取角色相关按钮权限
const btnPerms = computed(() => userStore.getButtonPermissions('role'))

const roles = ref([])
const permTreeData = ref([])  // 树形权限数据
const showDialog = ref(false)
const showAddDialog = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const permTreeRef = ref(null)
const editingRoleId = ref(null)

const form = reactive({
  code: '',
  name: '',
  description: '',
  permissionIds: []
})

const systemRoles = ['admin', 'operator', 'viewer']

const isSystemRole = (code) => systemRoles.includes(code)

const fetchRoles = async () => {
  try {
    const res = await axios.get('/api/admin/roles')
    roles.value = res.data
  } catch (err) {
    ElMessage.error('获取角色列表失败')
  }
}

const fetchPermissions = async () => {
  try {
    const res = await axios.get('/api/admin/permissions')
    // 直接使用后端返回的树形结构
    permTreeData.value = res.data
  } catch (err) {
    ElMessage.error('获取权限列表失败')
  }
}

const handleEdit = (role) => {
  isEdit.value = true
  editingRoleId.value = role.id
  form.code = role.code
  form.name = role.name
  form.description = role.description || ''
  
  setTimeout(() => {
    // 从树形结构中获取所有权限的id
    const allPerms = []
    permTreeData.value.forEach(menu => {
      if (menu.id) allPerms.push(menu)
      if (menu.children) {
        menu.children.forEach(p => {
          if (p.id) allPerms.push(p)
        })
      }
    })
    
    // 根据角色权限code找到对应的id
    const ids = role.permissions.map(code => {
      const p = allPerms.find(p => p.code === code)
      return p ? p.id : null
    }).filter(Boolean)
    permTreeRef.value?.setCheckedKeys(ids)
  }, 100)
  
  showDialog.value = true
}

const handleDelete = async (role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await axios.delete(`/api/admin/roles/${role.id}`)
    ElMessage.success('删除成功')
    fetchRoles()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.error || '删除失败')
    }
  }
}

const handleSave = async () => {
  if (!form.name) {
    ElMessage.warning('请填写角色名称')
    return
  }
  
  saving.value = true
  try {
    // 获取选中的节点，只取叶子节点（有id但没有children的节点）
    const checkedNodes = permTreeRef.value?.getCheckedNodes(false, false) || []
    const permissionIds = checkedNodes
      .filter(n => n.id && !n.children)  // 只选权限节点，不要菜单节点
      .map(n => n.id)
    
    if (isEdit.value) {
      await axios.put(`/api/admin/roles/${editingRoleId.value}`, {
        name: form.name,
        description: form.description,
        permissionIds
      })
    } else {
      await axios.post('/api/admin/roles', {
        code: form.code,
        name: form.name,
        description: form.description,
        permissionIds
      })
    }
    
    ElMessage.success('保存成功')
    showDialog.value = false
    showAddDialog.value = false
    resetForm()
    fetchRoles()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  form.code = ''
  form.name = ''
  form.description = ''
  permTreeRef.value?.setCheckedKeys([])
}

// 级联选择：勾选父节点时，自动勾选所有子节点
const handleCheckChange = (data, checked) => {
  if (!permTreeRef.value) return
  
  // 如果有子节点，级联操作
  if (data.children && data.children.length > 0) {
    const childIds = data.children.map(child => child.id).filter(Boolean)
    if (checked.checked) {
      // 勾选：选中所有子节点
      permTreeRef.value.setChecked(childIds, true, false)
    } else {
      // 取消：取消所有子节点
      permTreeRef.value.setChecked(childIds, false, false)
    }
  }
  
  // 同步父节点状态（如果所有子节点都选中，父节点也应该选中）
  if (data.children && data.children.length > 0 && checked.checked) {
    const allChildrenChecked = data.children.every(child => {
      return permTreeRef.value?.isChecked(child.id)
    })
    if (allChildrenChecked) {
      permTreeRef.value.setChecked(data.id, true, false)
    }
  }
}

watch(showDialog, (val) => {
  if (!val) {
    resetForm()
    isEdit.value = false
    editingRoleId.value = null
  }
})

watch(showAddDialog, (val) => {
  if (val) {
    showDialog.value = true
    isEdit.value = false
  }
})

import { watch } from 'vue'

onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>

<style scoped>
.role-management {
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

.perm-tip {
  color: #909399;
  font-size: 12px;
  margin-bottom: 8px;
}
</style>
