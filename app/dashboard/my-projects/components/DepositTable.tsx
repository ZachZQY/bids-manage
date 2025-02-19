'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Box, Typography, Button, CircularProgress,
  Stack
} from '@mui/material'
import dayjs from 'dayjs'
import type { Project } from '@/types/schema'
import { STATUS_CONFIG } from '../../config'

export default function DepositTable() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)

  const fetchProjects = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/my-projects?status=deposit&page=${pageNum + 1}&pageSize=${rowsPerPage}`)
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

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TableContainer sx={{ flex: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>项目名称</TableCell>
              <TableCell>开标时间</TableCell>
              <TableCell>截止时间</TableCell>
              <TableCell>报名信息</TableCell>
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
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      电脑：{project.registration_info?.computer}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      网络：{project.registration_info?.network}
                    </Typography>
                  </Stack>
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
                      {STATUS_CONFIG[project.status].actions?.primary?.label}
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
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(+e.target.value)
          setPage(0)
        }}
        labelRowsPerPage="每页行数"
      />
    </Box>
  )
}