const http = require('http');

// 用户App使用的Token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NzY1MTIxMzgsImV4cCI6MTc3NzExNjkzOH0.qh-8ycqm5KEp09bgC2tOPrnDwNVyPTC78PIsFePYxkc';

console.log('=== 测试设备列表接口 ===');
console.log('Token:', token.substring(0, 50) + '...');

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/devices',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('状态码:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('响应:', body.substring(0, 500));
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

req.end();
