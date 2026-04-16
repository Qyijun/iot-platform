<template>
  <div class="settings-page">
    <el-card>
      <template #header>修改密码</template>
      
      <el-form :model="passwordForm" :rules="passwordRules" ref="pwdFormRef" label-width="120px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="changePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../../stores/user'
import { useWebSocketStore } from '../../stores/websocket'

const router = useRouter()
const userStore = useUserStore()
const wsStore = useWebSocketStore()

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdFormRef = ref()
const loading = ref(false)

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
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

const changePassword = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    await axios.put('/api/auth/change-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    userStore.logout()
    wsStore.disconnect()
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '修改失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.settings-page {
  padding: 0;
}
</style>
