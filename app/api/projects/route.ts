import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import type { BidStatus } from '@/types/schema'
import { sendNotification } from '@/lib/notification'
import { createLog } from '@/lib/log'
import { getUser } from '@/app/lib/auth'

export const dynamic = 'force-dynamic' // 强制动态渲染

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 10
    const status = searchParams.get('status') as BidStatus | 'all' | null
    const type = searchParams.get('type') || 'all'
    const needStats = searchParams.get('stats') === 'true'
    const keyword = searchParams.get('keyword')
    const orderBy = searchParams.get('orderBy') || 'registration_deadline'
    const orderDesc = searchParams.get('orderDesc') === 'true'

    // 从 cookie 获取用户信息
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')

    if (!userCookie?.value) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie.value)

    // 基础查询条件
    const where: any = {}

    // 根据类型设置不同的查询条件
    if (type === 'my') {
      where.bid_user_bid_users = { _eq: user.id }
      // 如果指定了状态，添加状态过滤（仅对my类型有效）
    }
    if (status && status !== 'all') {
      where.status = { _eq: status }
    }
    // 添加关键字搜索
    if (keyword) {
      where._or = [
        {
          bid_company: {
            name: { _ilike: `%${keyword}%` }
          }
        },
        { name: { _ilike: `%${keyword}%` } }
      ]

    }

    // 查询项目列表
    const { datas, aggregate } = await db.find({
      name: "bid_projects",
      page_number: page,
      page_size: pageSize,
      args: {
        where,
        order_by: { [orderBy]: () => orderDesc ? 'desc' : 'asc' }
      },
      fields: [
        "id",
        "name",
        "bidding_deadline",
        "registration_deadline",
        "status",
        "registration_info",
        "deposit_info",
        "preparation_info",
        "bidding_info",
        "registration_at",
        "deposit_at",
        "preparation_at",
        "bidding_at",
        "created_at",
        "updated_at",
        {
          name: "bid_user",
          fields: ["id", "name", "phone", "role"]
        },
        {
          name: "bid_company",
          fields: [
            "id",
            "name"
          ]
        }
      ]
    })

    // 查询各状态的数量
    const { response: statsResponse } = await db.operate({
      opMethod: "query",
      opFields: [{
        alias: "registration",
        name: "bid_projects_aggregate",
        fields: { name: "aggregate", fields: ["count"] },
        args: {
          where: {
            ...(type === 'my' ? { bid_user_bid_users: { _eq: user.id } } : {}),
            status: { _eq: "registration" }
          }
        }
      }, {
        alias: "deposit",
        name: "bid_projects_aggregate",
        fields: { name: "aggregate", fields: ["count"] },
        args: {
          where: {
            ...(type === 'my' ? { bid_user_bid_users: { _eq: user.id } } : {}),
            status: { _eq: "deposit" }
          }
        }
      },
      {
        alias: "preparation",
        name: "bid_projects_aggregate",
        fields: { name: "aggregate", fields: ["count"] },
        args: {
          where: {
            ...(type === 'my' ? { bid_user_bid_users: { _eq: user.id } } : {}),
            status: { _eq: "preparation" }
          }
        }
      },
      {
        alias: "bidding",
        name: "bid_projects_aggregate",
        fields: { name: "aggregate", fields: ["count"] },
        args: {
          where: {
            ...(type === 'my' ? { bid_user_bid_users: { _eq: user.id } } : {}),
            status: { _eq: "bidding" }
          }
        }
      },
      {
        alias: "completed",
        name: "bid_projects_aggregate",
        fields: { name: "aggregate", fields: ["count"] },
        args: {
          where: {
            ...(type === 'my' ? { bid_user_bid_users: { _eq: user.id } } : {}),
            status: { _eq: "completed" }
          }
        }
      },
      {
        alias: "pending",
        name: "bid_projects_aggregate",
        fields: { name: "aggregate", fields: ["count"] },
        args: {
          where: {
            ...(type === 'my' ? { bid_user_bid_users: { _eq: user.id } } : {}),
            status: { _eq: "pending" }
          }
        }
      }]
    })

    const stats = {
      all: aggregate?.count || 0,
      registration: statsResponse.registration.aggregate.count,
      deposit: statsResponse.deposit.aggregate.count,
      preparation: statsResponse.preparation.aggregate.count,
      bidding: statsResponse.bidding.aggregate.count,
      completed: statsResponse.completed.aggregate.count,
      pending: statsResponse.pending.aggregate.count
    }

    return NextResponse.json({
      projects: datas,
      total: aggregate?.count || 0,
      page,
      pageSize,
      stats
    })

  } catch (error) {
    console.error('获取项目列表失败:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
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
      bid_user_bid_users,
      bid_company_bid_companies
    } = body
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    const project = await db.mutationGetFirstOne({
      name: "insert_bid_projects",
      args: {
        objects: [{
          name,
          bidding_deadline,
          registration_deadline,
          bid_company_bid_companies,
          ...bid_user_bid_users ? {
            bid_user_bid_users,
            status: 'registration' as BidStatus
          } : {
            status: 'pending' as BidStatus
          },

        }]
      },
      returning_fields: ["id", "name", "registration_deadline", "bidding_deadline", "bid_user_bid_users", { name: "bid_user", fields: ["id", "name", "phone"] }]
    })

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

    // 全员发送通知
    sendNotification({
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

    return NextResponse.json({ project })
  } catch (error) {
    console.error('创建项目失败:', error)
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    )
  }
} 