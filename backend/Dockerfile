# 基础镜像
FROM node:18-alpine

WORKDIR /app

# 安装构建工具和依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 重新编译原生模块 (sqlite3等)
RUN npm rebuild

# 复制源码
COPY . .

# 创建必要的目录
RUN mkdir -p /data /logs firmware

# 暴露端口
EXPOSE 3000 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动命令
CMD ["node", "server.js"]
