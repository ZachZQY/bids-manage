import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import dayjs from 'dayjs'
export type NotificationType = 'new_project' | 'status_change' | 'deadline_reminder'

interface Project {
  id: number
  name: string
  registration_deadline: string
  bidding_deadline: string
  status: string
}

interface User {
  id: number
  name: string
  phone: string
}

interface NotificationOptions {
  type: NotificationType
  project: Project
  user: User
}

export async function sendNotification(options: NotificationOptions) {
  const { type, project, user } = options

  // 根据不同类型生成通知内容
  let content = ''
  switch (type) {
    case 'new_project':
      content = `【消息中心】您有一个新的标书项目 ${project.name} 请及时提交报名信息！`
      break
    case 'status_change':
      content = `【消息中心】您的标书项目 ${project.name} 进度已更新！`
      break
    case 'deadline_reminder':
      const deadline = project.status === 'registration' ? 
        project.registration_deadline : project.bidding_deadline
      content = `【消息中心】您的标书项目 ${project.name} 将在 ${dayjs(deadline).format('YYYY-MM-DD HH:mm')} 截止提交报名信息，请及时处理！`
      break
  }

  try {
    const notification = await db.mutationGetFirstOne({
      name: "insert_bid_notifications",
      args: {
        objects: [{
          notification_type: type,
          content,
          phone: user.phone,
          status: 'pending',
        }]
      },
      returning_fields: ["id","content"]
    })

    const result = await sendSMS({
      mobile: user.phone,
      content: notification.content
    })

    console.log(result,1234)
    
    return notification
  } catch (error) {
    console.error('记录通知失败:', error)
    throw error
  }
}