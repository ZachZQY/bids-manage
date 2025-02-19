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
    const pageSize = Number(searchParams.get('pageSize')) || 10
    const actionType = searchParams.get('action_type')
    const search = searchParams.get('search')

    // 构建查询条件
    const where: Record<string, any> = {}
    if (actionType && actionType !== 'all') {
      where.action_type = { _eq: actionType }
    }
    if (search) {
      where._or = [
        {
          project:{
            name: { _ilike: `%${search}%` }
          }
        },{
          user:{
            name: { _ilike: `%${search}%` }
          }
        }
      ]
    }

    console.log(where,111)
    // 获取分页数据和总数
    const { datas, aggregate } = await db.find({
      page_number: page,
      page_size: pageSize,
      name: "bid_projects_logs",
      args: {
        where,
        order_by: { created_at: ()=>'desc' }
      },
      fields: [
        "id",
        "action_type",
        "action_info",
        "content",
        "user_ip",
        "user_agent",
        "created_at",
        {
          name: "bid_project",
          fields: ["id", "name"]
        },
        {
          name: "bid_user",
          fields: ["id", "name"]
        }
      ]
    })

    return NextResponse.json({
      logs: datas,
      total: aggregate?.count || 0
    })

  } catch (error) {
    console.error('获取日志列表失败:', error)
    return NextResponse.json(
      { error: '获取日志列表失败' },
      { status: 500 }
    )
  }
} 