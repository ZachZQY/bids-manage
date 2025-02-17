'use client'

import { 
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { useEffect, useState, useCallback } from "react"
import { useUser } from "@/app/contexts/user"
import Pagination from "@/app/components/Pagination"

interface Project {
  id: number
  name: string
  bidding_deadline: string
  registration_deadline: string
  status: 'pending'
}

export default function ProjectsPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const fetchProjects = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects?status=pending&page=${pageNum}&pageSize=${pageSize}`)
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
  }, [pageSize])

  useEffect(() => {
    fetchProjects(page)
  }, [page, fetchProjects])

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 顶部统计和操作区 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Card sx={{ 
          background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
          minWidth: 200 
        }}>
          <CardContent>
            <Typography sx={{ opacity: 0.8 }} color="white" variant="body2">
              待接单项目
            </Typography>
            <Typography color="white" variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
              {total}
            </Typography>
          </CardContent>
        </Card>

        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
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

      {error && (
        <Paper sx={{ p: 2, bgcolor: '#FEE2E2' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* 项目列表 */}
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
                    label="待接单"
                    color="primary"
                    size="small"
                    sx={{ bgcolor: '#E3F2FD' }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                    }}
                  >
                    接单
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {projects.length === 0 && !error && (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#F8F9FA' }}>
          <Typography color="text.secondary">暂无待接单项目</Typography>
        </Paper>
      )}

      {projects.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={setPage}
        />
      )}
    </Box>
  )
} 