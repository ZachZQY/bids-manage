import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const user = request.cookies.get('user')?.value;
  const isAuthenticated = token && user;

  // 获取当前完整URL的origin部分(包含协议和域名)
  const origin = request.nextUrl.origin;
  
  // 登录页面逻辑
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard/projects', origin));
    }
    return NextResponse.next();
  }

  // 仪表盘及其子路由的权限控制
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', origin));
    }
    return NextResponse.next();
  }

  // 根路径重定向到登录页
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard/projects', origin));
    }
    return NextResponse.redirect(new URL('/login', origin));
  }

  // 重定向 /dashboard 到项目大厅
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/projects', origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*']
};