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

    // 检查是否存在同名公司（排除当前公司）
    const { datas: existingCompanies } = await db.find({
      page_number: 1,
      page_size: 2,
      name: "bid_companies",
      args: {
        where: {
          name: { _eq: data.name.trim() },
          id: { _neq: Number(paramsData.id) }
        }
      },
      fields: ["id"]
    })

    if (existingCompanies && existingCompanies.length > 0) {
      return NextResponse.json(
        { error: '已存在同名公司，请更换公司名称' },
        { status: 400 }
      )
    }

    // 更新公司
    const updatedCompany = await db.mutationGetFirstOne({
      name: "update_bid_companies",
      args: {
        where: { id: { _eq: Number(paramsData.id) } },
        _set: {
          name: data.name.trim(),
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