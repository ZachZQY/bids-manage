'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TextField,
  InputAdornment,
  Chip,
  Stack,
  MenuItem,
  TableRow,
  TableCell
} from '@mui/material'
import { Search } from '@mui/icons-material'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/contexts/user'
import CommonList from '@/app/components/CommonList'

// 操作类型配置
const ACTION_TYPE_CONFIG = {
  submit_registration: {
    label: '提交报名',
    color: '#ed6c02',
    bgColor: '#FFF3E0'
  },
  submit_deposit: {
    label: '提交保证金',
    color: '#2e7d32',
    bgColor: '#E8F5E9'
  },
  submit_preparation: {
    label: '提交上传',
    color: '#9c27b0',
    bgColor: '#F3E5F5'
  },
  submit_bidding: {
    label: '提交报价',
    color: '#0288d1',
    bgColor: '#E1F5FE'
  }
}

export default function LogsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [actionType, setActionType] = useState<'all' | keyof typeof ACTION_TYPE_CONFIG>('all')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  // 检查管理员权限
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  // 获取日志列表
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
        ...(actionType !== 'all' && { action_type: actionType }),
        ...(search && { search })
      })

      const res = await fetch(`/api/admin/logs?${queryParams}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setLogs(data.logs)
      setTotal(data.total)
    } catch (err) {
      console.error('获取日志失败:', err)
      setError(err instanceof Error ? err.message : '获取日志列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, actionType, search])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <CommonList
      loading={loading}
      error={error}
      page={page}
      rowsPerPage={rowsPerPage}
      total={total}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      filterComponent={
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="操作类型"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as typeof actionType)}
            sx={{ width: 150 }}
            size="small"
          >
            <MenuItem value="all">全部</MenuItem>
            {Object.entries(ACTION_TYPE_CONFIG).map(([value, { label }]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            placeholder="搜索项目/操作人"
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
          <TableCell>ID</TableCell>
          <TableCell>操作时间</TableCell>
          <TableCell>项目名称</TableCell>
          <TableCell>操作类型</TableCell>
          <TableCell>操作内容</TableCell>
          <TableCell>操作人</TableCell>
          <TableCell>IP地址</TableCell>
          <TableCell>浏览器</TableCell>
        </TableRow>
      }
      tableBody={
        logs.map((log: any) => (
          <TableRow key={log.id} hover>
            <TableCell>{log.id}</TableCell>
            <TableCell>
              {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </TableCell>
            <TableCell>{log.bid_project?.name || '-'}</TableCell>
            <TableCell>
              <Chip
                label={ACTION_TYPE_CONFIG[log.action_type]?.label || log.action_type}
                size="small"
                sx={{
                  color: ACTION_TYPE_CONFIG[log.action_type]?.color || '#757575',
                  bgcolor: ACTION_TYPE_CONFIG[log.action_type]?.bgColor || '#F5F5F5',
                  fontWeight: 500
                }}
              />
            </TableCell>
            <TableCell 
              sx={{ 
                maxWidth: 300,
                cursor: 'pointer',
                ...(expandedRow === log.id ? {
                  whiteSpace: 'normal',
                  maxHeight: 200,
                  overflow: 'auto'
                } : {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                })
              }}
              onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
              title={expandedRow === log.id ? '' : log.content}
            >
              {log.content || '-'}
            </TableCell>
            <TableCell>{log.bid_user?.name || '-'}</TableCell>
            <TableCell>{log.user_ip}</TableCell>
            <TableCell>{log.user_agent}</TableCell>
          </TableRow>
        ))
      }
    />
  )
}