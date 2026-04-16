import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// 菜单权限定义（与后端 PERMISSIONS 对应）
export const MENU_PERMISSIONS = {
  // 菜单级别权限
  MENU_DEVICE: 'menu:device',      // 设备管理菜单
  MENU_BLUETOOTH: 'menu:bluetooth', // 蓝牙配网页面
  MENU_USER: 'menu:user',          // 用户管理菜单
  MENU_ROLE: 'menu:role',          // 角色权限菜单
  MENU_SETTINGS: 'menu:settings',   // 系统设置菜单
}

// 按钮级别权限
export const BUTTON_PERMISSIONS = {
  // 设备权限
  DEVICE_VIEW: 'device:view',
  DEVICE_ADD: 'device:add',
  DEVICE_EDIT: 'device:edit',
  DEVICE_DELETE: 'device:delete',
  DEVICE_CONTROL: 'device:control',
  // 分组权限
  GROUP_VIEW: 'group:view',
  GROUP_ADD: 'group:add',
  GROUP_EDIT: 'group:edit',
  GROUP_DELETE: 'group:delete',
  // 固件权限
  FIRMWARE_VIEW: 'firmware:view',
  FIRMWARE_UPLOAD: 'firmware:upload',
  FIRMWARE_DOWNLOAD: 'firmware:download',
  FIRMWARE_DELETE: 'firmware:delete',
  FIRMWARE_UPGRADE: 'firmware:upgrade',
  // 蓝牙权限
  BLUETOOTH_VIEW: 'bluetooth:view',
  // 用户权限
  USER_VIEW: 'user:view',
  USER_ADD: 'user:add',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_ROLE: 'user:role',
  // 角色权限
  ROLE_VIEW: 'role:view',
  ROLE_ADD: 'role:add',
  ROLE_EDIT: 'role:edit',
  ROLE_DELETE: 'role:delete',
  ROLE_PERMISSION: 'role:permission',
  // 日志权限
  LOG_VIEW: 'log:view',
  // 系统设置权限
  SYSTEM_VIEW: 'system:view',
  SETTINGS_BASIC: 'settings:basic',
  SETTINGS_NETWORK: 'settings:network',
  SETTINGS_EMAIL: 'settings:email',
  SETTINGS_PASSWORD: 'settings:password',
  SETTINGS_DATABASE: 'settings:database',
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const displayName = ref(localStorage.getItem('displayName') || '')
  const roles = ref(JSON.parse(localStorage.getItem('roles') || '[]'))
  const permissions = ref(JSON.parse(localStorage.getItem('permissions') || '[]'))
  
  const isLoggedIn = computed(() => !!token.value)
  
  // 是否为管理员（拥有admin角色）
  const isAdmin = computed(() => roles.value.some(r => r.code === 'admin'))
  
  // 是否有某个权限
  const hasPermission = (code) => {
    return computed(() => permissions.value.includes(code))
  }
  
  // 同步检查是否有权限（用于v-if）
  const hasPermissionSync = (code) => {
    return permissions.value.includes(code)
  }
  
  // 检查是否拥有任一权限
  const hasAnyPermission = (codes) => {
    return codes.some(code => permissions.value.includes(code))
  }
  
  // 检查是否拥有所有权限
  const hasAllPermissions = (codes) => {
    return codes.every(code => permissions.value.includes(code))
  }
  
  // 获取菜单权限（根据用户角色确定可见菜单）
  const getMenuPermissions = () => {
    // 管理员看到所有菜单
    if (isAdmin.value) {
      return {
        device: true,
        bluetooth: true,
        user: true,
        role: true,
        settings: true
      }
    }
    
    // 根据实际权限码判断
    const hasDevicePerms = hasAnyPermission([
      'device:view', 'device:add', 'device:edit', 'device:delete', 'device:control',
      'group:view', 'group:add', 'group:edit', 'group:delete',
      'firmware:view', 'firmware:upload', 'firmware:download', 'firmware:delete',
      'bluetooth:view'
    ])
    
    return {
      device: hasDevicePerms,
      bluetooth: hasPermissionSync('bluetooth:view'),
      user: hasAnyPermission(['user:view', 'user:add', 'user:edit', 'user:delete', 'user:role']),
      role: hasPermissionSync('role:view'),
      settings: hasPermissionSync('system:view')
    }
  }
  
  // 获取按钮权限
  const getButtonPermissions = (type) => {
    if (isAdmin.value) {
      return { view: true, add: true, edit: true, delete: true, control: true, role: true, move: true, clear: true, upload: true, download: true, upgrade: true }
    }

    switch (type) {
      case 'device':
        return {
          view: permissions.value.includes('device:view'),
          add: permissions.value.includes('device:add'),
          edit: permissions.value.includes('device:edit'),
          delete: permissions.value.includes('device:delete'),
          control: permissions.value.includes('device:control')
        }
      case 'group':
        return {
          view: permissions.value.includes('group:view'),
          add: permissions.value.includes('group:add'),
          edit: permissions.value.includes('group:edit'),
          delete: permissions.value.includes('group:delete'),
          deviceAdd: permissions.value.includes('group:device:add'),
          deviceRemove: permissions.value.includes('group:device:remove'),
          deviceMove: permissions.value.includes('group:device:move'),
          deviceClear: permissions.value.includes('group:device:clear')
        }
      case 'firmware':
        return {
          view: permissions.value.includes('firmware:view'),
          upload: permissions.value.includes('firmware:upload'),
          download: permissions.value.includes('firmware:download'),
          delete: permissions.value.includes('firmware:delete'),
          upgrade: permissions.value.includes('firmware:upgrade')
        }
      case 'bluetooth':
        return {
          view: permissions.value.includes('bluetooth:view')
        }
      case 'user':
        return {
          view: permissions.value.includes('user:view'),
          add: permissions.value.includes('user:add'),
          edit: permissions.value.includes('user:edit'),
          delete: permissions.value.includes('user:delete'),
          role: permissions.value.includes('user:role')
        }
      case 'role':
        return {
          add: permissions.value.includes('role:add'),
          edit: permissions.value.includes('role:edit'),
          delete: permissions.value.includes('role:delete'),
          permission: permissions.value.includes('role:permission')
        }
      case 'log':
        return {
          view: permissions.value.includes('log:view')
        }
      default:
        return {}
    }
  }
  
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }
  
  const setUsername = (name) => {
    username.value = name
    localStorage.setItem('username', name)
  }

  const setDisplayName = (name) => {
    displayName.value = name
    localStorage.setItem('displayName', name)
  }
  
  const setRoles = (newRoles) => {
    roles.value = newRoles
    localStorage.setItem('roles', JSON.stringify(newRoles))
  }
  
  const setPermissions = (newPermissions) => {
    permissions.value = newPermissions
    localStorage.setItem('permissions', JSON.stringify(newPermissions))
  }
  
  const logout = () => {
    token.value = ''
    username.value = ''
    displayName.value = ''
    roles.value = []
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('displayName')
    localStorage.removeItem('roles')
    localStorage.removeItem('permissions')
    delete axios.defaults.headers.common['Authorization']
  }
  
  // 初始化axios header
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }
  
  return {
    token,
    username,
    displayName,
    roles,
    permissions,
    isLoggedIn,
    isAdmin,
    hasPermission,
    hasPermissionSync,
    hasAnyPermission,
    hasAllPermissions,
    getMenuPermissions,
    getButtonPermissions,
    setToken,
    setUsername,
    setDisplayName,
    setRoles,
    setPermissions,
    logout
  }
})
