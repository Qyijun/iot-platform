<template>
  <div class="settings-page">
    <el-card>
      <template #header>系统设置</template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="运行环境">Docker</el-descriptions-item>
            <el-descriptions-item label="数据库">SQLite</el-descriptions-item>
            <el-descriptions-item label="MQTT">Mosquitto</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="网络配置" name="network">
          <el-alert
            title="公网访问配置"
            description="如需通过公网访问，请配置DDNS和端口映射，或使用frp内网穿透。"
            type="info"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <el-form label-width="120px">
            <el-form-item label="MQTT服务器">
              <el-input v-model="config.mqttServer" placeholder="192.168.1.100" />
            </el-form-item>
            <el-form-item label="MQTT端口">
              <el-input-number v-model="config.mqttPort" :min="1" :max="65535" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="邮箱配置" name="email" v-if="!userStore.isAdmin">
          <el-alert
            title="忘记密码邮箱配置"
            description="请设置您的接收验证码邮箱，忘记密码时验证码将发送到此邮箱。"
            type="info"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-width="120px">
            <el-form-item label="邮箱地址" prop="email">
              <el-input 
                v-model="emailForm.email" 
                placeholder="请输入邮箱地址"
                clearable
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingEmail" @click="saveEmail">
                保存邮箱
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="邮件服务" name="smtp" v-if="userStore.isAdmin">
          <el-alert
            title="SMTP邮件配置"
            description="配置SMTP服务器信息，用于发送验证码邮件。支持QQ邮箱、163邮箱、企业邮箱等。"
            type="info"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <el-form :model="smtpForm" :rules="smtpRules" ref="smtpFormRef" label-width="120px">
            <el-form-item label="SMTP服务器" prop="host">
              <el-input v-model="smtpForm.host" placeholder="smtp.qq.com" />
            </el-form-item>
            <el-form-item label="SMTP端口" prop="port">
              <el-input-number v-model="smtpForm.port" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="加密方式">
              <el-switch v-model="smtpForm.secure" active-text="SSL/TLS" inactive-text="普通" />
            </el-form-item>
            <el-form-item label="邮箱账号" prop="user">
              <el-input v-model="smtpForm.user" placeholder="your-email@qq.com" />
            </el-form-item>
            <el-form-item label="授权码" prop="pass">
              <el-input v-model="smtpForm.pass" type="password" show-password placeholder="邮箱授权码（非登录密码）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingSmtp" @click="saveSmtpConfig">
                保存配置
              </el-button>
              <el-button @click="testSmtpConnection">测试连接</el-button>
            </el-form-item>
          </el-form>
          
          <el-divider content-position="left">SMTP配置说明</el-divider>
          <el-alert type="warning" :closable="false">
            <template #title>
              <strong>QQ邮箱配置方法：</strong>
            </template>
            <template #default>
              <ol style="margin: 8px 0; padding-left: 20px;">
                <li>登录 <a href="https://mail.qq.com" target="_blank">QQ邮箱</a></li>
                <li>设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务</li>
                <li>开启 "SMTP服务" → 生成授权码</li>
                <li>将授权码填入上方"授权码"输入框</li>
              </ol>
            </template>
          </el-alert>
          
          <el-divider content-position="left">用户邮箱配置</el-divider>
          <el-alert
            title="用户邮箱设置"
            description="每个用户需要在此设置自己的接收验证码邮箱。"
            type="info"
            show-icon
            style="margin-top: 16px;"
          />
        </el-tab-pane>
        
        <el-tab-pane label="修改密码" name="password">
          <el-form :model="passwordForm" :rules="passwordRules" ref="pwdFormRef" label-width="120px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Message } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const route = useRoute()

// 获取设置相关按钮权限
const btnPerms = computed(() => userStore.getButtonPermissions('settings'))

const activeTab = ref('basic')

// 根据路由设置激活的标签页
watch(() => route.path, (path) => {
  if (path.includes('/settings/network')) {
    activeTab.value = 'network'
  } else if (path.includes('/settings/email')) {
    activeTab.value = 'smtp'
  } else if (path.includes('/settings/password')) {
    activeTab.value = 'password'
  } else {
    activeTab.value = 'basic'
  }
}, { immediate: true })

const config = ref({
  mqttServer: '192.168.1.100',
  mqttPort: 1883
})

// 用户邮箱配置
const emailFormRef = ref()
const emailForm = reactive({
  email: ''
})

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// SMTP配置
const smtpFormRef = ref()
const smtpForm = reactive({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  user: '',
  pass: ''
})

const smtpRules = {
  host: [{ required: true, message: '请输入SMTP服务器', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  user: [{ required: true, message: '请输入邮箱账号', trigger: 'blur' }],
  pass: [{ required: true, message: '请输入授权码', trigger: 'blur' }]
}

// 密码修改
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdFormRef = ref()

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const savingEmail = ref(false)
const savingSmtp = ref(false)

onMounted(async () => {
  // 获取当前用户信息（含邮箱）
  try {
    const res = await axios.get('/api/auth/me')
    if (res.data.email) {
      emailForm.email = res.data.email
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
  
  // 管理员加载SMTP配置
  if (userStore.isAdmin) {
    loadSmtpConfig()
  }
})

const loadSmtpConfig = async () => {
  try {
    const res = await axios.get('/api/admin/email-config')
    if (res.data.host) {
      smtpForm.host = res.data.host
      smtpForm.port = res.data.port
      smtpForm.user = res.data.user
      smtpForm.pass = res.data.pass || ''
      smtpForm.secure = res.data.secure
    }
  } catch (err) {
    console.error('加载SMTP配置失败:', err)
  }
}

const saveEmail = async () => {
  const valid = await emailFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  savingEmail.value = true
  try {
    await axios.put('/api/auth/email', { email: emailForm.email })
    ElMessage.success('邮箱保存成功')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    savingEmail.value = false
  }
}

const saveSmtpConfig = async () => {
  const valid = await smtpFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  savingSmtp.value = true
  try {
    await axios.put('/api/admin/email-config', smtpForm)
    ElMessage.success('邮件配置保存成功')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    savingSmtp.value = false
  }
}

const testSmtpConnection = async () => {
  if (!smtpForm.user || !smtpForm.pass) {
    ElMessage.warning('请先填写邮箱账号和授权码')
    return
  }
  
  // 保存配置后测试
  await saveSmtpConfig()
  ElMessage.info('配置已保存，请到"用户邮箱配置"中设置自己的邮箱，然后测试发送验证码')
}

const changePassword = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await axios.put('/api/auth/change-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '修改密码失败')
  }
}
</script>
