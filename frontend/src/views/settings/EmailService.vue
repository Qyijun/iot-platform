<template>
  <div class="settings-page">
    <el-card>
      <template #header>邮件服务配置</template>
      
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

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

const savingSmtp = ref(false)

onMounted(() => {
  loadSmtpConfig()
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
</script>

<style scoped>
.settings-page {
  padding: 0;
}
</style>
