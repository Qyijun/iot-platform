const http = require('http');

const postData = JSON.stringify({ username: 'admin', password: 'admin123' });
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NzY1MTIxMzgsImV4cCI6MTc3NzExNjkzOH0.qh-8ycqm5KEp09bgC2tOPrnDwNVyPTC78PIsFePYxkc';

console.log('=== 步骤1: 测试登录 ===');
const req1 = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('登录响应:', body);
    const loginResult = JSON.parse(body);
    const newToken = loginResult.token;
    console.log('\n=== 步骤2: 用旧Token验证 ===');
    testVerify(token, '旧Token（前端用的）');
    console.log('\n=== 步骤3: 用新Token验证 ===');
    testVerify(newToken, '新Token（后端刚签发的）');
  });
});
req1.write(postData);
req1.end();

function testVerify(t, label) {
  const req2 = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/verify-token',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + t }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`${label}:`, body);
    });
  });
  req2.end();
}
