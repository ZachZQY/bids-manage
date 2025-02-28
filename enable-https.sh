#!/bin/bash

# 脚本用于启用HTTPS访问

# 检查SSL证书是否存在
if [ ! -f "./nginx/ssl/fullchain.pem" ] || [ ! -f "./nginx/ssl/privkey.pem" ]; then
  echo "错误: SSL证书文件不存在。"
  echo "请确保以下文件已放入 ./nginx/ssl 目录:"
  echo "  - fullchain.pem"
  echo "  - privkey.pem"
  exit 1
fi

# 取消注释Nginx配置文件中的HTTPS部分
echo "修改Nginx配置..."
sed -i.bak 's/# server {/server {/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     listen 443 ssl;/    listen 443 ssl;/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     server_name/    server_name/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     ssl_certificate/    ssl_certificate/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     ssl_certificate_key/    ssl_certificate_key/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     ssl_protocols/    ssl_protocols/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     ssl_prefer_server_ciphers/    ssl_prefer_server_ciphers/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     ssl_ciphers/    ssl_ciphers/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     location/    location/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#         proxy_pass/        proxy_pass/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#         proxy_http_version/        proxy_http_version/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#         proxy_set_header/        proxy_set_header/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/#     }/    }/' ./nginx/conf/bid-manage.conf
sed -i.bak 's/# }/}/' ./nginx/conf/bid-manage.conf

echo "是否要启用HTTP自动跳转到HTTPS? (y/n)"
read answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  sed -i.bak 's/# return 301 https/return 301 https/' ./nginx/conf/bid-manage.conf
  echo "已启用HTTP到HTTPS的自动跳转"
else
  echo "保持HTTP和HTTPS并行访问"
fi

# 重启Nginx容器
echo "重启Nginx容器..."
docker-compose restart nginx

echo "HTTPS已成功启用!"
echo "您的应用现在可以通过以下方式访问:"
echo "- https://bid_manage.weweknow.com"
if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
  echo "- http://bid_manage.weweknow.com"
fi
