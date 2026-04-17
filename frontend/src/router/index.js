import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useTabsStore } from '../stores/tabs'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/Devices.vue'),
        meta: { title: '设备管理' }
      },
      {
        path: 'groups',
        name: 'DeviceGroups',
        component: () => import('../views/DeviceGroups.vue'),
        meta: { title: '设备分组' }
      },
      {
        path: 'devices/:id',
        name: 'DeviceDetail',
        component: () => import('../views/DeviceDetail.vue'),
        meta: { title: '设备详情' }
      },
      {
        path: 'bluetooth',
        name: 'Bluetooth',
        component: () => import('../views/Bluetooth.vue'),
        meta: { title: '蓝牙配网' }
      },
      {
        path: 'firmware',
        name: 'Firmware',
        component: () => import('../views/Firmware.vue'),
        meta: { title: '固件管理' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'roles',
        name: 'RoleManagement',
        component: () => import('../views/RoleManagement.vue'),
        meta: { title: '角色权限' }
      },
      {
        path: 'settings/basic',
        name: 'SettingsBasic',
        component: () => import('../views/settings/BasicInfo.vue'),
        meta: { title: '基本信息' }
      },
      {
        path: 'settings/network',
        name: 'SettingsNetwork',
        component: () => import('../views/settings/NetworkConfig.vue'),
        meta: { title: '网络配置' }
      },
      {
        path: 'settings/email',
        name: 'SettingsEmail',
        component: () => import('../views/settings/EmailService.vue'),
        meta: { title: '邮件服务' }
      },
      {
        path: 'settings/password',
        name: 'SettingsPassword',
        component: () => import('../views/settings/ChangePassword.vue'),
        meta: { title: '修改密码' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('../views/OperationLogs.vue'),
        meta: { title: '操作日志' }
      },
      {
        path: 'settings/database',
        name: 'SettingsDatabase',
        component: () => import('../views/settings/DatabaseConfig.vue'),
        meta: { title: '数据库配置' }
      },
      {
        path: 'settings/server',
        name: 'SettingsServer',
        component: () => import('../views/Settings.vue'),
        meta: { title: '服务器配置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const tabsStore = useTabsStore()
  
  if (!to.meta.public && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    // 非公开页面自动添加到标签页
    if (!to.meta.public) {
      tabsStore.addTab(to)
    }
    next()
  }
})

export default router
