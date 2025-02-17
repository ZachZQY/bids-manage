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
import { Add } from "@mui/icons-material"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Pagination from "@/app/components/Pagination"

interface User {
  id: number
  name: string
  code: string
  role: 'admin' | 'staff'
  phone: string
  created_at: string
}

interface PaginatedResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
  error?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  const fetchUsers = async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/users?page=${pageNum}&pageSize=${pageSize}`)
      const data: PaginatedResponse = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setUsers(data.users)
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          账号列表
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
            px: 3,
            py: 1
          }}
        >
          添加账号
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, bgcolor: '#FEE2E2' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>用户名</TableCell>
                <TableCell>登录暗号</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>手机号码</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>
                      {user.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ 
                      bgcolor: 'grey.100', 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      display: 'inline-block'
                    }}>
                      <code>{user.code}</code>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role === 'admin' ? '管理员' : '工作人员'}
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                      sx={user.role === 'admin' ? { bgcolor: '#E3F2FD' } : {}}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {user.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {new Date(user.created_at).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                      >
                        编辑
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                      >
                        删除
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
            />
          )}
        </TableContainer>

        {users.length === 0 && !error && (
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#F8F9FA' }}>
            <Typography color="text.secondary">暂无用户数据</Typography>
          </Paper>
        )}
      </motion.div>
    </Box>
  )
} 