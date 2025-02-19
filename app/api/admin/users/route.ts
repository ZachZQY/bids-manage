import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'

// 获取用户列表
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
    const pageSize = Number(searchParams.get('pageSize')) || 10
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // 构建查询条件
    const where: Record<string, any> = {}
    if (status && status !== 'all') {
      where.status = { _eq: status }
    }
    if (search) {
      where._or = [
        { code: { _ilike: `%${search}%` } },
        { name: { _ilike: `%${search}%` } }
      ]
    }

    // 获取分页数据和总数
    const { datas, aggregate } = await db.find({
      page_number: page,
      page_size: pageSize,
      name: "bid_users",
      args: {
        where,
        order_by: { created_at:()=>'desc' }
      },
      fields: [
        "id",
        "code",
        "name",
        "phone",
        "role",
        "status",
        "created_at",
        "updated_at"
      ]
    })

    return NextResponse.json({
      users: datas,
      total: aggregate?.count || 0
    })

  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

// 创建新用户
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
    if (!data.code || !data.name) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      )
    }

    // 检查账号是否已存在
    const existingUser = await db.queryGetFirstOne({
      name: "bid_users",
      args: {
        where: { code: { _eq: data.code } }
      },
      fields: ["id"]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '账号已存在' },
        { status: 400 }
      )
    }

    // 创建用户
    const newUser = await db.mutationGetFirstOne({
      name: "insert_bid_users",
      args: {
        objects: [{
          code: data.code,
          name: data.name,
          phone: data.phone,
          role: data.role,
          status: data.status
        }]
      },
      returning_fields: [
        "id",
        "code",
        "name",
        "phone",
        "role",
        "status"
      ]
    })

    return NextResponse.json({ user: newUser })

  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    )
  }
} 