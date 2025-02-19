import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params
    const user = await getUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '无权访问' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.name) {
      return NextResponse.json(
        { error: '请填写公司名称' },
        { status: 400 }
      )
    }

    // 更新公司
    const updatedCompany = await db.mutationGetFirstOne({
      name: "update_bid_companies",
      args: {
        where: { id: { _eq: Number(paramsData.id) } },
        _set: {
          name: data.name,
          status: data.status
        }
      },
      returning_fields: [
        "id",
        "name",
        "status",
        "created_at",
        "updated_at"
      ]
    })

    if (!updatedCompany) {
      return NextResponse.json(
        { error: '公司不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ company: updatedCompany })

  } catch (error) {
    console.error('更新公司失败:', error)
    return NextResponse.json(
      { error: '更新公司失败' },
      { status: 500 }
    )
  }
} 