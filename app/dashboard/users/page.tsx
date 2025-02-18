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
  TablePagination
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { useEffect, useState, useCallback } from "react"
import dayjs from "dayjs"

interface User {
  id: number
  name: string
  code: string
  phone?: string
  role: 'admin' | 'staff'
  created_at: string
}

const ROLE_CONFIG = {
  admin: {
    label: '管理员',
    color: '#1976d2',
    bgColor: '#E3F2FD'
  },
  staff: {
    label: '员工',
    color: '#2e7d32',
    bgColor: '#E8F5E9'
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)  // 从 0 开始
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)

  const fetchUsers = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/users?page=${pageNum + 1}&pageSize=${rowsPerPage}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      console.error('获取用户列表失败:', err)
      setError(err instanceof Error ? err.message : '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [rowsPerPage])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  useEffect(() => {
    fetchUsers(page)
  }, [page, fetchUsers])

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: 'calc(100% - 48px)',  // 改为 100%
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      {/* 顶部操作区 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
            px: 3,
            py: 1
          }}
        >
          新增账号
        </Button>
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
                <TableCell style={{ minWidth: 120 }} sx={{ fontWeight: 600 }}>姓名</TableCell>
                <TableCell style={{ minWidth: 120 }} sx={{ fontWeight: 600 }}>登录暗号</TableCell>
                <TableCell style={{ minWidth: 120 }} sx={{ fontWeight: 600 }}>手机号</TableCell>
                <TableCell style={{ minWidth: 100 }} sx={{ fontWeight: 600 }}>角色</TableCell>
                <TableCell style={{ minWidth: 120 }} sx={{ fontWeight: 600 }}>创建时间</TableCell>
                <TableCell style={{ minWidth: 100 }} sx={{ fontWeight: 600 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>
                      {user.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {user.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {user.phone || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ROLE_CONFIG[user.role].label}
                      size="small"
                      sx={{ 
                        color: ROLE_CONFIG[user.role].color,
                        bgcolor: ROLE_CONFIG[user.role].bgColor,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {dayjs(user.created_at).format('YYYY-MM-DD')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      sx={{ minWidth: 80 }}
                    >
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 分页器 */}
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
    </Box>
  )
} 