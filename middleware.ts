import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查所有cookie并记录到日志(生产环境中移除这部分调试代码)
  console.log('===== 中间件处理请求 =====');
  console.log('路径:', pathname);
  console.log('URL:', request.url);
  console.log('原始Origin:', request.nextUrl.origin);
  
  // 获取并记录cookie
  const tokenCookie = request.cookies.get('token');
  const userCookie = request.cookies.get('user');
  
  console.log('Token cookie:', tokenCookie ? `存在: ${tokenCookie.value.substring(0, 10)}...` : '不存在');
  console.log('User cookie:', userCookie ? `存在: ${userCookie.value.substring(0, 10)}...` : '不存在');
  
  // 更健壮的身份验证检查
  const token = tokenCookie?.value;
  const user = userCookie?.value;
  const isAuthenticated = Boolean(token && token.length > 0 && user && user.length > 0);
  
  console.log('认证状态:', isAuthenticated ? '已登录' : '未登录');
  
  // 获取headers中的host
  const host = request.headers.get('host') || 'bids-manage.weweknow.com';
  
  // 使用实际访问的协议和主机名构建origin
  // 检测请求协议，如果通过代理可能需要检查X-Forwarded-Proto
  const proto = request.headers.get('x-forwarded-proto') || 
                (request.url.startsWith('https') ? 'https' : 'http');
  
  // 强制使用实际部署的域名，而不是依赖request.nextUrl.origin
  const origin = `${proto}://${host}`;
  console.log('使用的origin:', origin);
  
  // 登录页面逻辑
  if (pathname === '/login') {
    if (isAuthenticated) {
      console.log('已登录，从登录页重定向到仪表盘');
      return NextResponse.redirect(`${origin}/dashboard/projects`);
    }
    console.log('未登录，正常显示登录页');
    return NextResponse.next();
  }

  // 仪表盘及其子路由的权限控制
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      console.log('未登录，从仪表盘重定向到登录页');
      return NextResponse.redirect(`${origin}/login`);
    }
    console.log('已登录，正常访问仪表盘');
    return NextResponse.next();
  }

  // 根路径重定向到登录页
  if (pathname === '/') {
    if (isAuthenticated) {
      console.log('已登录，从根路径重定向到仪表盘');
      return NextResponse.redirect(`${origin}/dashboard/projects`);
    }
    console.log('未登录，从根路径重定向到登录页');
    return NextResponse.redirect(`${origin}/login`);
  }

  // 重定向 /dashboard 到项目大厅
  if (pathname === '/dashboard') {
    console.log('重定向/dashboard到项目大厅');
    return NextResponse.redirect(`${origin}/dashboard/projects`);
  }

  console.log('其他路径，正常处理');
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*']
};