import type { BidStatus } from "@/types/schema"

// 菜单项类型定义
export type MenuItemType = {
  label: string
  icon: 'Home' | 'Assignment' | 'Business' | 'People' | 'History' | 'Search'
  path: string
  breadcrumb: string
  roles: ('admin' | 'staff')[]
}

// 项目状态配置
export const STATUS_CONFIG: Record<BidStatus, {
  label: string
  color: string
  bgColor: string
  gradient: string
  actions?: {
    primary?: {
      label: string
      path: string
      modifyLabel?: string
    }
    secondary?: {
      label: string
      path: string
    }
  }
}> = {
  pending: {
    label: '待接单',
    color: '#1976d2',
    bgColor: '#E3F2FD',
    gradient: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
    actions: {
      primary: {
        label: '接单',
        path: 'registration'
      }
    }
  },
  registration: {
    label: '报名阶段',
    color: '#ed6c02',
    bgColor: '#FFF3E0',
    gradient: 'linear-gradient(45deg, #ed6c02 30%, #e65100 90%)',
    actions: {
      primary: {
        label: '提交报名',
        path: 'registration',
        modifyLabel: '修改报名'
      },
      secondary: {
        label: '撤单',
        path: 'cancel'
      }
    }
  },
  deposit: {
    label: '保证金阶段',
    color: '#2e7d32',
    bgColor: '#E8F5E9',
    gradient: 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)',
    actions: {
      primary: {
        label: '提交保证金',
        path: 'deposit'
      }
    }
  },
  preparation: {
    label: '上传阶段',
    color: '#9c27b0',
    bgColor: '#F3E5F5',
    gradient: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)',
    actions: {
      primary: {
        label: '提交上传',
        path: 'preparation'
      }
    }
  },
  bidding: {
    label: '报价阶段',
    color: '#0288d1',
    bgColor: '#E1F5FE',
    gradient: 'linear-gradient(45deg, #0288d1 30%, #0277bd 90%)',
    actions: {
      primary: {
        label: '提交报价',
        path: 'bidding'
      }
    }
  },
  completed: {
    label: '已完成',
    color: '#757575',
    bgColor: '#F5F5F5',
    gradient: 'linear-gradient(45deg, #757575 30%, #616161 90%)'
  }
}

// 菜单配置
export const MENU_CONFIG: MenuItemType[] = [
  {
    label: '接单大厅',
    icon: 'Home',
    path: '/dashboard/projects',
    breadcrumb: '接单大厅',
    roles: ['admin', 'staff']
  },
  {
    label: '我的项目',
    icon: 'Assignment',
    path: '/dashboard/my-projects',
    breadcrumb: '我的项目',
    roles: ['admin', 'staff']
  },
  {
    label: '全部项目',
    icon: 'Assignment',
    path: '/dashboard/all-projects',
    breadcrumb: '全部项目',
    roles: ['admin']
  },
  {
    label: '串标查询',
    icon: 'Search',
    path: '/dashboard/checks',
    breadcrumb: '串标查询',
    roles: ['admin', 'staff']
  },
  {
    label: '公司管理',
    icon: 'Business',
    path: '/dashboard/companies',
    breadcrumb: '公司管理',
    roles: ['admin']
  },
  {
    label: '账号管理',
    icon: 'People',
    path: '/dashboard/users',
    breadcrumb: '账号管理',
    roles: ['admin']
  },
  {
    label: '操作日志',
    icon: 'History',
    path: '/dashboard/logs',
    breadcrumb: '操作日志',
    roles: ['admin']
  }
]