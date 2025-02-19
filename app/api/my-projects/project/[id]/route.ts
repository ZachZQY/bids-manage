import { NextResponse,type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const project = await db.queryGetFirstOne({
      name: "bid_projects",
      args: {
        where: { 
          id: {
            _eq:Number(paramsData.id)
          },
        }
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
        {
          name: "bid_company",
          fields: [
            "id",
            "name"
          ]
        },
        "created_at",
        "updated_at"
      ]
    })

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('获取项目详情失败:', error)
    return NextResponse.json(
      { error: '获取项目详情失败' },
      { status: 500 }
    )
  }
}