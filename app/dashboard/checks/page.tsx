'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  TableRow,
  TableCell,
  Chip,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel
} from "@mui/material"
import { Search, Info } from "@mui/icons-material"
import { useUser } from '@/app/contexts/user'
import CommonList from '@/app/components/CommonList'
import type { Tables } from '@/types/schema'

type BidCheck = Tables['bid_checks'] & {
  bid_checks_projects: Tables['bid_checks_projects'][]
}

export default function ChecksPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [checks, setChecks] = useState<BidCheck[]>([])
  const [search, setSearch] = useState('')
  const [isResolved, setIsResolved] = useState<string | null>(null)
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCheck, setSelectedCheck] = useState<BidCheck | null>(null)
  const [resolveContent, setResolveContent] = useState('')

  // 获取串标检测记录
  const fetchChecks = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        sortField,
        sortOrder
      })

      if (search) {
        params.append('projectName', search)
      }
      if (isResolved !== null) {
        params.append('isResolved', isResolved)
      }
      
      const res = await fetch(`/api/checks?${params}`)
      if (!res.ok) {
        throw new Error('获取数据失败')
      }
      
      const data = await res.json()
      setChecks(data.checks || [])
      setTotal(data.pagination.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChecks()
  }, [page, rowsPerPage, search, isResolved, sortField, sortOrder])

  // 处理排序
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // 处理串标问题
  const handleResolve = async () => {
    if (!selectedCheck) return
    
    try {
      setLoading(true)
      setError('')
      
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedCheck.id,
          resolveContent
        })
      })
      
      if (!res.ok) {
        throw new Error('操作失败')
      }
      
      // 刷新列表
      await fetchChecks()
      setDialogOpen(false)
      setSelectedCheck(null)
      setResolveContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <>
      <CommonList
        loading={loading}
        error={error}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        filterComponent={
          <Stack direction="row" spacing={2}>
            <TextField
              placeholder="搜索项目名称"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ width: 200 }}
              InputProps={{
                startAdornment: (
                  <Search fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                )
              }}
            />
            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth size="small">
                <InputLabel>状态</InputLabel>
                <Select
                  value={isResolved === null ? '' : isResolved}
                  onChange={(e) => setIsResolved(e.target.value === '' ? null : e.target.value)}
                  label="状态"
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="true">已解决</MenuItem>
                  <MenuItem value="false">未解决</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        }
        tableHead={
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortField === 'id'}
                direction={sortField === 'id' ? sortOrder : 'asc'}
                onClick={() => handleSort('id')}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'project_name'}
                direction={sortField === 'project_name' ? sortOrder : 'asc'}
                onClick={() => handleSort('project_name')}
              >
                项目名称
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'company_name'}
                direction={sortField === 'company_name' ? sortOrder : 'asc'}
                onClick={() => handleSort('company_name')}
              >
                投标公司
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'is_resolve'}
                direction={sortField === 'is_resolve' ? sortOrder : 'asc'}
                onClick={() => handleSort('is_resolve')}
              >
                状态
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'created_at'}
                direction={sortField === 'created_at' ? sortOrder : 'asc'}
                onClick={() => handleSort('created_at')}
              >
                创建时间
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ minWidth: 120, position: 'sticky', right: 0, bgcolor: 'background.paper' }}>操作</TableCell>
          </TableRow>
        }
        tableBody={
          checks.map((check) => (
            <TableRow key={check.id} hover>
              <TableCell>{check.id}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  {check.project_name}
                  <Tooltip title="查看详情">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedCheck(check)
                        setDialogOpen(true)
                      }}
                    >
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell>{check.company_name}</TableCell>
              <TableCell>
                <Chip
                  label={check.is_resolve ? '已解决' : '未解决'}
                  size="small"
                  color={check.is_resolve ? 'success' : 'error'}
                />
              </TableCell>
              <TableCell>{new Date(check.created_at).toLocaleString()}</TableCell>
              <TableCell sx={{ position: 'sticky', right: 0, bgcolor: 'background.paper' }}>
                {!check.is_resolve && (
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedCheck(check)
                      setDialogOpen(true)
                    }}
                  >
                    处理
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        }
      />

      {/* 处理串标对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setSelectedCheck(null)
          setResolveContent('')
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          串标详情
          {selectedCheck?.is_resolve && (
            <Chip
              label="已解决"
              size="small"
              color="success"
              sx={{ ml: 1 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              项目名称
            </Typography>
            <Typography variant="body1">
              {selectedCheck?.project_name}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              投标公司
            </Typography>
            <Typography variant="body1">
              {selectedCheck?.company_name}
            </Typography>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            检测时间
          </Typography>
          <Typography variant="body1">
            {selectedCheck && new Date(selectedCheck.created_at).toLocaleString()}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              串标信息
            </Typography>
            {selectedCheck?.bid_checks_projects?.map((project, index) => (
              <Box
                key={project.id}
                sx={{
                  mb: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  关联公司 {index + 1}: {project.company_name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  冲突内容:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {project.conflict_content?.split('、').map((item, i) => (
                    <Chip
                      key={i}
                      label={item}
                      size="small"
                      color="warning"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  检测时间: {new Date(project.created_at).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Box>

          {selectedCheck?.is_resolve ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                解决说明
              </Typography>
              <Typography variant="body1">
                {selectedCheck.resolve_content}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                解决说明
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={resolveContent}
                onChange={(e) => setResolveContent(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false)
            setSelectedCheck(null)
            setResolveContent('')
          }}>
            关闭
          </Button>
          {!selectedCheck?.is_resolve && (
            <Button
              variant="contained"
              onClick={handleResolve}
              disabled={!resolveContent.trim() || loading}
            >
              {loading ? '处理中...' : '标记已解决'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}
