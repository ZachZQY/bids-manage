'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Box, Typography, Button, CircularProgress,
  TextField, Stack
} from '@mui/material'
import dayjs from 'dayjs'
import type { Project } from '@/types/schema'

export default function PreparationTable() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)

  const fetchProjects = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/my-projects?status=preparation&page=${pageNum + 1}&pageSize=${rowsPerPage}`)
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
              <TableCell>电脑信息</TableCell>
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
                  <Stack spacing={1}>
                    <TextField
                      size="small"
                      label="MAC地址"
                      value={project.preparation_info?.mac_address || ''}
                      onChange={() => {/* 处理MAC地址变更 */}}
                    />
                    <TextField
                      size="small"
                      label="IP地址"
                      value={project.preparation_info?.ip_address || ''}
                      onChange={() => {/* 处理IP地址变更 */}}
                    />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)',
                      minWidth: 100
                    }}
                  >
                    上传标书
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