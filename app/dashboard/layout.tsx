'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, IconButton, useMediaQuery, useTheme, Drawer, Typography } from "@mui/material"
import { Menu as MenuIcon } from '@mui/icons-material'
import { useUser } from '@/app/contexts/user'
import Sidebar from '@/app/components/Sidebar'
import Breadcrumbs from '@/app/components/Breadcrumbs'

const DRAWER_WIDTH = 240

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useUser()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) return null

  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#F5F5F5'
      }}
    >
      {/* 移动端菜单按钮 */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            bgcolor: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            zIndex: 1100,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: 500 }}>
            投标管理系统
          </Typography>
        </Box>
      )}

      {/* 桌面端固定侧边栏 */}
      {!isMobile && (
        <Box 
          component="aside"
          sx={{ 
            width: DRAWER_WIDTH,
            flexShrink: 0,
            position: 'fixed',
            height: '100vh',
            bgcolor: 'white',
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 0 10px rgba(0,0,0,0.05)'
          }}
        >
          <Sidebar onClose={() => {}} />
        </Box>
      )}

      {/* 移动端抽屉式侧边栏 */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true // 为了更好的移动端性能
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              bgcolor: 'white',
              boxShadow: '0 0 10px rgba(0,0,0,0.05)'
            },
          }}
        >
          <Sidebar onClose={handleDrawerToggle} />
        </Drawer>
      )}

      {/* 主内容区域 */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          marginLeft: { xs: 0, md: `${DRAWER_WIDTH}px` },
          minWidth: 0,
          p: { xs: 2, md: 3 },
          pt: { xs: '72px', md: 3 },
          height: '100vh',
          overflow: 'auto',
          bgcolor: '#F5F5F5',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.2)'
            }
          }
        }}
      >
        {/* 面包屑导航 */}
        <Breadcrumbs />
        
        {/* 页面内容 */}
        {children}
      </Box>
    </Box>
  )
} 