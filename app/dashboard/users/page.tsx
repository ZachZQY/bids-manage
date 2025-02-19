'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material'
import { Search, Add } from '@mui/icons-material'
import type { User } from '@/types/schema'
import { useRouter } from 'next/navigation'

// 用户状态配置
const USER_STATUS_CONFIG = {
  active: {
    label: '启用',
    color: '#2e7d32',
    bgColor: '#E8F5E9'
  },
  inactive: {
    label: '禁用',
    color: '#d32f2f',
    bgColor: '#FFEBEE'
  }
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  
  // 新增/编辑对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    role: 'staff',
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        ...(status !== 'all' && { status }),
        ...(search && { search })
      })

      const res = await fetch(`/api/admin/users?${queryParams}`)
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
  }, [page, rowsPerPage, status, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users'
      
      const res = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('操作失败')
      }

      // 刷新列表
      await fetchUsers()
      setDialogOpen(false)
      setEditingUser(null)
      setFormData({
        name: '',
        code: '',
        phone: '',
        role: 'staff',
        status: 'active'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 处理状态切换
  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: user.status === 'active' ? 'inactive' : 'active'
        })
      })

      if (!res.ok) {
        throw new Error('操作失败')
      }

      // 刷新列表
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 标题和操作栏 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">账号管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingUser(null)
            setDialogOpen(true)
          }}
        >
          新增账号
        </Button>
      </Stack>

      {/* 筛选工具栏 */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="状态"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')}
            sx={{ width: 150 }}
            size="small"
          >
            <MenuItem value="all">全部</MenuItem>
            <MenuItem value="active">启用</MenuItem>
            <MenuItem value="inactive">禁用</MenuItem>
          </TextField>

          <TextField
            placeholder="搜索账号/姓名"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </Stack>
      </Paper>

      {/* 用户列表 */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>登录暗号</TableCell>
                <TableCell>姓名</TableCell>
                <TableCell>手机号</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.code}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? '管理员' : '员工'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={USER_STATUS_CONFIG[user.status].label}
                      size="small"
                      sx={{
                        color: USER_STATUS_CONFIG[user.status].color,
                        bgcolor: USER_STATUS_CONFIG[user.status].bgColor,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditingUser(user)
                          setFormData({
                            name: user.name,
                            code: user.code,
                            phone: user.phone || '',
                            role: user.role,
                            status: user.status
                          })
                          setDialogOpen(true)
                        }}
                      >
                        编辑
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
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="每页行数"
        />
      </Paper>

      {/* 新增/编辑对话框 */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? '编辑账号' : '新增账号'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="登录暗号"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              disabled={!!editingUser}
              fullWidth
            />
            <TextField
              label="姓名"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="手机号"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>角色</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                label="角色"
              >
                <MenuItem value="admin">管理员</MenuItem>
                <MenuItem value="staff">员工</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>状态</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                label="状态"
              >
                <MenuItem value="active">启用</MenuItem>
                <MenuItem value="inactive">禁用</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '确认'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 