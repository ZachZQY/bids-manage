'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Box, Typography, Button, CircularProgress,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import type { Project } from '@/types/schema'
import { STATUS_CONFIG } from '../../config'

export default function RegistrationTable() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)

  // 撤单确认对话框状态
  const [cancelDialog, setCancelDialog] = useState(false)
  const [cancellingProject, setCancellingProject] = useState<Project | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchProjects = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/my-projects?status=registration&page=${pageNum + 1}&pageSize=${rowsPerPage}`)
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

  useEffect(() => {
    fetchProjects(page)
  }, [page, fetchProjects])

  // 处理撤单
  const handleCancelProject = async () => {
    if (!cancellingProject) return
    
    try {
      setSubmitting(true)
      const res = await fetch(`/api/my-projects/project/${cancellingProject.id}/cancel`, {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('撤单失败')
      }

      // 刷新数据
      await fetchProjects(page)
      setCancelDialog(false)
      setCancellingProject(null)
    } catch (err) {
      console.error('撤单失败:', err)
      setError(err instanceof Error ? err.message : '撤单失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TableContainer sx={{ flex: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>项目名称</TableCell>
              <TableCell>开标时间</TableCell>
              <TableCell>报名截止时间</TableCell>
              <TableCell>报名状态</TableCell>
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
                  <Typography color="text.secondary">
                    {project.registration_info ? '已提交' : '未提交'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => router.push(`/dashboard/my-projects/project/${project.id}/${STATUS_CONFIG[project.status].actions?.primary?.path}`)}
                      sx={{
                        background: STATUS_CONFIG[project.status].gradient
                      }}
                    >
                      {project.registration_info 
                        ? STATUS_CONFIG[project.status].actions?.primary?.modifyLabel 
                        : STATUS_CONFIG[project.status].actions?.primary?.label}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push(`/dashboard/my-projects/project/${project.id}/detail`)}
                      sx={{ minWidth: 80 }}
                    >
                      详情
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 撤单确认对话框 */}
      <Dialog
        open={cancelDialog}
        onClose={() => !submitting && setCancelDialog(false)}
      >
        <DialogTitle>确认撤单</DialogTitle>
        <DialogContent>
          <Typography>
            确定要撤销该项目吗？撤单后项目将退回到项目大厅，可供其他人接单。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialog(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={handleCancelProject}
            variant="contained"
            color="error"
            disabled={submitting}
          >
            {submitting ? '撤单中...' : '确认撤单'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  )
}