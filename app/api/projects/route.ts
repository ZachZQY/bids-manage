import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { BidStatus } from "@/types/schema"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status') || 'pending'
    
    // 计算偏移量
    const offset = (page - 1) * pageSize

    // 获取分页数据和总数
    const { datas, aggregate } = await db.find({
      name: "bid_projects",
      args: {
        where: {
          status: {
            _eq:status
          }
        },
        order_by: {
          registration_deadline: () => "desc"
        },
        limit: pageSize,
        offset
      },
      fields: [
        "id",
        "name",
        "bidding_deadline",
        "registration_deadline",
        "status"
      ],
      aggregate_fields: ["count"]
    })

    return NextResponse.json({
      projects: datas,
      total: aggregate.count,
      page,
      pageSize
    })
  } catch (error) {
    console.error('获取项目列表失败:', error)
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, bidding_deadline, registration_deadline } = body

    const { datas } = await db.find({
      name: "bid_projects",
      args: {
        objects: [{
          name,
          bidding_deadline,
          registration_deadline,
          status: 'pending' as BidStatus
        }]
      },
      fields: ["id"]
    })

    return NextResponse.json({ project: datas[0] })
  } catch (error) {
    console.error('创建项目失败:', error)
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    )
  }
} 