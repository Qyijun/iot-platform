<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <el-icon size="48" color="#409EFF"><Connection /></el-icon>
          <h2>物联网管理平台</h2>
          <p>IoT Management Platform</p>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="账号"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <router-link to="/forgot-password">忘记密码？</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Connection } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    const res = await axios.post('/api/auth/login', form)
    userStore.setToken(res.data.token)
    userStore.setUsername(res.data.username)
    userStore.setDisplayName(res.data.displayName || res.data.username)
    userStore.setRoles(res.data.roles || [])
    userStore.setPermissions(res.data.permissions || [])
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  padding: 20px 0;
}

.login-header h2 {
  margin: 16px 0 8px;
  color: #303133;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-tips {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
}

.login-tips a {
  color: #409EFF;
  text-decoration: none;
}

.login-tips a:hover {
  text-decoration: underline;
}
</style>
