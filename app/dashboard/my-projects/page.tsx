'use client'

import { 
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Chip,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button
} from "@mui/material"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useUser } from "@/app/contexts/user"
import Pagination from "@/app/components/Pagination"

interface Project {
  id: number
  name: string
  bidding_deadline: string
  registration_deadline: string
  status: 'in_progress' | 'completed'
}

export default function MyProjectsPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchProjects()
  }, [page])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/my-projects?page=${page}&pageSize=${pageSize}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setProjects(data.projects || [])
      setTotal(data.total || 0)
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
      {/* 顶部统计 */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Card sx={{ 
          background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
          minWidth: 200 
        }}>
          <CardContent>
            <Typography sx={{ opacity: 0.8 }} color="white" variant="body2">
              进行中项目
            </Typography>
            <Typography color="white" variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
              {projects.filter(p => p.status === 'in_progress').length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ 
          background: 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)',
          minWidth: 200 
        }}>
          <CardContent>
            <Typography sx={{ opacity: 0.8 }} color="white" variant="body2">
              已完成项目
            </Typography>
            <Typography color="white" variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
              {projects.filter(p => p.status === 'completed').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Paper sx={{ p: 2, bgcolor: '#FEE2E2' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* 项目列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
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
                      label={project.status === 'in_progress' ? '进行中' : '已完成'}
                      color={project.status === 'in_progress' ? 'primary' : 'success'}
                      size="small"
                      sx={{ 
                        bgcolor: project.status === 'in_progress' ? '#E3F2FD' : '#E8F5E9'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      color={project.status === 'in_progress' ? 'primary' : 'success'}
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {projects.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
            />
          </Box>
        )}

        {projects.length === 0 && !error && (
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#F8F9FA' }}>
            <Typography color="text.secondary">暂无项目数据</Typography>
          </Paper>
        )}
      </motion.div>
    </Box>
  )
} 