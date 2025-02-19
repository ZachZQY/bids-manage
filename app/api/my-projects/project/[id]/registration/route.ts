import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'
import { createLog } from '@/lib/log'
import type { RegistrationInfo } from '@/types/schema'

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

    const registrationInfo: RegistrationInfo = await request.json()
    
    // 验证必填信息
    if (!registrationInfo.computer || !registrationInfo.network) {
      return NextResponse.json(
        { error: '请填写电脑和网络信息' },
        { status: 400 }
      )
    }

    if (!registrationInfo.images_path?.length) {
      return NextResponse.json(
        { error: '请上传报名图片' },
        { status: 400 }
      )
    }

    // 更新项目报名信息
    const project = await db.mutationGetFirstOne({
      name: "update_bid_projects",
      args: {
        where: { 
          id: { _eq: Number(paramsData.id) },
          status: { _eq: 'registration' }
        },
        _set: {
          registration_info: registrationInfo,
          registration_at: new Date().getTime(),
          status: 'deposit'
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
      actionType: 'submit_registration',
      actionInfo: registrationInfo
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新报名信息失败:', error)
    return NextResponse.json(
      { error: '更新报名信息失败' },
      { status: 500 }
    )
  }
}