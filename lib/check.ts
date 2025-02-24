import { db } from '@/lib/db'
import type { Project, PreparationInfo, RegistrationInfo } from '@/types/schema'

interface CheckField {
  key: string;
  label: string;
  path: string[];
}

// 需要检查的字段配置
const CHECK_FIELDS: CheckField[] = [
  { key: 'contact_person', label: '报名联系人', path: ['registration_info', 'contact_person'] },
  { key: 'contact_mobile', label: '报名联系手机', path: ['registration_info', 'contact_mobile'] },
  { key: 'contact_phone', label: '报名座机号码', path: ['registration_info', 'contact_phone'] },
  { key: 'contact_email', label: '报名预留邮箱', path: ['registration_info', 'contact_email'] },
  { key: 'reg_network', label: '报名网络', path: ['registration_info', 'network'] },
  { key: 'reg_computer', label: '报名电脑', path: ['registration_info', 'computer'] },
  { key: 'prep_computer', label: '上传电脑', path: ['preparation_info', 'computer'] },
  { key: 'prep_network', label: '上传网络', path: ['preparation_info', 'network'] },
  { key: 'mac_address', label: '上传mac', path: ['preparation_info', 'mac_address'] },
  { key: 'ip_address', label: '上传ip', path: ['preparation_info', 'ip_address'] }
]

// 获取字段值
function getFieldValue(project: Project, path: string[]): string | undefined {
  let value: any = project
  for (const key of path) {
    if (!value || typeof value !== 'object') return undefined
    value = value[key]
  }
  return value
}

// 检查两个项目是否存在相同的值
function findConflicts(project1: Project, project2: Project): string[] {
  const conflicts: string[] = []
  
  for (const field of CHECK_FIELDS) {
    const value1 = getFieldValue(project1, field.path)
    const value2 = getFieldValue(project2, field.path)
    
    if (value1 && value2 && value1 === value2) {
      conflicts.push(field.label)
    }
  }
  
  return conflicts
}

/**
 * 执行串标检测
 * @param projectId 当前项目ID
 * @returns 返回检测结果，如果发现串标则返回true
 */
export async function checkBidConflict(
  projectId: number
): Promise<boolean> {
  try {
    // 获取当前项目信息
    const { datas: currentProject } = await db.find({
      name: "bid_projects",
      args: {
        where: {
          id: { _eq: projectId }
        }
      },
      fields: [
        "id",
        "name",
        "registration_info",
        "preparation_info",
        {
          name: "bid_company",
          fields: ["id", "name"]
        }
      ]
    })

    const projectName = currentProject[0]?.name
    const companyName = currentProject[0]?.bid_company?.name

    if (!currentProject || currentProject.length === 0) {
      throw new Error('项目不存在')
    }

    // 获取同名项目
    const { datas: sameNameProjects } = await db.find({
      name: "bid_projects",
      args: {
        where: {
          name: { _eq: projectName },
          id: { _neq: projectId }
        }
      },
      fields: [
        "id",
        "name",
        "registration_info",
        "preparation_info",
        {
          name: "bid_company",
          fields: ["id", "name"]
        }
      ]
    })

    if (!sameNameProjects || sameNameProjects.length === 0) {
      return false
    }

    // 检查每个同名项目是否存在冲突
    const conflictProjects: Array<{
      projectId: number;
      companyName: string;
      conflicts: string[];
    }> = []

    for (const project of sameNameProjects) {
      const conflicts = findConflicts(currentProject[0], project)
      if (conflicts.length > 0) {
        conflictProjects.push({
          projectId: project.id,
          companyName: project.bid_company?.name || '',
          conflicts
        })
      }
    }

    // 如果发现冲突，记录到数据库
    if (conflictProjects.length > 0) {
      // 创建检测记录
      const check = await db.mutationGetFirstOne({
        name: "insert_bid_checks",
        args: {
          objects: [{
            bid_project_bid_projects: projectId,
            project_name: projectName,
            company_name: companyName,
            is_resolve: false
          }]
        },
        returning_fields: ["id"]
      })

      // 创建项目冲突记录
      await db.mutationGetFirstOne({
        name: "insert_bid_checks_projects",
        args: {
          objects: conflictProjects.map(conflict => ({
            bid_check_bid_checks: check.id,
            bid_project_bid_projects: conflict.projectId,
            company_name: conflict.companyName,
            conflict_content: conflict.conflicts.join('、')
          }))
        },
        returning_fields: ["id"]
      })

      return true
    }

    return false
  } catch (error) {
    console.error('串标检测失败:', error)
    return false
  }
}
