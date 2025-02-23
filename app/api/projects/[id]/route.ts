import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params
    const projectId = Number(paramsData.id)
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: '无效的项目ID' },
        { status: 400 }
      )
    }

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

    // 查询项目详情
    const { datas } = await db.find({
      name: "bid_projects",
      args: {
        where: {
          id: { _eq: projectId }
        }
      },
      fields: [
        "id",
        "name",
        "status",
        "registration_deadline",
        "bidding_deadline",
        "bidding_info",
        "registration_info",
        "deposit_info",
        "preparation_info",
        "bid_user_bid_users",
        {
          name: "bid_company",
          fields: ["id", "name"]
        }
      ]
    })

    if (!datas || datas.length === 0) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    const project = datas[0]

    // 检查权限
    if (project.bid_user_bid_users !== user.id) {
      return NextResponse.json(
        { error: '无权查看此项目' },
        { status: 403 }
      )
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('获取项目详情失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取项目详情失败' },
      { status: 500 }
    )
  }
}