'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  MenuItem,
  TableRow,
  TableCell,
  CircularProgress
} from '@mui/material'
import { Search } from '@mui/icons-material'
import type { User } from '@/types/schema'
import { useRouter } from 'next/navigation'
import CommonList from '@/app/components/CommonList'

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

// 角色配置
const ROLE_CONFIG = {
  admin: '管理员',
  staff: '普通用户'
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

  return (
    <>
      <CommonList
        loading={loading}
        error={error}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        showCreateButton
        createButtonText="新增账号"
        onCreateClick={() => {
          setEditingUser(null)
          setDialogOpen(true)
        }}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        filterComponent={
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
        }
        tableHead={
          <TableRow>
            <TableCell sx={{ minWidth: 80 }}>ID</TableCell>
            <TableCell sx={{ minWidth: 120 }}>账号</TableCell>
            <TableCell sx={{ minWidth: 100 }}>姓名</TableCell>
            <TableCell sx={{ minWidth: 120 }}>手机号</TableCell>
            <TableCell sx={{ minWidth: 100 }}>角色</TableCell>
            <TableCell sx={{ minWidth: 100 }}>状态</TableCell>
            <TableCell sx={{ minWidth: 160 }}>创建时间</TableCell>
            <TableCell sx={{ minWidth: 120, position: 'sticky', right: 0, bgcolor: 'background.paper' }}>操作</TableCell>
          </TableRow>
        }
        tableBody={
          users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.code}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>{ROLE_CONFIG[user.role]}</TableCell>
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
              <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
              <TableCell sx={{ position: 'sticky', right: 0, bgcolor: 'background.paper' }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingUser(user)
                      setFormData({
                        name: user.name,
                        code: user.code,
                        phone: user.phone||"",
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
          ))
        }
      />

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)}>
        <DialogTitle>{editingUser ? '编辑账号' : '新增账号'}</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="账号"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              disabled={submitting || !!editingUser}
            />
            <TextField
              label="姓名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={submitting}
            />
            <TextField
              label="手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={submitting}
            />
            <TextField
              select
              label="角色"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={submitting}
            >
              {Object.entries(ROLE_CONFIG).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="状态"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={submitting}
            >
              <MenuItem value="active">启用</MenuItem>
              <MenuItem value="inactive">禁用</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : '确定'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}