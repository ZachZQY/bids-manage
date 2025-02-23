'use client'

import { 
  Box, 
  Breadcrumbs as MuiBreadcrumbs, 
  Typography
} from '@mui/material'
import { usePathname } from 'next/navigation'
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material'
import { MENU_CONFIG } from '../config'

// 定义路径映射（仅包含特殊路径，菜单路径从MENU_CONFIG中获取）
const SPECIAL_PATH_MAP: Record<string, string> = {
  'dashboard': '首页',
  'create': '发布项目',
  'detail': '项目详情',
  'registration': '提交报名',
  'deposit': '提交保证金',
  'preparation': '提交上传',
  'bidding': '提交报价',
  'project': '项目'
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)
  
  // 获取路径对应的显示名称
  const getPathLabel = (path: string) => {
    // 先从菜单配置中查找
    const menuItem = MENU_CONFIG.find(item => item.path.includes(`/${path}`))
    if (menuItem) {
      return menuItem.breadcrumb || menuItem.label
    }
    // 再从特殊路径映射中查找
    return SPECIAL_PATH_MAP[path] || path
  }
  
  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1
          
          return (
            <Typography 
              key={path}
              color={isLast ? "text.primary" : "text.secondary"}
              sx={{ 
                fontWeight: isLast ? 500 : 400,
                fontSize: '0.875rem'
              }}
            >
              {getPathLabel(path)}
            </Typography>
          )
        })}
      </MuiBreadcrumbs>
    </Box>
  )
}