import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { createLog } from '@/lib/log'
import type { RegistrationInfo } from '@/types/schema'
import { checkBidConflict } from '@/lib/check'

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
        { message: '无效的项目ID' },
        { status: 400 }
      )
    }

    // 从 cookie 获取用户信息
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')

    if (!userCookie?.value) {
      return NextResponse.json(
        { message: '未登录' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie.value)

    // 获取提交的报名信息
    const registrationInfo: RegistrationInfo = await request.json()
    const { 
      contact_person,
      contact_mobile,
      contact_phone,
      contact_email,
      computer,
      network,
      images_path
    } = registrationInfo

    // 验证必填字段
    if (!contact_person || !contact_mobile || !computer || !network) {
      return NextResponse.json(
        { message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

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
        { message: '项目不存在' },
        { status: 404 }
      )
    }

    const project = datas[0]

    // 检查权限
    if (project.bid_user_bid_users !== user.id) {
      return NextResponse.json(
        { message: '无权操作此项目' },
        { status: 403 }
      )
    }

    // 检查项目状态
    if (project.status !== 'registration') {
      return NextResponse.json(
        { message: '当前状态不允许提交报名信息' },
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
          status: 'deposit',
          registration_at: new Date().toISOString(),
          registration_info: registrationInfo
        }
      },
      returning_fields: ["id"]
    })

    // 记录操作日志
    await createLog({
      projectId,
      actionType: 'submit_registration',
      actionInfo: registrationInfo
    })

    // 异步执行串标检测
    if (project.bid_company) {
      checkBidConflict(
        projectId,
        project.name,
        project.bid_company.id
      ).catch(error => {
        console.error('串标检测失败:', error)
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('提交报名信息失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '提交报名信息失败' },
      { status: 500 }
    )
  }
}
