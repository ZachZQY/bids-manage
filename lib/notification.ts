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
      content = `【消息中心】有一个新的标书项目 ${project.name} 请及时查阅！`
      break
  }

  try {
 

    // 查询所有用户手机号
    const users = await db.query({
      name: "bid_users",
      args: {
        where: {
          status: {
            _eq: "active"
          },
          phone: {
            _is_null: false
          }
        }
      },
      fields: ["id", "phone"]
    })
    const phones = users.map(user => user.phone)
    if(phones.length === 0) return

    const notification = await db.mutationGetFirstOne({
      name: "insert_bid_notifications",
      args: {
        objects: [{
          notification_type: type,
          content,
          phone: phones.join(','),
          status: 'pending',
        }]
      },
      returning_fields: ["id", "content"]
    })
    const result = await sendSMS({
      mobile: phones,
      content: notification.content
    })

    return notification
  } catch (error) {
    console.error('记录通知失败:', error)
    throw error
  }
}