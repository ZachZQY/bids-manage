'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Box, Typography, Button, CircularProgress,
  Stack, Chip
} from '@mui/material'
import dayjs from 'dayjs'
import type { Project } from '@/types/schema'
import { DepositType } from '@/types/schema'
import { STATUS_CONFIG } from '../../config'

// 保证金方式显示配置
const DEPOSIT_TYPE_CONFIG = {
  [DepositType.INSURANCE]: { label: '保证金保险', color: '#1976d2' },
  [DepositType.BANK_GUARANTEE]: { label: '银行保函', color: '#2e7d32' },
  [DepositType.TRANSFER]: { label: '网银汇款', color: '#ed6c02' },
  [DepositType.NONE]: { label: '不收取保证金', color: '#757575' }
}

export default function PreparationTable() {
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
              <TableCell width="20%">项目名称</TableCell>
              <TableCell width="15%">开标时间</TableCell>
              <TableCell width="15%">截止时间</TableCell>
              <TableCell width="15%">报名电脑</TableCell>
              <TableCell width="15%">报名网络</TableCell>
              <TableCell width="10%">保证金方式</TableCell>
              <TableCell width="10%">操作</TableCell>
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
                    {project.registration_info?.computer || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="text.secondary">
                    {project.registration_info?.network || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {project.deposit_info?.type && (
                    <Chip
                      label={DEPOSIT_TYPE_CONFIG[project.deposit_info.type].label}
                      size="small"
                      sx={{
                        color: DEPOSIT_TYPE_CONFIG[project.deposit_info.type].color,
                        bgcolor: 'rgba(0, 0, 0, 0.08)',
                        fontWeight: 500
                      }}
                    />
                  )}
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