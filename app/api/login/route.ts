import { NextResponse,type NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '请输入登录暗号' },
        { status: 400 }
      );
    }

    // 通过暗号查询用户
    const user = await db.queryGetFirstOne({
      name: "bid_users",
      args: {
        where: { code: { _eq: code } }
      },
      fields: ["id", "name", "code", "role", "phone", "status"]
    });
    
    if (!user) {
      return NextResponse.json(
        { error: '暗号不正确，请重新输入' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: '用户不存在或已被禁用，请联系管理员' },
        { status: 401 }
      );
    }

    // 生成随机token (在生产环境中应使用更安全的方法)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    console.log('设置登录token:', token);
    
    // 设置 cookie - 修改cookie设置，确保能在服务器环境中正确设置
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
    
    // 直接在response上设置cookie - 修改cookie设置，尝试解决token丢失问题
    response.cookies.set('token', token, {
      httpOnly: true,
      // 在宝塔环境下，可能需要禁用secure标志，除非确定使用了HTTPS
      secure: false, // 修改为false，避免HTTP环境下的cookie问题
      sameSite: 'lax',
      path: '/',
      // 确保cookie不会太快过期
      maxAge: 60 * 60 * 24 * 7 // 7天
    });

    response.cookies.set('user', JSON.stringify(user), {
      httpOnly: true,
      // 确保与token cookie设置一致
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7天
    });
    
    // 额外设置一个非httpOnly的cookie，帮助客户端检测登录状态
    response.cookies.set('isLoggedIn', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7天
    });
    
    // 添加防缓存头，确保重定向不会使用缓存的响应
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;

  } catch (error) {
    console.error('登录错误:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '登录失败' },
      { status: 400 }
    );
  }
}