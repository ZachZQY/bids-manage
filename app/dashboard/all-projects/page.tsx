'use client'

import { 
  Paper,
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  TableContainer,
  Button,
  Chip,
  Box,
  Typography,
  CircularProgress
} from "@mui/material"
import { useEffect, useState } from "react"
import Pagination from "@/app/components/Pagination"
import type { BidStatus } from "@/types/schema"

interface Project {
  id: number
  name: string
  bidding_deadline: string
  registration_deadline: string
  status: BidStatus
}

interface PaginatedResponse {
  projects: Project[]
  total: number
  page: number
  pageSize: number
  error?: string
}

const statusMap = {
  pending: { label: '待接单', color: 'info' },
  registration: { label: '报名阶段', color: 'primary' },
  deposit: { label: '保证金阶段', color: 'secondary' },
  preparation: { label: '上传阶段', color: 'warning' },
  bidding: { label: '报价阶段', color: 'error' },
  completed: { label: '已完成', color: 'success' }
} as const

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchProjects(page)
  }, [page])

  const fetchProjects = async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects?page=${pageNum}&pageSize=${pageSize}`)
      const data: PaginatedResponse = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setProjects(data.projects)
      setTotal(data.total)
    } catch (err: any) {
      setError(err.message)
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
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 500 }}>
        全部项目
      </Typography>

      {error && (
        <Paper sx={{ p: 2, bgcolor: '#FEE2E2' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <div>
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>项目名称</TableCell>
                <TableCell>开标时间</TableCell>
                <TableCell>报名截止</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {new Date(project.bidding_deadline).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {new Date(project.registration_deadline).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusMap[project.status].label}
                      color={statusMap[project.status].color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {projects.length > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
            />
          )}
        </TableContainer>

        {projects.length === 0 && !error && (
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#F8F9FA' }}>
            <Typography color="text.secondary">暂无项目数据</Typography>
          </Paper>
        )}
      </div>
    </Box>
  )
} 