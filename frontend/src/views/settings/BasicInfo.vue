<template>
  <div class="settings-page">
    <el-card>
      <template #header>基本信息</template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
        <el-descriptions-item label="运行环境">Docker</el-descriptions-item>
        <el-descriptions-item label="数据库">SQLite</el-descriptions-item>
        <el-descriptions-item label="MQTT">Mosquitto</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 0;
}
</style>
