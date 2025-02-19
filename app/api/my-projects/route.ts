import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import type { BidStatus } from '@/types/schema'

export const dynamic = 'force-dynamic' // 强制动态渲染

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 10
    const status = searchParams.get('status') as BidStatus | null
    const needStats = searchParams.get('stats') === 'true'

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
    const where = {
      bid_user_bid_users: { _eq: user.id }
    }

    // 如果指定了状态，添加状态过滤
    if (status) {
      where['status'] = { _eq: status }
    }

    // 查询用户的项目
    const { datas, aggregate } = await db.find({
      name: "bid_projects",
      page_number: page,
      page_size: pageSize,
      args: {
        where,
        order_by: { registration_deadline: () => 'desc' }
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
          name:"bid_user",
          fields:["id","name","phone","role"]
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

    // 如果需要统计数据，额外查询各状态数量
    let stats:unknown = null
    if (needStats) {

  
      const {response} = await db.operate({
        opMethod: "query",
        opFields:[{
          alias:"registration",
          name:"bid_projects_aggregate",
          fields:{name:"aggregate",fields:["count"]},
          args:{
            where:{bid_user_bid_users:{_eq:user.id},status:{_eq:"registration"}}
          }
        },{
          alias:"deposit",
          name:"bid_projects_aggregate",
          fields:{name:"aggregate",fields:["count"]},
          args:{
            where:{bid_user_bid_users:{_eq:user.id},status:{_eq:"deposit"}}
          }
        },
        {
          alias:"preparation",
          name:"bid_projects_aggregate",
          fields:{name:"aggregate",fields:["count"]},
          args:{
            where:{bid_user_bid_users:{_eq:user.id},status:{_eq:"preparation"}}
          }
        },
        
        {
          alias:"bidding",
          name:"bid_projects_aggregate",
          fields:{name:"aggregate",fields:["count"]},
          args:{
            where:{bid_user_bid_users:{_eq:user.id},status:{_eq:"bidding"}}
          }
        },
        {
          alias:"completed",
          name:"bid_projects_aggregate",
          fields:{name:"aggregate",fields:["count"]},
          args:{
            where:{bid_user_bid_users:{_eq:user.id},status:{_eq:"completed"}}
          }
        }
      
      ]
      })
      stats = {
        registration: response.registration.aggregate.count,
        deposit: response.deposit.aggregate.count,
        preparation: response.preparation.aggregate.count,
        bidding: response.bidding.aggregate.count,
        completed: response.completed.aggregate.count
      }

    }

    return NextResponse.json({
      projects: datas,
      total: aggregate?.count || 0,
      page,
      pageSize,
      ...stats?stats:{}
    })

  } catch (error) {
    console.error('获取我的项目失败:', error)
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