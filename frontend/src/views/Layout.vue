<template>
  <el-container class="layout-container">
    <el-aside :width="sidebarCollapsed ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <el-icon size="32" color="#409EFF"><Connection /></el-icon>
        <span v-show="!sidebarCollapsed">IoT平台</span>
      </div>
      
      <div class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
        <el-icon size="18"><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
      </div>
      
      <el-menu
        :default-active="$route.path"
        :collapse="sidebarCollapsed"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        
        <!-- 设备管理子菜单 -->
        <el-sub-menu v-if="menuPerms.device" index="/device-menu">
          <template #title>
            <el-icon><Cpu /></el-icon>
            <span>设备管理</span>
          </template>
          <el-menu-item index="/devices">
            <el-icon><Monitor /></el-icon>
            <span>设备列表</span>
          </el-menu-item>
          <el-menu-item index="/groups">
            <el-icon><Folder /></el-icon>
            <span>设备分组</span>
          </el-menu-item>
          <el-menu-item index="/firmware">
            <el-icon><Upload /></el-icon>
            <span>固件管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 蓝牙配网页面 -->
        <el-menu-item v-if="menuPerms.bluetooth" index="/bluetooth">
          <el-icon><Monitor /></el-icon>
          <template #title>蓝牙配网</template>
        </el-menu-item>
        
        <!-- 用户管理子菜单 -->
        <el-sub-menu v-if="menuPerms.user" index="/user-manage">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户列表</span>
          </el-menu-item>
          <el-menu-item index="/roles">
            <el-icon><Key /></el-icon>
            <span>角色权限</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 系统设置子菜单 -->
        <el-sub-menu v-if="menuPerms.settings" index="/settings">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <!-- 基本信息 - 所有有设置菜单权限的用户可见 -->
          <el-menu-item index="/settings/basic">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
          </el-menu-item>
          <!-- 网络配置 - 仅管理员可见 -->
          <el-menu-item v-if="userStore.isAdmin" index="/settings/network">
            <el-icon><Link /></el-icon>
            <span>网络配置</span>
          </el-menu-item>
          <!-- 邮件服务 - 仅管理员可见 -->
          <el-menu-item v-if="userStore.isAdmin" index="/settings/email">
            <el-icon><Message /></el-icon>
            <span>邮件服务</span>
          </el-menu-item>
          <!-- 数据库配置 - 仅管理员可见 -->
          <el-menu-item v-if="userStore.isAdmin" index="/settings/database">
            <el-icon><Connection /></el-icon>
            <span>数据库配置</span>
          </el-menu-item>
          <!-- 操作日志 - 仅管理员可见 -->
          <el-menu-item v-if="menuPerms.settings" index="/logs">
            <el-icon><Document /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left"></div>
        
        <div class="header-right">
          <el-tag :type="wsStore.isConnected ? 'success' : 'danger'" effect="dark">
            <el-icon v-if="wsStore.isConnected"><CircleCheck /></el-icon>
            <el-icon v-else><CircleClose /></el-icon>
            {{ wsStore.isConnected ? '已连接' : '未连接' }}
          </el-tag>
          
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.displayName || userStore.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePwd">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 标签页栏 -->
      <div class="tabs-container">
        <el-tabs 
          v-model="tabsStore.activeTab" 
          type="card" 
          @tab-click="handleTabClick"
          @tab-remove="handleTabRemove"
        >
          <el-tab-pane
            v-for="tab in tabsStore.tabs"
            :key="tab.path"
            :label="tab.title"
            :name="tab.path"
            :closable="tab.closable"
          />
        </el-tabs>
        
        <el-dropdown @command="handleTabCommand" class="tabs-actions">
          <span class="tabs-actions-btn">
            <el-icon><MoreFilled /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="closeCurrent">关闭当前</el-dropdown-item>
              <el-dropdown-item command="closeOther">关闭其他</el-dropdown-item>
              <el-dropdown-item command="closeAll">关闭所有</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <el-main class="main-content">
        <router-view />
      </el-main>

      <!-- 修改密码对话框 -->
      <el-dialog v-model="pwdDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
        <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input v-model="pwdForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwdForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="pwdForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="pwdDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">确定</el-button>
        </template>
      </el-dialog>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Connection,
  Odometer,
  Cpu,
  Setting,
  User,
  UserFilled,
  Key,
  ArrowDown,
  CircleCheck,
  CircleClose,
  Monitor,
  InfoFilled,
  Link,
  Message,
  Lock,
  Fold,
  Expand,
  MoreFilled,
  HomeFilled,
  Document
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useWebSocketStore } from '../stores/websocket'
import { useTabsStore } from '../stores/tabs'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()
const wsStore = useWebSocketStore()
const tabsStore = useTabsStore()

const sidebarCollapsed = ref(false)

// 获取菜单权限
const menuPerms = computed(() => userStore.getMenuPermissions())

onMounted(() => {
  wsStore.connect()
})

onUnmounted(() => {
  wsStore.disconnect()
})

// 标签页点击
const handleTabClick = (tab) => {
  tabsStore.setActiveTab(tab.props.name)
  router.push(tab.props.name)
}

// 关闭标签
const handleTabRemove = (path) => {
  tabsStore.closeTab(path)
  // 跳转到当前激活的标签
  if (tabsStore.tabs.length > 0) {
    router.push(tabsStore.activeTab)
  } else {
    router.push('/dashboard')
  }
}

// 标签页操作
const handleTabCommand = (command) => {
  const activePath = tabsStore.activeTab
  if (command === 'closeCurrent') {
    handleTabRemove(activePath)
  } else if (command === 'closeOther') {
    tabsStore.closeOtherTabs(activePath)
  } else if (command === 'closeAll') {
    tabsStore.closeAllTabs()
    router.push('/dashboard')
  }
}

// 修改密码相关
const pwdDialogVisible = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref(null)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleChangePassword = async () => {
  try {
    await pwdFormRef.value.validate()
  } catch {
    return
  }

  pwdLoading.value = true
  try {
    await axios.put('/api/auth/change-password', {
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    pwdDialogVisible.value = false
    userStore.logout()
    wsStore.disconnect()
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '修改失败')
  } finally {
    pwdLoading.value = false
  }
}

const handleCommand = (command) => {
  if (command === 'changePwd') {
    pwdDialogVisible.value = true
    pwdFormRef.value?.resetFields()
  } else if (command === 'logout') {
    userStore.logout()
    wsStore.disconnect()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  cursor: pointer;
  color: #bfcbd9;
  transition: all 0.3s;
  border-bottom: 1px solid #1f2d3d;
}

.collapse-btn:hover {
  background: #263445;
  color: #409EFF;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #606266;
}

.tabs-container {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 16px;
  border-bottom: 1px solid #e4e7ed;
}

.tabs-container :deep(.el-tabs) {
  flex: 1;
}

.tabs-container :deep(.el-tabs__header) {
  margin: 0;
  border: none;
}

.tabs-container :deep(.el-tabs__nav) {
  border: none;
}

.tabs-container :deep(.el-tabs__item) {
  border: 1px solid #d8dce5;
  border-radius: 4px;
  margin-right: 8px;
  height: 32px;
  line-height: 30px;
}

.tabs-container :deep(.el-tabs__item.is-active) {
  background: #409EFF;
  color: #fff;
  border-color: #409EFF;
}

.tabs-container :deep(.el-tabs__item:hover) {
  color: #409EFF;
}

.tabs-container :deep(.el-tabs__item.is-active:hover) {
  color: #fff;
}

.tabs-container :deep(.el-icon-close) {
  margin-left: 6px;
}

.tabs-actions {
  margin-left: 8px;
}

.tabs-actions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
}

.tabs-actions-btn:hover {
  background: #f5f7fa;
  color: #409EFF;
}

.main-content {
  background-color: #f5f7fa;
  padding: 16px;
  overflow-y: auto;
}
</style>
