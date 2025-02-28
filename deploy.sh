#!/bin/bash

# 脚本用于在生产服务器上快速部署应用

# 确保目录存在
mkdir -p nginx/ssl nginx/www nginx/logs

# 停止并删除现有容器
docker-compose down

# 拉取最新代码（如果在服务器上使用Git）
# git pull origin main

# 构建和启动容器
docker-compose up -d --build

# 显示容器状态
docker-compose ps

echo "部署完成！应用现在应该可以通过 http://bid_manage.weweknow.com 访问"
echo ""
echo "如果您想启用HTTPS，请按照以下步骤操作："
echo "1. 获取SSL证书并放入 ./nginx/ssl 目录"
echo "2. 编辑 ./nginx/conf/bid-manage.conf 文件，取消注释HTTPS部分"
echo "3. 重新部署: ./deploy.sh"
