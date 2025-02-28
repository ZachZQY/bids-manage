# 解决登录后无法跳转问题

## 问题描述

部署到服务器后出现登录成功但无法正常跳转到仪表盘页面的问题，具体错误为：

```
Request URL: http://bids-manage.weweknow.com/dashboard/projects?_rsc=ak96a
Request Method: GET
Status Code: 307 Temporary Redirect
```

## 原因分析

经分析，此问题可能由以下几个原因导致：

1. **域名配置不匹配**：配置文件中使用的域名与实际访问的域名不一致（`bid_manage` vs `bids-manage`）
2. **Next.js应用路由问题**：Next.js应用的RSC (React Server Components) 请求处理不正确
3. **Nginx代理配置不完整**：缺少针对Next.js应用特有的路由和资源处理配置
4. **代理/转发设置问题**：客户端可能通过代理访问，导致请求头被修改

## 解决方案

### 1. 更新Nginx配置

我们已经更新了Nginx配置，增加了以下改进：

- 支持多个域名版本（同时支持连字符和下划线版本）
- 增加专门处理Next.js资源的location块
- 添加缓冲区和请求体大小设置
- 优化静态资源缓存

更新后的配置已应用到项目中。在服务器上需要执行以下命令应用新配置：

```bash
# 重启Nginx容器
docker-compose restart nginx

# 查看Nginx日志确认配置已生效
docker logs bid-manage-nginx
```

### 2. 检查Docker网络

确保Docker容器间网络通信正常：

```bash
# 查看网络状态
docker network ls
docker network inspect app-network
```

### 3. 检查应用日志

查看Next.js应用日志，寻找潜在错误：

```bash
docker logs bid-manage-container
```

### 4. 客户端侧解决方案

如果服务器配置正确但问题仍然存在，可能是客户端代理或缓存问题：

- 清除浏览器缓存和Cookie
- 尝试使用无痕/隐私模式访问
- 检查是否有浏览器扩展干扰请求
- 如果使用代理，尝试直接连接访问

## 进阶故障排除

如果上述方法未能解决问题，请尝试以下进阶排查：

### 检查Cookie处理

确保Nginx正确传递Cookie：

```nginx
proxy_set_header Cookie $http_cookie;
```

### 检查HTTP头

使用浏览器开发者工具或curl命令查看完整的请求和响应头：

```bash
curl -I -L http://bids-manage.weweknow.com/dashboard/projects
```

### 禁用中间件临时测试

临时修改中间件测试是否为中间件问题：

1. 创建`middleware.bak.ts`备份当前中间件
2. 简化`middleware.ts`仅保留基本重定向逻辑
3. 重新构建并部署应用
4. 测试登录跳转是否正常

### 配置Next.js应用的baseUrl

如果域名或路径有特殊要求，可以在`next.config.ts`中配置：

```typescript
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 添加基础URL配置
  basePath: '',
  // 添加资产前缀
  assetPrefix: '',
};
```

## 解决方案验证

应用以上更改后，请再次测试登录功能，验证跳转是否正常工作。如果问题仍然存在，请收集更多的错误信息，包括：

- 浏览器控制台错误
- 网络请求详情
- 应用日志
- Nginx日志

以便进一步诊断和解决问题。
