const http = require('http');

// 先登录获取token
const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    const result = JSON.parse(body);
    if (result.token) {
      console.log('=== 登录成功 ===\n');
      
      // 获取设备列表
      const req2 = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/devices',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + result.token, 'Content-Type': 'application/json' }
      }, (res2) => {
        let body2 = '';
        res2.on('data', (chunk) => { body2 += chunk; });
        res2.on('end', () => {
          console.log('=== 设备列表 ===');
          const devices = JSON.parse(body2);
          console.log('设备数量:', devices.length);
          console.log('数据:', JSON.stringify(devices, null, 2));
          
          // 尝试创建设备
          const createData = JSON.stringify({
            name: '测试设备-App',
            type: 'ESP32',
            location: '测试位置'
          });
          
          const req3 = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/devices',
            method: 'POST',
            headers: { 
              'Authorization': 'Bearer ' + result.token,
              'Content-Type': 'application/json',
              'Content-Length': createData.length
            }
          }, (res3) => {
            let body3 = '';
            res3.on('data', (chunk) => { body3 += chunk; });
            res3.on('end', () => {
              console.log('\n=== 创建设备 ===');
              console.log('状态:', res3.statusCode);
              console.log('响应:', body3);
            });
          });
          req3.write(createData);
          req3.end();
        });
      });
      req2.end();
    } else {
      console.log('登录失败:', body);
    }
  });
});

req.write(loginData);
req.end();
