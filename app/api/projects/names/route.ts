import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''

    const rows = await db.query(
      {
        name: 'bid_projects',
        args: {
          where: {
            name: { _ilike: `%${keyword}%` }
          },
          distinct_on: [()=>"created_at",()=>'name'],
          limit: 20,
          order_by:{
            created_at:()=>"desc"
          }
        },
        fields: ['name']
      }
    )

    return Response.json({
      names: rows.map(row => row.name)
    })
  } catch (error) {
    console.error('Error fetching project names:', error)
    return Response.json({ error: '获取项目名称失败' }, { status: 500 })
  }
}
