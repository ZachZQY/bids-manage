import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic' // 强制动态渲染

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 10
    
    // 计算偏移量
    const offset = (page - 1) * pageSize

    // 获取分页数据
    const { datas,aggregate } = await db.find({
      name: "bid_users",
      args: {
        order_by: {
          created_at: () => "desc"
        },
        limit: pageSize,
        offset
      },
      fields: [
        "id",
        "name",
        "code",
        "role",
        "phone",
        "created_at"
      ],
      aggregate_fields: ["count"]
    })

    return NextResponse.json({
      users: datas,
      total: aggregate.count,
      page,
      pageSize
    })
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
} 