'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Skeleton
} from '@mui/material'
import { ArrowBack, Close, Download } from '@mui/icons-material'
import type { Project } from '@/types/schema'
import { DepositType } from '@/types/schema'
import { getFileUrl } from '@/lib/qiniu'
import dayjs from 'dayjs'
import React from 'react'
import { STATUS_CONFIG } from '../../../../config'  // 使用相对路径导入
import { getFileInfo } from '@/lib/file'

// 保证金方式显示配置
const DEPOSIT_TYPE_CONFIG = {
  [DepositType.INSURANCE]: { label: '保证金保险', color: '#1976d2' },
  [DepositType.BANK_GUARANTEE]: { label: '银行保函', color: '#2e7d32' },
  [DepositType.TRANSFER]: { label: '网银汇款', color: '#ed6c02' },
  [DepositType.NONE]: { label: '不收取保证金', color: '#757575' }
}

// 添加时间显示组件
const TimeDisplay = ({ label, time }: { label: string, time: string }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography>
      {dayjs(time).format('YYYY-MM-DD HH:mm')}
    </Typography>
  </Box>
)

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [cancelDialog, setCancelDialog] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({})

  // 获取项目详情
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/my-projects/project/${params.id}`)
        const data = await res.json()
        
        if (!res.ok) throw new Error(data.error)
        
        setProject(data.project)
      } catch (err) {
        console.error('获取项目失败:', err)
        setError(err instanceof Error ? err.message : '获取项目详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={48} />
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="rectangular" height={100} />
              <Skeleton variant="rectangular" height={100} />
            </Stack>
          </Paper>
        </Stack>
      </Box>
    )
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || '项目不存在'}
        </Alert>
      </Box>
    )
  }

  // 根据项目状态判断显示哪些信息块
  const renderSections = () => {
    const sections = [
      {
        title: '基本信息',
        show: true,
        content: (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      项目名称
                    </Typography>
                    <Typography>{project.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      所属公司
                    </Typography>
                    <Typography>
                      {project.bid_company?.name || '-'}
                    </Typography>
                  </Box>
                  <TimeDisplay label="开标时间" time={project.bidding_deadline} />
                  <TimeDisplay label="报名截止" time={project.registration_deadline} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      项目状态
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={STATUS_CONFIG[project.status].label}
                        size="small"
                        sx={{
                          color: STATUS_CONFIG[project.status].color,
                          bgcolor: STATUS_CONFIG[project.status].bgColor,
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  </Box>
                  {project.status === 'completed' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        完成时间
                      </Typography>
                      <Typography>
                        {dayjs(project.bidding_at).format('YYYY-MM-DD HH:mm')}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )
      },
      {
        title: '报名信息',
        show: project.registration_info !== null,
        content: (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      电脑信息
                    </Typography>
                    <Typography>{project.registration_info?.computer}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      网络信息
                    </Typography>
                    <Typography>{project.registration_info?.network}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    报名截图
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {project.registration_info?.images_path?.map((path, index) => (
                      renderImage(path, `报名截图 ${index + 1}`)
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )
      },
      {
        title: '保证金信息',
        show: project.deposit_info !== null,
        content: (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    保证金方式
                  </Typography>
                  {project.deposit_info?.type && (
                    <Chip
                      label={DEPOSIT_TYPE_CONFIG[project.deposit_info.type].label}
                      size="small"
                      sx={{
                        ml: 1,
                        color: DEPOSIT_TYPE_CONFIG[project.deposit_info.type].color,
                        bgcolor: 'rgba(0, 0, 0, 0.08)',
                        fontWeight: 500
                      }}
                    />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    保证金截图
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {project.deposit_info?.images_path?.map((path, index) => (
                      renderImage(path, `保证金截图 ${index + 1}`)
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )
      },
      {
        title: '上传信息',
        show: project.preparation_info !== null,
        content: (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      MAC地址
                    </Typography>
                    <Typography>{project.preparation_info?.mac_address}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      IP地址
                    </Typography>
                    <Typography>{project.preparation_info?.ip_address}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      上传截图
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {project.preparation_info?.images_path?.map((path, index) => (
                        renderImage(path, `上传截图 ${index + 1}`)
                      ))}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      上传文件
                    </Typography>
                    <Stack spacing={1}>
                      {project.preparation_info?.documents_path?.map((path, index) => (
                        renderFile(path, index)
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )
      },
      {
        title: '报价信息',
        show: project.bidding_info !== null,
        content: (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    报价截图
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {project.bidding_info?.images_path?.map((path, index) => (
                      renderImage(path, `报价截图 ${index + 1}`)
                    ))}
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    报价文件
                  </Typography>
                  <Stack spacing={1}>
                    {project.bidding_info?.documents_path?.map((path, index) => (
                      renderFile(path, index)
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )
      }
    ]

    return sections.map((section, index) => section.show && (
      <React.Fragment key={section.title}>
        {index > 0 && <Divider />}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            {section.title}
          </Typography>
          {section.content}
        </Box>
      </React.Fragment>
    ))
  }

  // 渲染操作按钮
  const renderActions = () => {
    if (!project) return null;

    const config = STATUS_CONFIG[project.status];
    const actions = config?.actions;
    if (!actions) return null;

    return (
      <Stack direction="row" spacing={2}>
        {/* 报名阶段状态显示撤单按钮 */}
        {project.status === 'registration' && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setCancelDialog(true)}
            disabled={submitting}
          >
            撤单
          </Button>
        )}

        {/* 显示主要操作按钮 */}
        {actions.primary && (
          <Button
            variant="contained"
            onClick={() => router.push(`/dashboard/my-projects/project/${project.id}/${actions?.primary?.path}`)}
            sx={{
              background: config.gradient,
              minWidth: 120
            }}
          >
            {actions.primary.label}
          </Button>
        )}
      </Stack>
    );
  }

  // 处理撤单
  const handleCancel = async () => {
    try {
      setSubmitting(true)
      const res = await fetch(`/api/my-projects/project/${params.id}/cancel`, {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('撤单失败')
      }

      router.push('/dashboard/my-projects')
    } catch (err) {
      console.error('撤单失败:', err)
      setError(err instanceof Error ? err.message : '撤单失败')
    } finally {
      setSubmitting(false)
      setCancelDialog(false)
    }
  }

  // 渲染图片预览
  const renderImage = (path: string, alt: string) => (
    <Paper
      key={path}
      sx={{
        width: 80,
        height: 80,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => setPreviewImage(path)}
    >
      {imageLoading[path] && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CircularProgress size={24} />
        </Box>
      )}
      <img
        src={getFileUrl(path)}
        alt={alt}
        onLoad={() => setImageLoading(prev => ({ ...prev, [path]: false }))}
        onError={() => setImageLoading(prev => ({ ...prev, [path]: false }))}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: imageLoading[path] ? 0 : 1
        }}
      />
    </Paper>
  )

  // 渲染文件
  const renderFile = (path: string, index: number) => {
    const { name, type, ext } = getFileInfo(path)
    return (
      <Paper
        key={path}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ flex: 1, mr: 2 }}>
          <Typography noWrap title={name}>
            {name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={ext}
              size="small"
              sx={{ 
                height: 20,
                fontSize: '0.75rem',
                bgcolor: 'action.hover'
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {type}
            </Typography>
          </Stack>
        </Box>
        <IconButton
          size="small"
          onClick={() => window.open(getFileUrl(path), '_blank')}
          title="下载文件"
        >
          <Download />
        </IconButton>
      </Paper>
    )
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 93px)', // 减去顶部导航栏高度
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 固定头部 */}
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={2}
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.back()}
              sx={{ color: 'text.secondary' }}
            >
              返回
            </Button>
            <Typography variant="h6">
              项目详情
            </Typography>
          </Stack>
          {renderActions()}
        </Stack>
      </Box>

      {/* 可滚动内容区域 */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 3
      }}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={4}>
            {renderSections()}
          </Stack>
        </Paper>
      </Box>

      {/* 撤单确认对话框 */}
      <Dialog
        open={cancelDialog}
        onClose={() => !submitting && setCancelDialog(false)}
      >
        <DialogTitle>确认撤单</DialogTitle>
        <DialogContent>
          <Typography>
            确定要撤销该项目吗？撤单后项目将退回到项目大厅。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialog(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            color="error"
            disabled={submitting}
          >
            {submitting ? '撤单中...' : '确认撤单'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 图片预览对话框 */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getFileUrl(previewImage)}
              alt="预览图片"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
} 