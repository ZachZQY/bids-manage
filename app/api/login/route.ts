import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
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
      fields: ["id", "name", "code", "role", "phone"]
    });
    
    if (!user) {
      return NextResponse.json(
        { error: '暗号不正确，请重新输入' },
        { status: 401 }
      );
    }

    const token = 'test-token'; // 实际应用中应该生成真实的 token
    const cookieStore = await cookies();

    // 设置 cookie
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    cookieStore.set('user', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (error) {
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