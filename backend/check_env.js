// 诊断脚本：检查 JWT_SECRET 配置
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('=== JWT_SECRET 诊断工具 ===\n');

// 模拟 server.js 的加载逻辑
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, envFile);
  console.log(`检查文件: ${envPath}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ 已加载配置文件: ${envFile}`);
    const content = fs.readFileSync(envPath, 'utf-8');
    console.log(`📄 文件内容:\n${content}\n`);
    break;
  } else {
    console.log(`❌ 文件不存在`);
  }
}

console.log('---');
console.log(`JWT_SECRET from process.env: ${process.env.JWT_SECRET || '(未设置)'}`);
console.log(`默认 JWT_SECRET: dev-only-secret-change-in-production`);
