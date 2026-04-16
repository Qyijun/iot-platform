@echo off
cd /d %~dp0
echo 启动物联网平台...
docker-compose up -d
echo.
echo 启动完成！
echo 请访问: http://localhost
echo API服务: http://localhost:3000
echo.
pause