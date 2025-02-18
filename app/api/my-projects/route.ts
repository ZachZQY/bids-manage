import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic' // 强制动态渲染

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 10

    // 从 cookie 获取用户信息
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')

    if (!userCookie?.value) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie.value)

    // 查询用户的项目
    const { datas, aggregate } = await db.find({
      name: "bid_projects",
      page_number: page,
      page_size: pageSize,
      args: {
        where: {
          bid_user_bid_users: { _eq: user.id } // 指定给我的项目
        },
        order_by: { registration_deadline: () => 'desc' }
      },
      fields: [
        "id",
        "name",
        "bidding_deadline",
        "registration_deadline",
        "status"
      ]
    })

    return NextResponse.json({
      projects: datas,
      total: aggregate?.count || 0,
      page,
      pageSize
    })

  } catch (error) {
    console.error('获取我的项目失败:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    )
  }
} 