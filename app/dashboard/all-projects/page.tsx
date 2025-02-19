'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Chip,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  Button
} from '@mui/material'
import { Search, Sort } from '@mui/icons-material'
import dayjs from 'dayjs'
import type { Project, BidStatus } from '@/types/schema'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/contexts/user'
import { STATUS_CONFIG } from '../config'

export default function AllProjectsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  
  // 筛选和排序状态
  const [status, setStatus] = useState<BidStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'bidding_deadline' | 'registration_deadline'>('bidding_deadline')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 检查管理员权限
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard/projects')
    }
  }, [user, router])

  // 获取项目列表
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        ...(status !== 'all' && { status }),
        ...(search && { search }),
        sortBy,
        sortOrder
      })

      const res = await fetch(`/api/admin/projects?${queryParams}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setProjects(data.projects)
      setTotal(data.total)
    } catch (err) {
      console.error('获取项目失败:', err)
      setError(err instanceof Error ? err.message : '获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, status, search, sortBy, sortOrder])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 处理排序切换
  const handleToggleSort = () => {
    if (sortBy === 'bidding_deadline') {
      setSortBy('registration_deadline')
    } else {
      setSortBy('bidding_deadline')
    }
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <Box sx={{ 
      height: 'calc(100% - 48px)',
      display: 'flex',
      flexDirection: 'column',
      p: 3,
      gap: 3 
    }}>
      {/* 标题 */}
      <Typography variant="h6">全部项目</Typography>

      {/* 筛选工具栏 */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="状态"
            value={status}
            onChange={(e) => setStatus(e.target.value as BidStatus | 'all')}
            sx={{ width: 150 }}
            size="small"
          >
            <MenuItem value="all">全部</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            placeholder="搜索项目名称"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <IconButton onClick={handleToggleSort} sx={{ ml: 'auto' }}>
            <Sort />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            按{sortBy === 'bidding_deadline' ? '开标' : '报名'}时间
            {sortOrder === 'desc' ? '降序' : '升序'}
          </Typography>
        </Stack>
      </Paper>

      {/* 项目列表 */}
      <Paper sx={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <TableContainer sx={{ 
          flex: 1,
          overflow: 'auto'
        }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>项目名称</TableCell>
                <TableCell>开标时间</TableCell>
                <TableCell>报名截止</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>处理人</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {dayjs(project.bidding_deadline).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {dayjs(project.registration_deadline).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_CONFIG[project.status].label}
                      size="small"
                      sx={{
                        color: STATUS_CONFIG[project.status].color,
                        bgcolor: STATUS_CONFIG[project.status].bgColor,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {project.bid_user?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => router.push(`/dashboard/my-projects/project/${project.id}/detail`)}
                        sx={{ 
                          minWidth: 80,
                          color: STATUS_CONFIG[project.status].color,
                          borderColor: STATUS_CONFIG[project.status].color,
                          '&:hover': {
                            borderColor: STATUS_CONFIG[project.status].color,
                            backgroundColor: `${STATUS_CONFIG[project.status].bgColor}33`
                          }
                        }}
                      >
                        查看详情
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="每页行数"
        />
      </Paper>
    </Box>
  )
} 