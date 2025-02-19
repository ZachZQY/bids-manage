import { db } from './db'
import { getUser } from '@/app/lib/auth'
import type { RegistrationInfo, DepositInfo, PreparationInfo, BiddingInfo } from '@/types/schema'
import { headers } from 'next/headers'
// 操作类型定义
type ActionType =
    | 'create_project'   // 发布项目
    | 'take_project'     // 接单
    | 'cancel_project'   // 撤单
    | 'submit_registration'  // 提交报名
    | 'submit_deposit'    // 提交保证金
    | 'submit_preparation'  // 提交制作
    | 'submit_bidding'    // 提交报价

enum ActionTypeEnum {
    create_project = '发布项目',
    take_project = '接单',
    cancel_project = '撤单',
    submit_registration = '提交报名',
    submit_deposit = '提交保证金',
}
// 操作信息类型
type ActionInfo = {
    create_project: { name?: string; bidding_deadline?: string | number; registration_deadline?: string | number, bid_user_bid_users?: number }
    take_project: { project_id: number }
    cancel_project: { reason?: string }
    submit_registration: RegistrationInfo
    submit_deposit: DepositInfo
    submit_preparation: PreparationInfo
    submit_bidding: BiddingInfo
}

export async function createLog<T extends ActionType>(params: {
    projectId: number;
    actionType: T;
    actionInfo: ActionInfo[T];
}) {
    const { projectId, actionType, actionInfo } = params

    const user = await getUser()
    const headersList = await headers()
    // 按优先级获取真实 IP
    const userIp = headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') ||
        '0.0.0.0'
    const userAgent = headersList.get('user-agent') || ''

    try {
        await db.mutation({
            name: "insert_bid_projects_logs_one",
            args: {
                object: {
                    bid_project_bid_projects: projectId,
                    bid_user_bid_users: user.id,
                    user_ip: userIp,
                    user_agent: userAgent,
                    action_type: actionType,
                    action_info: actionInfo,
                    content: `用户${user.name}（${user.phone}）在${new Date().toLocaleString()}进行了【${ActionTypeEnum[actionType as keyof typeof ActionTypeEnum]}】操作`
                }
            },
            fields: ["id"]
        })
    } catch (error) {
        console.error('创建操作日志失败:', error)
    }
}
