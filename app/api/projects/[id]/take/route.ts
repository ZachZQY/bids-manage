import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendNotification } from '@/lib/notification'
import { createLog } from '@/lib/log'
import { getUser } from '@/app/lib/auth'
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id)
        if (isNaN(id)) {
            return NextResponse.json({ error: '无效的项目ID' }, { status: 400 })
        }

        const user = await getUser();
        if(!user){
            return NextResponse.json({ error: '未登录' }, { status: 401 })
        }

        // 更新项目状态
        const project = await db.mutationGetFirstOne({
            name: "update_bid_projects",
            args: {
                where: {
                    id: { _eq: id },
                    status: { _eq: 'pending' }  // 确保项目还在待接单状态
                },
                _set: {
                    bid_user_bid_users: user.id,
                    status: 'registration'
                }
            },
            returning_fields: [
                "id",
                "name",
                "registration_deadline",
                "bidding_deadline",
                "status",
                {
                    name: "bid_user",
                    fields: ["id", "name", "phone"]
                }
            ]
        })

        if (!project) {
            return NextResponse.json(
                { error: '项目已被接单或不存在' },
                { status: 400 }
            )
        }


        // 在接单成功后
        await createLog({
            projectId: id,
            actionType: 'take_project',
            actionInfo: {
                project_id: id
            }
        })
        // 发送通知
        await sendNotification({
            type: 'status_change',
            project: project,
            user: project.bid_user
        })

        return NextResponse.json({ project })
    } catch (err) {
        console.error('接单失败:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : '接单失败' },
            { status: 500 }
        )
    }
} 