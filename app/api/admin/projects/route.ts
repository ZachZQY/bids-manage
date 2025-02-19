import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'
import type { BidStatus } from '@/types/schema'

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
    const status = searchParams.get('status') as BidStatus | 'all' | null
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'bidding_deadline'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 构建查询条件
    const where: Record<string, any> = {}
    if (status && status !== 'all') {
      where.status = { _eq: status }
    }
    if (search) {
      where.name = { _ilike: `%${search}%` }
    }

    // 构建排序条件
    const orderBy: Record<string, any> = {
      [sortBy]: ()=>sortOrder
    }

    // 获取分页数据和总数
    const { datas, aggregate } = await db.find({
      page_number: page,
      page_size: pageSize,
      name: "bid_projects",
      args: {
        where,
        order_by: orderBy
      },
      fields: [
        "id",
        "name",
        "bidding_deadline",
        "registration_deadline",
        "status",
        "bid_user_bid_users",
        {
          name: "bid_user",
          fields: [
            "id",
            "name",
            "phone"
          ]
        },
        "registration_info",
        "deposit_info",
        "preparation_info",
        "bidding_info",
        "registration_at",
        "deposit_at",
        "preparation_at",
        "bidding_at",
        "created_at",
        "updated_at"
      ]
    })

    return NextResponse.json({
      projects: datas,
      total: aggregate?.count || 0
    })

  } catch (error) {
    console.error('获取项目列表失败:', error)
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    )
  }
} 