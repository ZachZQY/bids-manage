import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'
import { createLog } from '@/lib/log'
import type { PreparationInfo } from '@/types/schema'
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

    const preparationInfo: PreparationInfo = await request.json()
    
    // 验证必填信息
    if (!preparationInfo.mac_address || !preparationInfo.ip_address) {
      return NextResponse.json(
        { error: '请填写MAC地址和IP地址' },
        { status: 400 }
      )
    }

    if (!preparationInfo.images_path?.length) {
      return NextResponse.json(
        { error: '请上传制作截图' },
        { status: 400 }
      )
    }

    if (!preparationInfo.documents_path?.length) {
      return NextResponse.json(
        { error: '请上传标书文件' },
        { status: 400 }
      )
    }

    // 更新项目制作信息
    const project = await db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { 
          id: { _eq: Number(paramsData.id) },
          status: { _eq: 'preparation' }
        },
        _set: {
          preparation_info: preparationInfo,
          preparation_at: new Date().getTime(),
          status: 'bidding'
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
      actionType: 'submit_preparation',
      actionInfo: preparationInfo
    })

    // 发送通知
    await sendNotification({
      type: 'status_change',
      project,
      user: project.bid_user
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('提交制作信息失败:', error)
    return NextResponse.json(
      { error: '提交制作信息失败' },
      { status: 500 }
    )
  }
} 