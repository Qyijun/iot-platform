const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NzY1MTI5MDQsImV4cCI6MTc3NzExNzcwNH0.APDP482aM4fpkFuYV24v3lk3pIRvH4VA1pxCnsF3TQk';

console.log('=== 测试 /api/devices 接口 ===');
const req = http.request({
  hostname: 'localhost',
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
    console.log('响应:', body);
  });
});
req.end();
