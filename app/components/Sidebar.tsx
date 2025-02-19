'use client'

import {
  Box,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AssignmentInd as MyProjectsIcon,
  Logout as LogoutIcon
} from "@mui/icons-material"
import Link from 'next/link'
import { usePathname, useRouter, redirect } from 'next/navigation'
import { useUser } from '@/app/contexts/user'
import { useState } from 'react'

// 定义菜单项
const menuItems = [
  {
    path: '/dashboard/projects',
    label: '项目大厅',
    icon: <DashboardIcon />,
    roles: ['admin', 'staff']  // 所有角色可见
  },
  {
    path: '/dashboard/my-projects',
    label: '我的项目',
    icon: <MyProjectsIcon />,
    roles: ['admin', 'staff']  // 所有角色可见
  },
  {
    path: '/dashboard/all-projects',
    label: '全部项目',
    icon: <AssignmentIcon />,
    roles: ['admin']  // 仅管理员可见
  },
  {
    path: '/dashboard/users',
    label: '账号管理',
    icon: <PeopleIcon />,
    roles: ['admin']  // 仅管理员可见
  }
]

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearUser } = useUser()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // 根据用户角色过滤菜单项
  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || 'staff')
  )

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('登出失败')
      }

      clearUser()
      setLogoutDialogOpen(false)
    } catch (error) {
      console.error('登出错误:', error)
    }
    // 重定向到登录页面
    redirect('/login')
  }

  const handleMenuClick = (path: string) => {
    router.push(path)
    onClose()
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 标题区域 */}
      <Box sx={{
        p: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
        color: 'white'
      }}>
        <Typography variant="h6" sx={{
          fontWeight: 'bold',
          letterSpacing: 0.5
        }}>
          投标管理系统
        </Typography>
      </Box>

      {/* 导航菜单 */}
      <List component="nav" sx={{ flex: 1, p: 2 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleMenuClick(item.path)}
              selected={pathname === item.path}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: '#E3F2FD',
                  color: '#1976d2',
                  '&:hover': {
                    bgcolor: '#E3F2FD',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#1976d2',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: pathname === item.path ? 600 : 400
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* 用户信息和退出按钮 */}
      <Box sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: '#FAFAFA'
      }}>
        {/* 用户信息 */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1,
          mb: 2
        }}>
          <Avatar sx={{
            bgcolor: 'primary.main',
            width: 40,
            height: 40
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role === 'admin' ? '管理员' : '工作人员'}
            </Typography>
          </Box>
        </Box>

        {/* 退出登录按钮 */}
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            borderRadius: 2,
            py: 1
          }}
        >
          退出登录
        </Button>
      </Box>

      {/* 退出确认对话框 */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 400,
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1,
          fontSize: '1.25rem'
        }}>
          退出登录
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <DialogContentText sx={{
            color: 'text.primary',
            fontSize: '1rem',
            mt: 1
          }}>
            您确定要退出登录吗？退出后需要重新登录才能继续使用系统。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{
          px: 3,
          pb: 3,
          gap: 1
        }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            variant="outlined"
            color="inherit"
            sx={{
              minWidth: 100,
              borderRadius: 1.5
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            sx={{
              minWidth: 100,
              borderRadius: 1.5,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                bgcolor: 'error.dark'
              }
            }}
          >
            确认退出
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 