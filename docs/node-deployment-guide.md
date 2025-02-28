# 宝塔面板Node.js部署指南

本文档提供使用宝塔面板部署招标管理系统的详细步骤，特别关注解决登录后无法跳转的问题。

## 目录
1. [部署前准备](#部署前准备)
2. [项目部署步骤](#项目部署步骤)
3. [宝塔面板配置](#宝塔面板配置)
4. [解决登录重定向问题](#解决登录重定向问题)
5. [维护与更新](#维护与更新)

## 部署前准备

1. **确认服务器环境**：
   - 确保宝塔面板已安装
   - 确保已安装Node.js 18+版本
   - 建议安装PM2用于进程管理

2. **项目修改**：
   - 修改了`next.config.ts`添加生产环境配置
   - 修改了`middleware.ts`优化重定向逻辑

## 项目部署步骤

1. **获取代码**
   ```bash
   git clone <项目Git仓库URL>
   cd bids-manage
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **启动应用**
   ```bash
   # 使用PM2启动（推荐）
   pm2 start npm --name "bids-manage" -- start
   
   # 或直接启动
   npm start
   ```

## 宝塔面板配置

### 1. Node项目配置

在宝塔面板中添加Node项目：

1. 打开宝塔面板 → 点击"Node.js项目"
2. 点击"添加Node项目"
3. 填写配置:
   - **项目名称**: bids-manage
   - **端口**: 3000
   - **项目目录**: 选择项目所在目录
   - **启动选项**:
     - **运行目录**: 项目根目录
     - **项目文件**: 使用`npm`作为启动命令，后面跟上`start`参数
     - **内存限制**: 推荐1G或更高
   - **Node版本**: 选择Node 18或更高版本
   - **是否开机启动**: 勾选

4. 点击"提交"

### 2. 网站配置与反向代理

1. 打开宝塔面板 → 点击"网站"
2. 点击"添加站点"（或选择已有站点）:
   - **域名**: bids-manage.weweknow.com
   - **根目录**: 任意目录（会被反向代理覆盖）
   - 完成网站创建

3. 配置反向代理:
   - 点击网站的"设置"
   - 选择"反向代理"
   - 点击"添加反向代理"
   - 填写配置:
     - **代理名称**: bids-manage
     - **目标URL**: http://127.0.0.1:3000
     - 勾选"发送域名"
   - 点击"保存"

4. 优化Nginx配置:
   - 点击网站的"设置"
   - 选择"配置文件"
   - 在`location /`块中替换为以下配置:
   
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    proxy_cache_bypass $http_upgrade;
}

# Next.js应用的静态资源
location /_next/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# API路由
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

5. 保存配置并重启Nginx:
   - 点击"服务" → "Nginx" → "重启"

## 解决登录重定向问题

如果部署后遇到登录成功但无法跳转的问题（307重定向错误），请按以下步骤排查：

### 1. 代理头信息配置

确保Nginx正确传递了所有必要的头信息，特别是`Host`和`X-Forwarded-*`头。

### 2. 检查中间件重定向逻辑

项目已经修改了`middleware.ts`，使用`origin`构建重定向URL：

```typescript
// 获取当前完整URL的origin部分(包含协议和域名)
const origin = request.nextUrl.origin;

// 使用origin构建重定向URL
return NextResponse.redirect(new URL('/dashboard/projects', origin));
```

如果问题仍然存在，请检查以下几点：

### 3. 清除浏览器缓存

客户端浏览器可能保留了旧的缓存数据：
- 按Ctrl+F5清除缓存并强制刷新
- 或进入浏览器开发者工具→应用/Application→清除存储/Clear storage

### 4. 检查Cookie设置

确保Cookie正确设置：
- 检查Cookie的`Domain`和`Path`属性
- 确保`HttpOnly`和`Secure`设置适当

### 5. 检查域名配置

- 确认使用的域名（比如`bids-manage.weweknow.com`）在代码和配置中一致
- 如有必要，在`next.config.ts`中设置`basePath`

## 维护与更新

### 1. 更新应用

```bash
# 获取最新代码
git pull

# 安装依赖和构建
npm install
npm run build

# 重启应用
pm2 restart bids-manage
```

### 2. 查看日志

```bash
# 使用PM2查看日志
pm2 logs bids-manage

# 或通过宝塔面板查看:
# 点击"Node项目" → 选择项目 → "日志"按钮
```

### 3. 设置监控

通过宝塔面板，可以设置:
- 内存监控告警
- CPU使用率告警
- 端口监听告警

---

如有任何部署问题，请联系系统管理员或开发团队。
