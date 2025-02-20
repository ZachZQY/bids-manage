import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'
import { createLog } from '@/lib/log'
import type { DepositInfo } from '@/types/schema'
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

    const depositInfo: DepositInfo = await request.json()

    // 更新项目保证金信息
    const project = await db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { 
          id: { _eq: Number(paramsData.id) },
          status: { _eq: 'deposit' }
        },
        _set: {
          deposit_info: depositInfo,
          deposit_at: new Date().getTime(),
          status: 'preparation'
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
      actionType: 'submit_deposit',
      actionInfo: depositInfo
    })

    // 发送通知
    await sendNotification({
      type: 'status_change',
      project,
      user: project.bid_user
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('提交保证金失败:', error)
    return NextResponse.json(
      { error: '提交保证金失败' },
      { status: 500 }
    )
  }
}