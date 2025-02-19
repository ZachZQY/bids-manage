import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/app/lib/auth'

// 更新用户信息
export async function PUT(
  request: Request,
  { params }:{ params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params
    const user = await getUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '无权访问' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.name) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      )
    }

    // 更新用户
    const updatedUser = await db.mutationGetFirstOne({
      name: "update_bid_users",
      args: {
        where: { id: { _eq: Number(paramsData.id) } },
        _set: {
          name: data.name,
          phone: data.phone,
          role: data.role,
          status: data.status
        }
      },
      returning_fields: [
        "id",
        "code",
        "name",
        "phone",
        "role",
        "status"
      ]
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: updatedUser })

  } catch (error) {
    console.error('更新用户失败:', error)
    return NextResponse.json(
      { error: '更新用户失败' },
      { status: 500 }
    )
  }
} 