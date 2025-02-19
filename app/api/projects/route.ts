import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { BidStatus } from "@/types/schema"
import { sendNotification } from '@/lib/notification'
import { createLog } from '@/lib/log'
import { getUser } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 10
    const status = searchParams.get('status') || 'pending'

    // 获取分页数据和总数
    const { datas, aggregate } = await db.find({
      page_number: page,
      page_size: pageSize,
      name: "bid_projects",
      args: {
        where: {
          status: {
            _eq: status
          }
        },
        order_by: {
          registration_deadline: () => "desc"
        },
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
            "role"
          ]
        }
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
    const {
      name,
      bidding_deadline,
      registration_deadline,
      bid_user_bid_users
    } = body
    const user = await getUser()
    if(!user){
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    const project = await db.mutationGetFirstOne({
      name: "insert_bid_projects",
      args: {
        objects: [{
          name,
          bidding_deadline,
          registration_deadline,
          ...bid_user_bid_users ? {
            bid_user_bid_users,
            status: 'registration' as BidStatus
          } : {
            status: 'pending' as BidStatus
          },

        }]
      },
      returning_fields: ["id", "name", "registration_deadline","bidding_deadline","bid_user_bid_users", { name: "bid_user", fields: ["id", "name", "phone"] }]
    })

    // 如果指定了接单人，发送通知
    if (bid_user_bid_users) {
      try {
        await sendNotification({
          type: 'new_project',
          project: {
            id: project.id,
            name: project.name,
            registration_deadline: project.registration_deadline,
            bidding_deadline: project.bidding_deadline,
            status: project.status
          },
          user: project.bid_user
        })
      } catch (error) {
        console.error('发送通知失败:', error)
      }
    }

  
    // 在创建项目成功后
    await createLog({
      projectId: project.id,
      actionType: 'create_project',
      actionInfo: {
        name: project.name,
        bidding_deadline: project.bidding_deadline,
        registration_deadline: project.registration_deadline,
        bid_user_bid_users: project.bid_user_bid_users
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('创建项目失败:', error)
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    )
  }
} 