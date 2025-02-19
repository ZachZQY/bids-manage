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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { useEffect, useState, useCallback } from "react"
import { useUser } from "@/app/contexts/user"
import dayjs from "dayjs"
import { useRouter } from 'next/navigation'
import { STATUS_CONFIG } from '../config'

interface Project {
  id: number
  name: string
  bidding_deadline: number
  registration_deadline: number
  status: 'pending'
  bid_user_bid_users?: boolean
}

export default function ProjectsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    projectId?: number
    projectName?: string
  }>({
    open: false
  })

  const fetchProjects = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects?status=pending&page=${pageNum + 1}&pageSize=${rowsPerPage}`)
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
  }, [rowsPerPage])

  const handleTakeProject = async (projectId: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/take`, {
        method: 'POST'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      fetchProjects(page)
    } catch (err) {
      console.error('接单失败:', err)
      setError(err instanceof Error ? err.message : '接单失败')
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  useEffect(() => {
    fetchProjects(page)
  }, [page, fetchProjects])

  // 打开确认弹窗
  const handleOpenConfirm = (projectId: number, projectName: string) => {
    setConfirmDialog({
      open: true,
      projectId,
      projectName
    })
  }

  // 关闭确认弹窗
  const handleCloseConfirm = () => {
    setConfirmDialog({
      open: false
    })
  }

  // 确认接单
  const handleConfirmTake = async () => {
    if (!confirmDialog.projectId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/projects/${confirmDialog.projectId}/take`, {
        method: 'POST'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      // 刷新项目列表
      fetchProjects(page)
      handleCloseConfirm()
    } catch (err) {
      console.error('接单失败:', err)
      setError(err instanceof Error ? err.message : '接单失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      {/* 顶部操作区 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/dashboard/projects/create')}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
              px: 3,
              py: 1
            }}
          >
            发布项目
          </Button>
        )}
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
                    <Typography sx={{ 
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
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
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenConfirm(project.id, project.name)}
                      disabled={!!project.bid_user_bid_users}
                      sx={{
                        background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                        minWidth: 80
                      }}
                    >
                      {project.bid_user_bid_users ? '已指定' : '接单'}
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

      {/* 确认弹窗 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          确认接单
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ pt: 1 }}>
            您确定要接单项目 <strong>{confirmDialog.projectName}</strong> 吗？
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              接单后：
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                • 项目将从项目大厅移至您的个人项目列表
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                • 您将负责该项目的后续工作
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                • 请确保您有足够的时间和精力处理该项目
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseConfirm}
            variant="outlined"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirmTake}
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #0d47a1 90%)',
              }
            }}
          >
            {loading ? '处理中...' : '确认接单'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 