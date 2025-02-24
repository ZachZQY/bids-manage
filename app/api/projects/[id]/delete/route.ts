import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/app/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params
    const projectId = parseInt(paramsData.id)
    const body = await request.json()
    const { projectName, password } = body

    // 获取用户信息
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 检查是否是管理员
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '无权限执行此操作' },
        { status: 403 }
      )
    }

    // 获取项目信息
    const [project] = await db.query({
      name: "bid_projects",
      args: {
        where: { id: { _eq: projectId } }
      },
      fields: ["id", "name"]
    })

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    // 验证项目名称和密码
    if (projectName !== project.name || password !== '139649') {
      return NextResponse.json(
        { error: '项目名称或密码错误' },
        { status: 400 }
      )
    }

    // 删除项目
    await db.mutationGetFirstOne({
      name: "delete_bid_projects",
      args: {
        where: { id: { _eq: projectId } }
      },
      returning_fields: ["id"]
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('删除项目失败:', error)
    return NextResponse.json(
      { error: '删除项目失败' },
      { status: 500 }
    )
  }
}
