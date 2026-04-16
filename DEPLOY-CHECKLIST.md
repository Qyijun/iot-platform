# Linux 部署检查清单

## 部署前准备

### 1. 服务器要求
- [ ] Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- [ ] Docker 20.10+
- [ ] Docker Compose 2.0+
- [ ] 建议 2GB+ 内存
- [ ] 建议 20GB+ 磁盘空间

### 2. 域名和SSL (可选)
- [ ] 域名已购买并配置DNS
- [ ] SSL证书 (Let's Encrypt 或商业证书)
- [ ] 证书文件放到 `nginx/ssl/` 目录

### 3. 防火墙配置
```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 1883  # MQTT
sudo ufw allow 3000  # API (可选，外部访问)
sudo ufw allow 3001  # WebSocket (可选，外部访问)
sudo ufw allow 8081  # Frontend (可选，外部访问)
```

## 部署步骤

### 方式一：Docker部署 (推荐)

```bash
# 1. 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. 安装Docker Compose
sudo apt install docker-compose

# 3. 上传项目文件
scp -r iot-platform user@your-server:/home/user/

# 4. 配置环境变量
cd iot-platform
cp .env.example .env
nano .env  # 修改 JWT_SECRET 等配置

# 5. 启动服务
docker-compose up -d --build

# 6. 查看状态
docker-compose ps

# 7. 查看日志
docker-compose logs -f backend
```

### 方式二：手动部署

```bash
# 1. 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 MongoDB/MySQL/PostgreSQL (根据需求)
# SQLite 默认即可，无需安装数据库服务器

# 3. 安装 PM2 (进程管理)
sudo npm install -g pm2

# 4. 安装 Nginx
sudo apt install nginx

# 5. 配置 Nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-available/iot-platform
sudo ln -s /etc/nginx/sites-available/iot-platform /etc/nginx/sites-enabled/
sudo nginx -t

# 6. 启动后端
cd backend
npm install
pm2 start server.js --name iot-backend

# 7. 构建前端
cd ../frontend
npm install
npm run build

# 8. 配置PM2开机自启
pm2 startup
pm2 save
```

## 验证部署

### 检查服务状态
```bash
# Docker方式
docker-compose ps
docker-compose logs backend

# 手动方式
curl http://localhost:3000/api/health
pm2 status
systemctl status nginx
```

### 测试访问
- [ ] 前端: http://your-server:8081
- [ ] API: http://your-server:3000/api/health
- [ ] MQTT: nc -v localhost 1883

### 测试登录
- [ ] 使用 admin/admin123 登录
- [ ] 修改管理员密码
- [ ] 创建测试用户

## 运维命令

### Docker方式
```bash
# 重启服务
docker-compose restart

# 更新代码后重新部署
git pull
docker-compose up -d --build

# 停止服务
docker-compose down

# 查看资源使用
docker stats
```

### 手动方式
```bash
# 重启后端
pm2 restart iot-backend

# 查看日志
pm2 logs iot-backend

# 更新代码后
cd backend && git pull && npm install && pm2 restart iot-backend
cd frontend && git pull && npm install && npm run build
```

## 备份策略

### 数据库备份
```bash
# SQLite
cp data/database.sqlite data/backup_$(date +%Y%m%d).sqlite

# MySQL
mysqldump -u root -p iot_platform > backup_$(date +%Y%m%d).sql

# 设置定时备份 (crontab)
0 2 * * * /path/to/backup.sh
```

### 配置文件备份
```bash
# 备份重要配置
tar -czf config_backup.tar.gz .env nginx/ssl/ mqtt/config/
```

## 故障排查

### 常见问题

1. **端口被占用**
```bash
sudo lsof -i :3000
sudo fuser -k 3000/tcp
```

2. **权限问题**
```bash
sudo chown -R $USER:$USER .
chmod -R 755 data/ logs/
```

3. **Docker网络问题**
```bash
docker network prune
docker-compose down
docker-compose up -d
```

4. **前端404**
```bash
# 检查nginx配置
docker-compose logs nginx
# 确认dist目录存在
ls -la frontend/dist/
```

## 安全加固

- [ ] 修改默认密码
- [ ] 配置JWT_SECRET为强密码
- [ ] 启用HTTPS
- [ ] 配置防火墙
- [ ] 定期更新镜像/依赖
- [ ] 启用日志审计
- [ ] 配置备份策略

## 监控配置 (可选)

```bash
# 安装监控工具
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  prom/prometheus

# 或使用系统工具
htop
netstat -tulpn
```
