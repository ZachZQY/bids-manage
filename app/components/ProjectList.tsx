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
  TablePagination,
  Alert,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  SelectChangeEvent,
  Badge,
  alpha,
  Collapse
} from "@mui/material"
import { Add, Search, Clear, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useUser } from "@/app/contexts/user"
import dayjs from "dayjs"
import { useRouter } from 'next/navigation'
import { STATUS_CONFIG } from '../config'
import type { Project, BidStatus } from '@/types/schema'
import { useDebounce } from '@/app/hooks/useDebounce'

interface ProjectListProps {
  type: 'all' | 'my' // 列表类型
  showCreateButton?: boolean // 是否显示创建按钮
  hideStatusFilter?: boolean // 是否隐藏状态筛选
  defaultStatus?: BidStatus // 默认状态
  excludeStatuses?: BidStatus[] // 排除的状态
  onTakeProject?: (id: number) => void // 接单回调
  onCancelProject?: (id: number) => void // 撤单回调
}

// 排序字段类型
type OrderBy = 'registration_deadline' | 'bidding_deadline' | 'created_at'

export default function ProjectList({
  type,
  showCreateButton = true,
  hideStatusFilter = false,
  defaultStatus,
  excludeStatuses = [],
  onTakeProject,
  onCancelProject
}: ProjectListProps) {
  const { user } = useUser()
  const router = useRouter()

  // 表格状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})

  // 筛选状态
  const [status, setStatus] = useState<BidStatus | 'all'>(defaultStatus || 'all')
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 500)
  const [orderBy, setOrderBy] = useState<OrderBy>('registration_deadline')
  const [orderDesc, setOrderDesc] = useState(true)

  // 在状态筛选器中过滤掉排除的状态
  const availableStatuses = Object.entries(STATUS_CONFIG).filter(
    ([value]) => !excludeStatuses?.includes(value as BidStatus)
  )

  // 阶段配置
  const stages = [
    { 
      key: 'registration', 
      label: '报名阶段', 
      color: 'primary',
      icon: '📝',
      description: '等待投标人提交报名信息'
    },
    { 
      key: 'deposit', 
      label: '保证金阶段', 
      color: 'secondary',
      icon: '💰',
      description: '等待投标人缴纳保证金'
    },
    { 
      key: 'preparation', 
      label: '上传阶段', 
      color: 'info',
      icon: '📤',
      description: '等待投标人上传标书文件'
    },
    { 
      key: 'bidding', 
      label: '报价阶段', 
      color: 'warning',
      icon: '💹',
      description: '等待投标人提交报价信息'
    }
  ] as const

  // 处理阶段点击
  const handleStageClick = (stage: BidStatus) => {
    setStatus(prev => prev === stage ? 'all' : stage)
    setPage(0)
  }

  // 获取项目列表
  const fetchProjects = useCallback(async (currentPage: number = page) => {
    try {
      setLoading(true)
      setError('')

      const searchParams = new URLSearchParams({
        type,
        page: String(currentPage + 1),
        pageSize: String(rowsPerPage),
        orderBy,
        orderDesc: String(orderDesc)
      })

      if (status && status !== 'all') {
        searchParams.append('status', status)
      }
      if (debouncedKeyword) {
        searchParams.append('keyword', debouncedKeyword)
      }

      const res = await fetch(`/api/projects?${searchParams.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || '获取项目列表失败')
      }

      setProjects(data.projects)
      setTotal(data.total)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('获取项目列表失败:', err)
      setError(err instanceof Error ? err.message : '获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }, [type, rowsPerPage, status, debouncedKeyword, orderBy, orderDesc, page])

  // 监听筛选条件变化
  useEffect(() => {
    fetchProjects(0)
  }, [status, debouncedKeyword, orderBy, orderDesc, rowsPerPage])

  // 监听页码变化
  useEffect(() => {
    fetchProjects(page)
  }, [page])

  // 处理状态筛选变化
  const handleStatusChange = (event: SelectChangeEvent<BidStatus | 'all'>) => {
    setStatus(event.target.value as BidStatus | 'all')
    setPage(0)
  }

  // 处理关键词搜索变化
  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value)
  }

  // 处理排序变化
  const handleSortChange = (newOrderBy: OrderBy) => {
    if (newOrderBy === orderBy) {
      setOrderDesc(!orderDesc)
    } else {
      setOrderBy(newOrderBy)
      setOrderDesc(true)
    }
    setPage(0)
  }

  // 处理清除搜索
  const handleClearSearch = () => {
    setKeyword('')
    setPage(0)
  }

  // 处理页码变化
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  // 处理每页数量变化
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // 处理查看详情
  const handleViewDetail = (projectId: number) => {
    router.push(`/dashboard/projects/${projectId}/detail`)
  }

  // 处理撤单
  const handleCancelProject = async (projectId: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/cancel`, {
        method: 'POST'
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || '撤单失败')
      }

      // 刷新列表
      fetchProjects(page)
      
      // 关闭对话框
      setConfirmCancelDialog(false)
      setSelectedProjectId(null)
    } catch (err) {
      console.error('撤单失败:', err)
      setError(err instanceof Error ? err.message : '撤单失败')
    }
  }

  // 打开撤单确认对话框
  const openCancelDialog = (projectId: number) => {
    setSelectedProjectId(projectId)
    setConfirmCancelDialog(true)
  }

  // 删除项目相关状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [deleteProjectName, setDeleteProjectName] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // 处理删除项目
  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project)
    setDeleteProjectName('')
    setDeletePassword('')
    setDeleteError('')
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return

    try {
      setDeleting(true)
      setDeleteError('')

      const res = await fetch(`/api/projects/${selectedProject.id}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: deleteProjectName,
          password: deletePassword
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '删除失败')
      }

      // 刷新项目列表
      fetchProjects()
      setDeleteDialogOpen(false)
      
    } catch (err) {
      console.error('删除项目失败:', err)
      setDeleteError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const [expanded, setExpanded] = useState(true)

  return (
    <Box sx={{
      height: 'calc(100% - 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      {/* 阶段统计 */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          bgcolor: 'grey.50',
          borderRadius: 2
        }}
      >
        <Stack spacing={2}>
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={1}
            sx={{ cursor: 'pointer' }}
            onClick={() => setExpanded(!expanded)}
          >
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, flex: 1 }}>
              项目阶段概览
            </Typography>
            <IconButton 
              size="small"
              sx={{ 
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)'
              }}
            >
              {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Stack>
          
          <Collapse in={expanded}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 2
            }}>
              {stages.map(({ key, label, color, icon, description }) => (
                <Paper
                  key={key}
                  onClick={() => handleStageClick(key as BidStatus)}
                  elevation={status === key ? 2 : 0}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    bgcolor: status === key ? `${color}.lighter` : 'background.paper',
                    border: 1,
                    borderColor: status === key ? `${color}.main` : 'divider',
                    '&:hover': {
                      bgcolor: status === key ? `${color}.lighter` : `${color}.50`,
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h4" component="span" sx={{ lineHeight: 1 }}>
                        {icon}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: status === key ? `${color}.darker` : 'text.primary' }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {description}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 600,
                          color: status === key ? `${color}.darker` : `${color}.main`
                        }}
                      >
                        {stats[key] || 0}
                      </Typography>
                    </Stack>
                    {status === key && (
                      <Box sx={{ 
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        bgcolor: `${color}.main`,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8
                      }} />
                    )}
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Collapse>
        </Stack>
      </Paper>

      {/* 顶部操作区 */}
      <Paper sx={{ p: 2, bgcolor: 'white' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            {/* 状态筛选 */}
            {!hideStatusFilter && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={status}
                  onChange={handleStatusChange}
                  displayEmpty
                >
                  <MenuItem value="all">
                    全部 ({stats.all|| 0})
                  </MenuItem>
                  {availableStatuses.map(([value, config]) => (
                    <MenuItem key={value} value={value}>
                      {config.label} ({stats[value] || 0})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              placeholder="搜索项目名称或公司名称"
              value={keyword}
              onChange={handleKeywordChange}
              size="small"
              sx={{
                width: 250,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white'
                }
              }}
              InputProps={{
                startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                endAdornment: keyword && (
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                )
              }}
            />
          </Stack>

          {/* 创建按钮 */}
          {showCreateButton && user?.role === 'admin' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/dashboard/projects/create')}
              sx={{
                background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                px: 3,
                py: 1
              }}
            >
              发布项目
            </Button>
          )}
        </Stack>
      </Paper>

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
        <TableContainer sx={{ maxHeight: 'calc(100% - 52px)', position: 'relative' }}>
          {loading && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1
            }}>
              <CircularProgress />
            </Box>
          )}
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell style={{ minWidth: 80 }} sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell style={{ minWidth: 200 }} sx={{ fontWeight: 600 }}>项目名称</TableCell>
                <TableCell style={{ minWidth: 100 }} sx={{ fontWeight: 600 }}>负责人</TableCell>
                <TableCell style={{ minWidth: 100 }} sx={{ fontWeight: 600 }}>状态</TableCell>
                <TableCell style={{ minWidth: 160 }} sx={{ fontWeight: 600 }}>所属公司</TableCell>
                <TableCell
                  style={{ minWidth: 160 }}
                  sx={{ fontWeight: 600 }}
                  onClick={() => handleSortChange('bidding_deadline')}
                >
                  <TableSortLabel
                    active={orderBy === 'bidding_deadline'}
                    direction={orderDesc ? 'desc' : 'asc'}
                  >
                    开标时间
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  style={{ minWidth: 160 }}
                  sx={{ fontWeight: 600 }}
                  onClick={() => handleSortChange('registration_deadline')}
                >
                  <TableSortLabel
                    active={orderBy === 'registration_deadline'}
                    direction={orderDesc ? 'desc' : 'asc'}
                  >
                    报名截止
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  style={{ minWidth: 120 }}
                  sx={{
                    fontWeight: 600,
                    position: 'sticky',
                    right: 0,
                    bgcolor: 'background.paper',
                    borderLeft: '1px solid',
                    borderLeftColor: 'divider',
                    zIndex: 2
                  }}
                >
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>{project.id}</TableCell>
                  <TableCell>
                    <Typography sx={{
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {project.bid_user?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_CONFIG[project.status].label}
                      size="small"
                      sx={{
                        color: STATUS_CONFIG[project.status].color,
                        bgcolor: STATUS_CONFIG[project.status].bgColor,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {project.bid_company?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {dayjs(project.bidding_deadline).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {dayjs(project.registration_deadline).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{
                      position: 'sticky',
                      right: 0,
                      bgcolor: 'background.paper',
                      borderLeft: '1px solid',
                      borderLeftColor: 'divider'
                    }}
                  >
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetail(project.id)}
                      >
                        查看
                      </Button>
                      {/* 待接单状态 */}
                      {type === 'all' && project.status === 'pending' && onTakeProject && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onTakeProject(project.id)}
                          sx={{
                            background: STATUS_CONFIG.pending.gradient
                          }}
                        >
                          接单
                        </Button>
                      )}
                      {/* 报名阶段 */}
                      {type === 'my' && project.status === 'registration' && (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => router.push(`/dashboard/projects/${project.id}/registration`)}
                            sx={{
                              background: STATUS_CONFIG.registration.gradient
                            }}
                          >
                            提交报名
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => openCancelDialog(project.id)}
                          >
                            撤单
                          </Button>
                        </>
                      )}
                      {/* 保证金阶段 */}
                      {type === 'my' && project.status === 'deposit' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => router.push(`/dashboard/projects/${project.id}/deposit`)}
                          sx={{
                            background: STATUS_CONFIG.deposit.gradient
                          }}
                        >
                          提交保证金
                        </Button>
                      )}
                      {/* 上传阶段 */}
                      {type === 'my' && project.status === 'preparation' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => router.push(`/dashboard/projects/${project.id}/preparation`)}
                          sx={{
                            background: STATUS_CONFIG.preparation.gradient
                          }}
                        >
                          提交上传
                        </Button>
                      )}
                      {/* 报价阶段 */}
                      {type === 'my' && project.status === 'bidding' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => router.push(`/dashboard/projects/${project.id}/bidding`)}
                          sx={{
                            background: STATUS_CONFIG.bidding.gradient
                          }}
                        >
                          提交报价
                        </Button>
                      )}
                      {/* 删除按钮 */}
                      {user?.role === 'admin' && (
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(project)}
                        >
                          删除
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每页行数"
        />
      </Paper>

      {/* 撤单确认对话框 */}
      <Dialog
        open={confirmCancelDialog}
        onClose={() => {
          setConfirmCancelDialog(false)
          setSelectedProjectId(null)
        }}
      >
        <DialogTitle>确认撤单</DialogTitle>
        <DialogContent>
          <Typography>
            确定要撤销此项目吗？此操作不可恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmCancelDialog(false)
              setSelectedProjectId(null)
            }}
          >
            取消
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => selectedProjectId && handleCancelProject(selectedProjectId)}
          >
            确认撤单
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          删除项目
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography color="error">
              请注意：删除操作不可恢复，请谨慎操作！
            </Typography>
            
            <Typography>
              要删除项目 <strong>{selectedProject?.name}</strong>，请输入完整的项目名称和删除密码：
            </Typography>

            <TextField
              label="项目名称"
              fullWidth
              value={deleteProjectName}
              onChange={(e) => setDeleteProjectName(e.target.value)}
              error={!!deleteError}
              disabled={deleting}
            />

            <TextField
              label="删除密码"
              type="password"
              fullWidth
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              error={!!deleteError}
              helperText={deleteError}
              disabled={deleting}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={!deleteProjectName || !deletePassword || deleting}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}