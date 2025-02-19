'use client'

import { 
  Box, 
  Breadcrumbs as MuiBreadcrumbs, 
  Typography
} from '@mui/material'
import { usePathname } from 'next/navigation'
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material'

// 定义路径映射
const PATH_MAP: Record<string, string> = {
  'dashboard': '首页',
  'projects': '项目大厅',
  'my-projects': '我的项目',
  'all-projects': '全部项目',
  'users': '账号管理'
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)
  
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
              {PATH_MAP[path] || path}
            </Typography>
          )
        })}
      </MuiBreadcrumbs>
    </Box>
  )
} 