import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'
import { createLog } from '@/lib/log'
import { sendNotification } from '@/lib/notification'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 更新项目状态为待接单
    const project = await db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { 
          id: { _eq: Number(paramsData.id) },
          // 只能在报名阶段撤单
          status: { _eq: 'registration' }
        },
        _set: {
          status: 'pending',
          bid_user_bid_users: null,  // 清除接单人
          registration_info: null,    // 清除报名信息
          registration_at: null       // 清除报名时间
        }
      },
      returning_fields: [
        "id",
        "name",
        "registration_deadline",
        "bidding_deadline",
        "status",
        {
          name: "bid_user",
          fields: ["id", "name", "phone"]
        }
      ]
    })

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在或状态错误' },
        { status: 400 }
      )
    }

    // 记录操作日志
    await createLog({
      projectId: project.id,
      actionType: 'cancel_project',
      actionInfo: {
        reason: '用户主动撤单'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('撤单失败:', error)
    return NextResponse.json(
      { error: '撤单失败' },
      { status: 500 }
    )
  }
}