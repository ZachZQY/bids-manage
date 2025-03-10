import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { createLog } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function POST(
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

    // 查询项目信息
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
        "bid_user_bid_users",
        "registration_deadline",
        "bidding_deadline",
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

    // 检查项目状态
    if (project.status !== 'pending') {
      return NextResponse.json(
        { error: '项目已被接单' },
        { status: 400 }
      )
    }

    // 更新项目状态
    await db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: {
          id: { _eq: projectId }
        },
        _set: {
          status: 'registration',
          bid_user_bid_users: user.id
        }
      },
      returning_fields:["id"]
    })

    // 记录操作日志
    await createLog({
      projectId,
      actionType: 'take_project',
      actionInfo: {
        project_id: projectId
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('接单失败:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: '接单失败' },
      { status: 500 }
    )
  }
} 