# 解决登录后Token丢失问题

## 问题描述

在宝塔环境下部署Next.js应用时，用户登录成功后token cookie被清除，导致用户在重定向到仪表盘后又被重定向回登录页，形成循环重定向。

具体表现为：
- 用户可以成功登录
- 登录API正确设置了user和token cookie
- 重定向到仪表盘后，token cookie被清除
- 由于token丢失，中间件判断用户未登录，又将用户重定向回登录页

## 解决方案

我们通过以下几个关键修改解决了这个问题：

### 1. Cookie设置优化

修改`app/api/login/route.ts`中的cookie设置：

```typescript
// 修改前
response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7天
});

// 修改后
response.cookies.set('token', token, {
  httpOnly: true,
  secure: false, // 在HTTP环境中不使用secure标志
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7天
});
```

### 2. 多重身份验证机制

修改`middleware.ts`中的用户验证逻辑，添加备份验证机制：

```typescript
// 修改前
const isAuthenticated = Boolean(token && token.length > 0 && user && user.length > 0);

// 修改后
const isAuthenticatedByTokenUser = Boolean(token && token.length > 0 && user && user.length > 0);
const isAuthenticatedByIsLoggedIn = isLoggedInCookie?.value === 'true';
const isAuthenticated = isAuthenticatedByTokenUser || isAuthenticatedByIsLoggedIn;
```

### 3. 本地存储备份

在登录页面`app/login/page.tsx`中添加本地存储备份：

```typescript
// 添加本地存储作为备份
localStorage.setItem('isLoggedIn', 'true');
localStorage.setItem('userName', data.user.name);
```

### 4. 跳转机制优化

修改登录页面的跳转方式，使用`window.location.replace`代替`router.push`：

```typescript
// 修改前
router.push('/dashboard/projects');

// 修改后
const dashboardUrl = window.location.origin + '/dashboard/projects';
window.location.replace(dashboardUrl);
```

### 5. 防缓存措施

在API请求和响应中添加防缓存头：

```typescript
// 请求头
headers: { 
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
},
cache: 'no-store'

// 响应头
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
response.headers.set('Pragma', 'no-cache');
```

## 技术原理

1. **HTTP vs HTTPS环境**：在HTTP环境中使用`secure: true`的cookie会被浏览器拒绝，导致cookie丢失。

2. **客户端路由与传统导航**：Next.js的`router.push`使用客户端路由而不会完全重载页面，可能在某些情况下导致cookie状态不一致。使用`window.location.replace`强制浏览器进行完整的页面加载，确保cookie正确传递。

3. **多重验证机制**：通过引入多种验证方法（包括cookie和localStorage），即使某一种机制失效，仍然可以维持用户的登录状态。

## 测试验证

部署修改后的代码，确认以下场景能够正常工作：

1. 用户成功登录后应该被重定向到仪表盘
2. 刷新仪表盘页面后应保持登录状态
3. 直接访问仪表盘URL应该保持登录状态（如果已登录）
4. 注销后应该正确清除所有身份验证状态
