# 招标管理系统部署常见问题

## 目录
1. [部署相关问题](#部署相关问题)
2. [Docker相关问题](#docker相关问题)
3. [Nginx相关问题](#nginx相关问题)
4. [SSL/HTTPS相关问题](#sslhttps相关问题)
5. [性能与维护问题](#性能与维护问题)

## 部署相关问题

### Q: 执行 `./deploy.sh` 时提示 "permission denied"
**A**: 需要给脚本添加执行权限:
```bash
chmod +x deploy.sh
```

### Q: 部署脚本执行成功，但无法访问系统
**A**: 请检查以下几点:
1. 确认防火墙是否开放80/443端口
2. 确认域名是否正确解析到服务器IP
3. 检查Nginx配置文件中的域名是否与访问域名一致
4. 查看Docker容器状态: `docker-compose ps`

### Q: 系统部署后响应很慢
**A**: 请确认服务器配置是否满足要求，至少建议:
- 2核CPU
- 4GB内存
- 20GB存储空间

## Docker相关问题

### Q: 构建镜像失败，提示 "build failed"
**A**: 可能原因和解决方案:
1. 网络问题: 请确保服务器可以访问Docker Hub
2. 磁盘空间不足: 运行 `df -h` 检查空间
3. 清理Docker缓存后重试: `docker system prune -a`

### Q: 容器启动后立即退出
**A**: 查看容器日志，找出原因:
```bash
docker logs bid-manage-container
```

### Q: "port is already allocated" 错误
**A**: 端口冲突，修改 `docker-compose.yml` 中的端口映射:
```yaml
ports:
  - "8080:80"  # 修改为未被占用的端口
```

## Nginx相关问题

### Q: Nginx配置测试失败
**A**: 检查Nginx配置语法:
```bash
docker exec bid-manage-nginx nginx -t
```

### Q: 访问时显示502 Bad Gateway
**A**: 常见原因:
1. 后端应用未启动: 检查 `docker logs bid-manage-container`
2. Nginx配置错误: 检查 `proxy_pass` 指向的地址是否正确
3. 应用和Nginx无法通信: 确认它们在同一网络中

## SSL/HTTPS相关问题

### Q: SSL证书配置后，浏览器显示证书错误
**A**: 常见原因:
1. 证书与域名不匹配: 确认证书是否签发给正确的域名
2. 证书文件权限问题: `chmod 644 nginx/ssl/*.pem`
3. 证书链不完整: 确保使用了fullchain.pem而非cert.pem

### Q: 启用HTTPS后，某些资源仍通过HTTP加载
**A**: 检查应用代码中是否有硬编码的HTTP URL，修改为相对路径或HTTPS URL。

### Q: Let's Encrypt证书自动续期失败
**A**: 确保certbot可以访问80端口进行验证:
```bash
docker-compose stop nginx
certbot renew
# 更新证书文件
docker-compose start nginx
```

## 性能与维护问题

### Q: 系统运行一段时间后变慢
**A**: 可能是Docker容器日志或数据积累导致:
1. 清理Docker日志:
   ```bash
   docker system prune
   ```
2. 考虑添加日志轮转:
   ```bash
   # 在docker-compose.yml中添加
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

### Q: 如何备份系统数据?
**A**: 可以通过以下方式备份:
1. 备份Docker卷(如果使用了卷存储数据):
   ```bash
   docker run --rm -v bids-manage_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
   ```

### Q: 如何安全地更新系统?
**A**: 推荐的更新流程:
1. 在测试环境验证新版本
2. 备份生产数据
3. 在生产环境执行更新:
   ```bash
   git pull
   docker-compose down
   docker-compose up -d --build
   ```
4. 验证更新是否成功

---

如有任何其他问题，请联系系统管理员或开发团队。
