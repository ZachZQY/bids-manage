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
import type { Company } from '@/types/schema'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/contexts/user'

// 公司状态配置
const COMPANY_STATUS_CONFIG = {
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

export default function CompaniesPage() {
  const router = useRouter()
  const { user } = useUser()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  
  // 新增/编辑对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)

  // 检查管理员权限
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  // 获取公司列表
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        ...(status !== 'all' && { status }),
        ...(search && { search })
      })

      const res = await fetch(`/api/admin/companies?${queryParams}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setCompanies(data.companies)
      setTotal(data.total)
    } catch (err) {
      console.error('获取公司列表失败:', err)
      setError(err instanceof Error ? err.message : '获取公司列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, status, search])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const url = editingCompany 
        ? `/api/admin/companies/${editingCompany.id}`
        : '/api/admin/companies'
      
      const res = await fetch(url, {
        method: editingCompany ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('操作失败')
      }

      // 刷新列表
      await fetchCompanies()
      setDialogOpen(false)
      setEditingCompany(null)
      setFormData({
        name: '',
        status: 'active'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 标题和操作栏 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">公司管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingCompany(null)
            setDialogOpen(true)
          }}
        >
          新增公司
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
            placeholder="搜索公司名称"
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

      {/* 公司列表 */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>公司名称</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={COMPANY_STATUS_CONFIG[company.status].label}
                      size="small"
                      sx={{
                        color: COMPANY_STATUS_CONFIG[company.status].color,
                        bgcolor: COMPANY_STATUS_CONFIG[company.status].bgColor,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(company.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setEditingCompany(company)
                        setFormData({
                          name: company.name,
                          status: company.status
                        })
                        setDialogOpen(true)
                      }}
                    >
                      编辑
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
          {editingCompany ? '编辑公司' : '新增公司'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="公司名称"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
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