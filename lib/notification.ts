import { db } from '@/lib/db'

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
      content = `您有一个新的指定项目: ${project.name},截止时间:${project.registration_deadline},请及时处理！`
      break
    case 'status_change':
      content = `项目 ${project.name} 状态已更新为: ${project.status}`
      break
    case 'deadline_reminder':
      const deadline = project.status === 'registration' ? 
        project.registration_deadline : project.bidding_deadline
      content = `提醒：项目 ${project.name} 将在 ${deadline} 截止，请及时处理！`
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
      returning_fields: ["id"]
    })
    
    return notification
  } catch (error) {
    console.error('记录通知失败:', error)
    throw error
  }
}