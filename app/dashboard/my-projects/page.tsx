'use client'

import { 
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Card,
  CardContent
} from "@mui/material"
import { useEffect, useState, useCallback } from "react"
import { useUser } from "@/app/contexts/user"
import dayjs from "dayjs"
import type { Project, BidStatus } from "@/types/schema"
import { ArrowForward } from '@mui/icons-material'
import { useRouter } from "next/navigation"

// 修改状态配置的类型
const STATUS_CONFIG: Record<BidStatus, {
  label: string
  color: string
  bgColor: string
  gradient: string
}> = {
  pending: {
    label: '待接单',
    color: '#1976d2',
    bgColor: '#E3F2FD',
    gradient: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)'
  },
  registration: {
    label: '报名阶段',
    color: '#ed6c02',
    bgColor: '#FFF3E0',
    gradient: 'linear-gradient(45deg, #ed6c02 30%, #e65100 90%)'
  },
  deposit: {
    label: '保证金阶段',
    color: '#2e7d32',
    bgColor: '#E8F5E9',
    gradient: 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)'
  },
  preparation: {
    label: '上传阶段',
    color: '#9c27b0',
    bgColor: '#F3E5F5',
    gradient: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)'
  },
  bidding: {
    label: '报价阶段',
    color: '#0288d1',
    bgColor: '#E1F5FE',
    gradient: 'linear-gradient(45deg, #0288d1 30%, #0277bd 90%)'
  },
  completed: {
    label: '已完成',
    color: '#757575',
    bgColor: '#F5F5F5',
    gradient: 'linear-gradient(45deg, #757575 30%, #616161 90%)'
  }
}

export default function MyProjectsPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const router = useRouter()
  const [statusCounts, setStatusCounts] = useState({
    registration: 0,
    deposit: 0,
    preparation: 0,
    bidding: 0,
    completed: 0
  })

  const fetchProjects = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/my-projects?page=${pageNum + 1}&pageSize=${rowsPerPage}&stats=true`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setProjects(data.projects)
      setTotal(data.total)
      // 使用接口返回的统计数据
      setStatusCounts({
        registration: data.registration || 0,
        deposit: data.deposit || 0,
        preparation: data.preparation || 0,
        bidding: data.bidding || 0,
        completed: data.completed || 0
      })
    } catch (err) {
      console.error('获取项目失败:', err)
      setError(err instanceof Error ? err.message : '获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }, [rowsPerPage])

  useEffect(() => {
    fetchProjects(page)
  }, [page, fetchProjects])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: 'calc(100% - 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      {/* 统计卡片 */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(5, 1fr)'
        },
        gap: 2
      }}>
        {Object.entries(STATUS_CONFIG)
          .filter(([status]) => status !== 'pending')
          .map(([status, config]) => (
            <Card key={status} sx={{ background: config.gradient }}>
              <CardContent>
                <Typography sx={{ opacity: 0.8 }} color="white" variant="body2">
                  {config.label}
                </Typography>
                <Typography 
                  color="white" 
                  variant="h4" 
                  sx={{ 
                    mt: 1, 
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {statusCounts[status as keyof typeof statusCounts]}
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => router.push(`/dashboard/my-projects/status/${status}`)}
                  sx={{
                    color: 'white',
                    mt: 2,
                    opacity: 0.9,
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  查看详情
                </Button>
              </CardContent>
            </Card>
          ))}
      </Box>

      {/* 错误提示 */}
      {error && (
        <Paper sx={{ p: 2, bgcolor: '#FEE2E2' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* 表格区域 */}
      <Paper sx={{ 
        width: '100%', 
        overflow: 'hidden', 
        flex: 1
      }}>
        <TableContainer sx={{ maxHeight: 'calc(100% - 52px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell style={{ minWidth: 200 }} sx={{ fontWeight: 600 }}>项目名称</TableCell>
                <TableCell style={{ minWidth: 160 }} sx={{ fontWeight: 600 }}>开标时间</TableCell>
                <TableCell style={{ minWidth: 160 }} sx={{ fontWeight: 600 }}>报名截止</TableCell>
                <TableCell style={{ minWidth: 100 }} sx={{ fontWeight: 600 }}>状态</TableCell>
                <TableCell style={{ minWidth: 100 }} sx={{ fontWeight: 600 }}>操作</TableCell>
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
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
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
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每页行数"
        />
      </Paper>
    </Box>
  )
} 