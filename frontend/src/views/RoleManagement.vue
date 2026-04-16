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
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑角色' : '新建角色'" width="650px">
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
          <div class="perm-tree-container">
            <el-tree
              ref="permTreeRef"
              :data="permTreeData"
              :props="{ label: 'name', children: 'children', disabled: 'noCheckbox', isLeaf: 'isLeaf' }"
              node-key="menuId"
              show-checkbox
              default-expand-all
              :check-strictly="false"
              :expand-on-click-node="false"
              @check="handleCheckChange"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <!-- 一级菜单：设备管理 -->
                  <span v-if="data.level === 1" class="level1-node">
                    <span>{{ node.label }}</span>
                  </span>
                  <!-- 二级菜单：设备列表、设备分组、固件管理等（无复选框） -->
                  <span v-else-if="data.level === 2" class="level2-node no-checkbox">
                    <span>{{ node.label }}</span>
                  </span>
                  <!-- 三级：具体权限 -->
                  <span v-else class="level3-node">
                    <span>{{ node.label }}</span>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
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
    // 为每个节点添加层级信息
    const addLevel = (nodes, level) => {
      nodes.forEach(node => {
        node.level = level
        // 二级菜单节点（isMenu: true）禁用复选框
        if (node.isMenu) {
          node.noCheckbox = true
        }
        if (node.children && node.children.length > 0) {
          addLevel(node.children, level + 1)
        }
      })
    }
    addLevel(res.data, 1)
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
    // 获取需要选中的节点ID列表
    const keysToCheck = []
    const rolePerms = role.permissions || []
    
    // 遍历所有节点
    const traverseNodes = (nodes) => {
      nodes.forEach(node => {
        if (node.level === 3 && node.code) {
          // 三级权限节点：如果角色拥有该权限则选中
          if (rolePerms.includes(node.code) && node.id) {
            keysToCheck.push(node.id)
          }
        } else if (node.level === 2 && node.children) {
          // 二级菜单节点：检查是否所有子权限都被选中
          const allChildrenCodes = []
          node.children.forEach(child => {
            if (child.code) allChildrenCodes.push(child.code)
          })
          const allSelected = allChildrenCodes.every(code => rolePerms.includes(code))
          if (allSelected) {
            keysToCheck.push(node.menuId)
          }
        } else if (node.level === 1 && node.children) {
          // 一级菜单节点：检查是否所有子菜单都被选中
          let allSubmenusSelected = true
          node.children.forEach(submenu => {
            if (submenu.children && submenu.children.length > 0) {
              const childCodes = submenu.children.map(c => c.code)
              if (!childCodes.every(code => rolePerms.includes(code))) {
                allSubmenusSelected = false
              }
            } else {
              // 没有子权限的菜单（如固件管理、蓝牙配网）
              // 检查是否有对应的权限被选中
            }
          })
          if (allSubmenusSelected) {
            keysToCheck.push(node.menuId)
          }
        }
      })
    }
    
    traverseNodes(permTreeData.value)
    permTreeRef.value?.setCheckedKeys(keysToCheck)
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
    // 获取选中的节点
    const checkedNodes = permTreeRef.value?.getCheckedNodes(false, false) || []
    const checkedKeys = permTreeRef.value?.getCheckedKeys(false) || []
    
    // 收集所有需要保存的权限ID
    const permissionIds = new Set()
    
    // 遍历所有选中的节点
    checkedNodes.forEach(node => {
      // 一级菜单节点：添加所有子权限
      if (node.level === 1 && node.children) {
        const collectPerms = (children) => {
          children.forEach(child => {
            if (child.id && !child.menuId) {
              permissionIds.add(child.id)
            }
            if (child.children) collectPerms(child.children)
          })
        }
        collectPerms(node.children)
      }
      // 二级菜单节点（带children的）：添加所有子权限
      else if (node.level === 2 && node.children && node.children.length > 0) {
        node.children.forEach(child => {
          if (child.id) permissionIds.add(child.id)
        })
      }
      // 三级权限节点
      else if (node.id && !node.menuId) {
        permissionIds.add(node.id)
      }
    })
    
    // 也检查直接勾选的keys
    const findNodeByKey = (nodes, key) => {
      for (const node of nodes) {
        if (node.menuId === key || node.id === key) return node
        if (node.children) {
          const found = findNodeByKey(node.children, key)
          if (found) return found
        }
      }
      return null
    }
    
    checkedKeys.forEach(key => {
      const node = findNodeByKey(permTreeData.value, key)
      if (node && node.id && !node.menuId) {
        permissionIds.add(node.id)
      }
    })
    
    const permissionIdsArray = Array.from(permissionIds)
    
    if (isEdit.value) {
      await axios.put(`/api/admin/roles/${editingRoleId.value}`, {
        name: form.name,
        description: form.description,
        permissionIds: permissionIdsArray
      })
    } else {
      await axios.post('/api/admin/roles', {
        code: form.code,
        name: form.name,
        description: form.description,
        permissionIds: permissionIdsArray
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
  
  if (data.level === 1 && data.children) {
    // 一级菜单：勾选/取消所有二级菜单和三级权限
    const allChildKeys = []
    const collectKeys = (nodes) => {
      nodes.forEach(node => {
        if (node.menuId) allChildKeys.push(node.menuId)
        if (node.id) allChildKeys.push(node.id)
        if (node.children) collectKeys(node.children)
      })
    }
    collectKeys(data.children)
    
    if (checked.checked) {
      permTreeRef.value.setChecked(allChildKeys, true, false)
    } else {
      permTreeRef.value.setChecked(allChildKeys, false, false)
    }
  } else if (data.level === 2 && data.children) {
    // 二级菜单：勾选/取消所有三级权限
    const childIds = []
    data.children.forEach(child => {
      if (child.id) childIds.push(child.id)
    })
    
    if (checked.checked) {
      permTreeRef.value.setChecked(childIds, true, false)
    } else {
      permTreeRef.value.setChecked(childIds, false, false)
    }
  }
  
  // 同步父节点状态
  syncParentCheckState(data)
}

// 同步父节点选中状态
const syncParentCheckState = (data) => {
  if (!permTreeRef.value) return
  
  // 找到当前节点的父节点
  const findParent = (nodes, targetKey, parent = null) => {
    for (const node of nodes) {
      if (node.menuId === targetKey || node.id === targetKey) {
        return parent
      }
      if (node.children) {
        const found = findParent(node.children, targetKey, node)
        if (found !== undefined) return found
      }
    }
    return undefined
  }
  
  // 获取节点树
  const treeData = permTreeRef.value?.data || []
  
  // 如果当前是三级节点，检查二级父节点
  if (data.level === 3) {
    // 找到父节点（只能是二级菜单）
    const findLevel2Parent = (nodes, targetKey) => {
      for (const node of nodes) {
        if (node.children) {
          for (const child of node.children) {
            if (child.id === targetKey || child.menuId === targetKey) {
              return node
            }
          }
          const found = findLevel2Parent(node.children, targetKey)
          if (found) return found
        }
      }
      return null
    }
    
    const parent2 = findLevel2Parent(treeData, data.id || data.menuId)
    if (parent2 && parent2.children) {
      const allChildrenSelected = parent2.children.every(child => {
        return permTreeRef.value?.isChecked(child.id)
      })
      if (allChildrenSelected) {
        permTreeRef.value.setChecked(parent2.menuId, true, false)
      }
    }
  }
  
  // 如果当前是二级节点，检查一级父节点
  if (data.level === 2) {
    const findLevel1Parent = (nodes, targetKey) => {
      for (const node of nodes) {
        if (node.menuId === targetKey) return node
        if (node.children) {
          const found = findLevel1Parent(node.children, targetKey)
          if (found) return found
        }
      }
      return null
    }
    
    const parent1 = findLevel1Parent(treeData, data.menuId)
    if (parent1 && parent1.children) {
      const allSubmenusSelected = parent1.children.every(submenu => {
        // 如果二级菜单有子权限，检查所有子权限是否选中
        if (submenu.children && submenu.children.length > 0) {
          return submenu.children.every(child => permTreeRef.value?.isChecked(child.id))
        }
        return true
      })
      if (allSubmenusSelected) {
        permTreeRef.value.setChecked(parent1.menuId, true, false)
      }
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
  margin-bottom: 10px;
}

.perm-tree-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background: #fff;
}

.perm-tree-container::-webkit-scrollbar {
  width: 10px;
}

.perm-tree-container::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 5px;
}

.perm-tree-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 5px;
}

.perm-tree-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 0;
}

.level1-node {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.level2-node {
  font-weight: 500;
  color: #606266;
  font-size: 13px;
}

/* 隐藏二级菜单的复选框 */
:deep(.el-tree-node--level-2 > .el-tree-node__content > .el-checkbox) {
  display: none;
}
:deep(.el-tree-node--level-2 > .el-tree-node__content) {
  padding-left: 5px !important;
}

.level3-node {
  color: #909399;
  font-size: 12px;
}

.level3-node:hover {
  color: #606266;
}

:deep(.el-tree-node__content) {
  height: 36px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

:deep(.el-tree-node__children .el-tree-node__content) {
  height: 34px;
}

:deep(.el-tree-node__children .el-tree-node__children .el-tree-node__content) {
  height: 32px;
}
</style>
