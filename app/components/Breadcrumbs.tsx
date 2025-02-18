'use client'

import { 
  Box, 
  Breadcrumbs as MuiBreadcrumbs, 
  Typography,
  Link
} from '@mui/material'
import { usePathname } from 'next/navigation'
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material'

// 定义路径映射
const PATH_MAP: Record<string, string> = {
  'dashboard': '首页',
  'projects': '项目大厅',
  'create': '发布新项目',
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
          const href = `/${paths.slice(0, index + 1).join('/')}`
          
          return isLast ? (
            <Typography 
              key={path}
              color="text.primary"
              sx={{ 
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            >
              {PATH_MAP[path] || path}
            </Typography>
          ) : (
            <Link
              key={path}
              href={href}
              underline="hover"
              color="inherit"
              sx={{ 
                fontSize: '0.875rem',
                '&:hover': {
                  color: 'primary.main'
                }
              }}
            >
              {PATH_MAP[path] || path}
            </Link>
          )
        })}
      </MuiBreadcrumbs>
    </Box>
  )
} 