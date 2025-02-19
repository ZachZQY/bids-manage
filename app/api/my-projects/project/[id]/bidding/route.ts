import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'
import { createLog } from '@/lib/log'
import type { BiddingInfo } from '@/types/schema'
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

    const biddingInfo: BiddingInfo = await request.json()
    
    // 验证必填信息
    if (!biddingInfo.images_path?.length) {
      return NextResponse.json(
        { error: '请上传报价截图' },
        { status: 400 }
      )
    }

    if (!biddingInfo.documents_path?.length) {
      return NextResponse.json(
        { error: '请上传报价文件' },
        { status: 400 }
      )
    }

    // 更新项目报价信息
    const project = await db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { 
          id: { _eq: Number(paramsData.id) },
          status: { _eq: 'bidding' }
        },
        _set: {
          bidding_info: biddingInfo,
          bidding_at: new Date().getTime(),
          status: 'completed'
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
      actionType: 'submit_bidding',
      actionInfo: biddingInfo
    })

    // 发送通知
    await sendNotification({
      type: 'status_change',
      project,
      user: project.bid_user
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('提交报价信息失败:', error)
    return NextResponse.json(
      { error: '提交报价信息失败' },
      { status: 500 }
    )
  }
} 