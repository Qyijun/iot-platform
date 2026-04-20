const Database = require('./database');
const bcrypt = require('bcryptjs');

const db = new Database();
db.init().then(async () => {
  const u = await db.getUserByUsername('admin');
  if (u) {
    console.log('用户名:', u.username);
    console.log('密码哈希:', u.password);
    console.log('密码长度:', u.password.length);
    
    // 测试密码验证
    const test1 = await bcrypt.compare('admin123', u.password);
    console.log('admin123 验证:', test1);
    
    const test2 = await bcrypt.compare('admin', u.password);
    console.log('admin 验证:', test2);
    
    const test3 = await bcrypt.compare('password', u.password);
    console.log('password 验证:', test3);
  } else {
    console.log('admin用户不存在');
  }
  process.exit(0);
});
