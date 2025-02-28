# Docker部署指南

本文档提供了如何使用Docker部署投标管理系统的详细步骤，包括配置、构建和运行。

## 先决条件

- 安装Docker和Docker Compose
- 确保80和443端口未被占用（或者修改docker-compose.yml中的端口映射）

## 部署步骤

### 1. 准备项目

确保您的代码已经提交到版本控制系统，并且处于最新状态：

```bash
git add .
git commit -m "准备Docker部署"
git pull
```

### 2. 准备目录结构

确保Nginx所需的目录结构存在：

```bash
mkdir -p nginx/conf nginx/ssl nginx/www nginx/logs
```

### 3. 配置Nginx

确保`nginx/conf/bid-manage.conf`文件存在并包含正确的配置。一个基本配置如下：

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://bid-manage:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 构建Docker镜像

使用Docker Compose构建镜像：

```bash
docker-compose build
```

这个过程可能需要几分钟时间，取决于您的机器性能和网络速度。

### 5. 启动容器

构建完成后，启动容器：

```bash
docker-compose up -d
```

参数`-d`表示在后台运行容器。

### 6. 验证部署

检查容器是否正常运行：

```bash
docker-compose ps
```

所有服务状态应该显示为"running"。

### 7. 访问应用

在浏览器中访问：

```
http://localhost
```

或者服务器IP地址（如果在远程服务器上部署）。

## 常见问题排查

### 容器无法启动

检查容器日志：

```bash
docker-compose logs
```

或者查看特定服务的日志：

```bash
docker-compose logs bid-manage
docker-compose logs nginx
```

### 端口冲突

如果80或443端口已被占用，可以修改`docker-compose.yml`中的端口映射：

```yaml
ports:
  - "8080:80"  # 将主机8080端口映射到容器80端口
  - "8443:443" # 将主机8443端口映射到容器443端口
```

### 无法连接到应用

确保Nginx配置中的`proxy_pass`指向正确的服务名和端口：

```nginx
proxy_pass http://bid-manage:3000;
```

这里的`bid-manage`是Docker Compose中定义的服务名称。

## 针对性能优化

由于构建过程可能较长，以下是一些提高构建和部署效率的建议：

### 优化构建时间

1. **分步构建**：如果构建时间过长，可以将构建和启动分开执行：

```bash
# 仅构建Next.js应用
docker-compose build bid-manage

# 仅构建或拉取Nginx镜像
docker-compose build nginx

# 启动服务
docker-compose up -d
```

2. **使用构建缓存**：默认情况下Docker会使用缓存，但有时可能需要强制刷新：

```bash
# 使用缓存构建（默认）
docker-compose build

# 不使用缓存构建（全新构建，用于排查问题）
docker-compose build --no-cache
```

### 减小镜像体积

如果部署到资源有限的服务器，可以考虑优化Docker镜像大小：

1. 修改Dockerfile，使用更小的基础镜像：

```dockerfile
# 修改runner阶段，使用alpine镜像
FROM node:20-alpine AS runner
```

2. 添加.dockerignore文件忽略不必要的文件：

```
node_modules
.git
.github
.next/cache
```

## 自动持久化（远程环境）

如果您在远程服务器上部署，建议设置自动启动：

```bash
# 设置Docker服务开机自启
sudo systemctl enable docker

# 配置容器自动重启
docker-compose up -d --restart always
```

## Docker命令速查表

以下是一些常用的Docker命令，用于管理您的投标管理系统：

### 基本操作

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看日志（持续跟踪）
docker-compose logs -f

# 查看特定服务的日志
docker-compose logs -f bid-manage
docker-compose logs -f nginx
```

### 容器管理

```bash
# 停止所有容器
docker-compose stop

# 启动所有容器
docker-compose start

# 重启所有容器
docker-compose restart

# 完全移除所有容器（保留镜像）
docker-compose down

# 完全移除所有容器和所有相关镜像
docker-compose down --rmi all
```

### 镜像管理

```bash
# 查看所有镜像
docker images

# 移除未使用的镜像（清理磁盘空间）
docker image prune -a
```

### 故障排查

```bash
# 进入容器内部检查
docker-compose exec bid-manage sh
docker-compose exec nginx sh

# 检查容器资源使用情况
docker stats
```

## 多环境部署（可选）

如果需要为不同环境（开发、测试、生产）进行部署，可以使用环境变量和不同的配置文件：

1. 创建环境特定的配置文件：
   - docker-compose.dev.yml
   - docker-compose.prod.yml

2. 使用特定的配置文件启动服务：

```bash
# 开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 备份与恢复

确保定期备份您的应用数据：

```bash
# 备份数据卷（如果有）
docker run --rm --volumes-from bid-manage-container -v $(pwd):/backup alpine tar cvf /backup/data-backup.tar /app/data

# 恢复数据
docker run --rm --volumes-from bid-manage-container -v $(pwd):/backup alpine sh -c "cd / && tar xvf /backup/data-backup.tar"
```

## 更新部署

当您需要更新应用时，请按照以下步骤操作：

1. 拉取最新代码：
   ```bash
   git pull
   ```

2. 重新构建镜像：
   ```bash
   docker-compose build
   ```

3. 重启容器：
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## 注意事项

### Cookie和Authentication

由于我们在解决登录重定向问题时，对Cookie进行了特定设置，请确保：

1. 在生产环境部署时，请确认以下内容：
   - 如果使用HTTPS，请将`app/api/login/route.ts`中的所有Cookie的`secure`属性设置为`true`
   - 如果使用HTTP，应保持`secure`属性为`false`

```typescript
// 对于HTTPS环境
response.cookies.set('token', token, {
  httpOnly: true,
  secure: true,  // 使用HTTPS时设为true
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7天
});

// 对于HTTP环境
response.cookies.set('token', token, {
  httpOnly: true,
  secure: false,  // 使用HTTP时设为false
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7天
});
```

2. 确保Nginx配置中包含正确的Cookie转发设置：

```nginx
proxy_set_header Cookie $http_cookie;
proxy_pass_header Set-Cookie;
```

### 多域名和跨域

如果您计划从不同的域名访问API，请确保配置好CORS：

1. 在Next.js应用中配置CORS头部：

```typescript
// 在app/api/[...]/route.ts中
response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
response.headers.set('Access-Control-Allow-Credentials', 'true');
```

2. 在Nginx配置中添加CORS头部（作为备份）：

```nginx
location /api {
    # 其他配置...
    
    add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # 预检请求处理
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Content-Type' 'text/plain charset=UTF-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }
}
