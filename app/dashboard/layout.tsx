'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Paper
} from "@mui/material"
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AssignmentInd as MyProjectsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon
} from "@mui/icons-material"
import { useUser } from '@/app/contexts/user'
import { useState } from 'react'

// 定义菜单项
const menuItems = [
  {
    path: '/dashboard/projects',
    label: '项目大厅',
    icon: <DashboardIcon />
  },
  {
    path: '/dashboard/my-projects',
    label: '我的项目',
    icon: <MyProjectsIcon />
  },
  {
    path: '/dashboard/all-projects',
    label: '全部项目',
    icon: <AssignmentIcon />
  },
  {
    path: '/dashboard/users',
    label: '账号管理',
    icon: <PeopleIcon />
  }
]

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearUser } = useUser()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    // 如果没有用户信息，重定向到登录页
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // 如果没有用户信息，不渲染内容
  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      // 调用登出 API
      const res = await fetch('/api/logout', {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('登出失败')
      }

      // 清除本地状态
      clearUser()
      
      // 关闭菜单
      setAnchorEl(null)
      
      // 重定向到登录页
      router.push('/login')
    } catch (error) {
      console.error('登出错误:', error)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Paper
        sx={{
          width: 280,
          borderRadius: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            投标管理系统
          </Typography>
        </Box>
        
        <Divider />

        <List component="nav" sx={{ flex: 1, px: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                href={item.path}
                selected={pathname === item.path}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'admin' ? '管理员' : '工作人员'}
              </Typography>
            </Box>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          退出登录
        </MenuItem>
      </Menu>

      {/* 主内容区 */}
      <Box
        sx={{ flex: 1, bgcolor: 'grey.50' }}
      >
        {children}
      </Box>
    </Box>
  )
} 