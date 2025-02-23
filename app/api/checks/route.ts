import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const isResolved = searchParams.get('isResolved')
    const projectName = searchParams.get('projectName')
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 构建查询条件
    const where: any = {}
    if (isResolved !== null) {
      where.is_resolve = { _eq: isResolved === 'true' }
    }
    if (projectName) {
      where.project_name = { _ilike: `%${projectName}%` }
    }

    // 构建排序条件
    const orderBy: any = {}
    orderBy[sortField] = () => sortOrder

    // 查询数据
    const { datas, aggregate } = await db.find({
      page_number: page,
      page_size: pageSize,
      name: "bid_checks",
      args: {
        where,
        order_by: orderBy
      },
      aggregate_fields: ["count"],
      fields: [
        "id",
        "project_name",
        "is_resolve",
        "resolve_content",
        "created_at",
        "updated_at",
        {
          name: "bid_checks_projects",
          fields: [
            "id",
            "company_name",
            "conflict_content",
            "created_at"
          ]
        }
      ]
    })

    return NextResponse.json({
      checks: datas,
      pagination: {
        current: page,
        pageSize,
        total: aggregate?.count
      }
    })
  } catch (error) {
    console.error('获取串标检测记录失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取串标检测记录失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // 获取提交的数据
    const data = await request.json()
    const { id, resolveContent } = data

    if (!id) {
      return NextResponse.json(
        { message: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 更新串标检测记录
    await db.mutationGetFirstOne({
      name: "update_bid_checks",
      args: {
        where: {
          id: { _eq: id }
        },
        _set: {
          is_resolve: true,
          resolve_content: resolveContent,
          updated_at: new Date().toISOString()
        }
      },
      returning_fields: ["id"]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新串标检测记录失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '更新串标检测记录失败' },
      { status: 500 }
    )
  }
}
