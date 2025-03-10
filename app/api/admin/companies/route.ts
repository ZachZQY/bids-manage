import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '无权访问' },
        { status: 403 }
      )
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 10000
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // 构建查询条件
    const where: Record<string, any> = {}
    if (status && status !== 'all') {
      where.status = { _eq: status }
    }
    if (search) {
      where.name = { _ilike: `%${search.trim()}%` }
    }

    // 获取分页数据和总数
    const { datas, aggregate } = await db.find({
      page_number: page,
      page_size: pageSize,
      name: "bid_companies",
      args: {
        where,
        order_by: { created_at: () => 'desc' }
      },
      fields: [
        "id",
        "name",
        "status",
        "created_at",
        "updated_at"
      ]
    })

    return NextResponse.json({
      companies: datas,
      total: aggregate?.count || 0
    })

  } catch (error) {
    console.error('获取公司列表失败:', error)
    return NextResponse.json(
      { error: '获取公司列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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

    // 检查是否存在同名公司
    const { datas: existingCompanies } = await db.find({
      page_number: 1,
      page_size: 2,
      name: "bid_companies",
      args: {
        where: {
          name: { _eq: data.name.trim() }
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

    // 创建公司
    const newCompany = await db.mutationGetFirstOne({
      name: "insert_bid_companies",
      args: {
        objects: [{
          name: data.name.trim(),
          status: data.status
        }]
      },
      returning_fields: [
        "id",
        "name",
        "status",
        "created_at",
        "updated_at"
      ]
    })

    return NextResponse.json({ company: newCompany })

  } catch (error) {
    console.error('创建公司失败:', error)
    return NextResponse.json(
      { error: '创建公司失败' },
      { status: 500 }
    )
  }
} 