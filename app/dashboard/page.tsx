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
  Card,
  CardContent,
  Typography,
  CircularProgress
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useUser } from "@/app/contexts/user"
import Pagination from "@/app/components/Pagination"
import ProjectForm, { ProjectFormData } from "@/app/components/ProjectForm"

interface Project {
  id: number
  name: string
  bidding_deadline: string
  registration_deadline: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface PaginatedResponse {
  projects: Project[]
  total: number
  page: number
  pageSize: number
  error?: string
}

export default function DashboardPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 9
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchProjects(page)
  }, [page])

  const fetchProjects = async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects?status=pending&page=${pageNum}&pageSize=${pageSize}`)
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

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      // 刷新项目列表
      fetchProjects(page)
      
    } catch (err: any) {
      setError(err.message)
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
            onClick={() => setIsOpen(true)}
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

      <ProjectForm 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleCreateProject}
      />

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
            <Typography color="text.secondary">暂无待接单项目</Typography>
          </Paper>
        )}
      </motion.div>
    </Box>
  )
} 