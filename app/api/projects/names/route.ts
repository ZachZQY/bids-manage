import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''
    const type = searchParams.get('type') || ''

    const where: Record<string, any> = {}
    if (type == "batch") {
      where.batch_name = { _ilike: `%${keyword.trim()}%` }
    } else if (type == "product") {
      where.product_name = { _ilike: `%${keyword.trim()}%` }
    }
    const rows = await db.query(
      {
        name: 'bid_projects',
        args: {
          where: where,
          distinct_on: [() => "created_at", () => 'name'],
          limit: 20,
          order_by: {
            created_at: () => "desc"
          }
        },
        fields: ['name', 'batch_name', 'product_name']
      }
    )

    return Response.json({
      names: rows.map(row => row?.[`${type}_name`])
    })
  } catch (error) {
    console.error('Error fetching project names:', error)
    return Response.json({ error: '获取项目名称失败' }, { status: 500 })
  }
}
