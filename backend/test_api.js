const http = require('http');

const data = JSON.stringify({ username: 'admin', password: 'admin123' });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    const result = JSON.parse(body);
    if (result.token) {
      console.log('TOKEN=' + result.token);
      
      // 获取设备列表
      const req2 = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/devices',
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer ' + result.token,
          'Content-Type': 'application/json'
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', (chunk) => { body2 += chunk; });
        res2.on('end', () => console.log('设备列表:', body2));
      });
      req2.end();
    }
  });
});

req.write(data);
req.end();
