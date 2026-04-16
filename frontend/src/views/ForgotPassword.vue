<template>
  <div class="forgot-password">
    <div class="forgot-container">
      <h2>忘记密码</h2>
      <p class="subtitle">输入用户名，验证码将发送到您配置的邮箱</p>
      
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit">
        <!-- 第一步：输入用户名 -->
        <template v-if="step === 1">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>
          <el-button type="primary" size="large" :loading="sending" @click="sendCode" style="width: 100%">
            {{ sending ? '发送中...' : '发送验证码' }}
          </el-button>
        </template>
        
        <!-- 第二步：输入验证码和新密码 -->
        <template v-else-if="step === 2">
          <div class="email-tip">
            <el-icon><Message /></el-icon>
            <span>验证码已发送至：<strong>{{ form.emailHint }}</strong></span>
          </div>
          
          <el-form-item prop="code">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              size="large"
              prefix-icon="Key"
              maxlength="6"
            />
          </el-form-item>
          
          <el-form-item prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请确认新密码"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-button type="primary" size="large" :loading="resetting" @click="resetPassword" style="width: 100%">
            {{ resetting ? '重置中...' : '重置密码' }}
          </el-button>
          
          <el-button text @click="step = 1" style="width: 100%; margin-top: 10px">
            返回
          </el-button>
        </template>
      </el-form>
      
      <div class="back-login">
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Key, Warning, Message } from '@element-plus/icons-vue'
import axios from 'axios'

const formRef = ref(null)
const step = ref(1)
const sending = ref(false)
const resetting = ref(false)

const form = reactive({
  username: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
  emailHint: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
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

const sendCode = async () => {
  if (!form.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  
  sending.value = true
  try {
    const res = await axios.post('/api/auth/send-code', { username: form.username })
    ElMessage.success(res.data.message)
    
    // 显示邮箱提示
    if (res.data.email_hint) {
      form.emailHint = res.data.email_hint
    }
    
    step.value = 2
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '发送失败')
  } finally {
    sending.value = false
  }
}

const resetPassword = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  
  resetting.value = true
  try {
    await axios.post('/api/auth/reset-password', {
      username: form.username,
      code: form.code,
      newPassword: form.newPassword
    })
    ElMessage.success('密码重置成功！')
    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '重置失败')
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.forgot-password {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.forgot-container {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h2 {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 14px;
}

.email-tip {
  background: #e8f4fd;
  border: 1px solid #409EFF;
  border-radius: 6px;
  padding: 10px 15px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #409EFF;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-login {
  text-align: center;
  margin-top: 20px;
}

.back-login a {
  color: #667eea;
  text-decoration: none;
}

.back-login a:hover {
  text-decoration: underline;
}
</style>
