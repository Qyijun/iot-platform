const jwt = require('jsonwebtoken');

// 用户App使用的Token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NzY1MTIxMzgsImV4cCI6MTc3NzExNjkzOH0.qh-8ycqm5KEp09bgC2tOPrnDwNVyPTC78PIsFePYxkc';

console.log('=== 验证用户App的Token ===');
console.log('JWT_SECRET: dev-secret-key-12345');
console.log('Token:', token.substring(0, 50) + '...');
console.log('\nPayload:', JSON.stringify(jwt.decode(token)));

try {
  const decoded = jwt.verify(token, 'dev-secret-key-12345');
  console.log('\n✅ 验证成功:', JSON.stringify(decoded));
} catch (e) {
  console.log('\n❌ 验证失败:', e.message);
}
