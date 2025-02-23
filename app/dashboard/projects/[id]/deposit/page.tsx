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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Radio,
  alpha
} from '@mui/material'
import { ArrowBack, Close } from '@mui/icons-material'
import type { Project } from '@/types/schema'
import { DepositType } from '@/types/schema'
import ImageUpload from '@/app/components/ImageUpload'

interface FormData {
  type: DepositType;
  images_path: string[];
}

// 保证金方式配置
const DEPOSIT_TYPE_CONFIG = {
  [DepositType.INSURANCE]: { 
    label: '保证金保险',
    description: '通过保险公司提供保证金保险',
    color: '#1976d2',
    bgColor: '#E3F2FD'
  },
  [DepositType.BANK_GUARANTEE]: { 
    label: '银行保函',
    description: '通过银行提供保函',
    color: '#2e7d32',
    bgColor: '#E8F5E9'
  },
  [DepositType.TRANSFER]: { 
    label: '网银汇款',
    description: '通过网银直接汇款',
    color: '#ed6c02',
    bgColor: '#FFF3E0'
  },
  [DepositType.NONE]: { 
    label: '不收取保证金',
    description: '本项目无需缴纳保证金',
    color: '#757575',
    bgColor: '#F5F5F5'
  }
}

export default function DepositPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    type: DepositType.NONE,
    images_path: []
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // 获取项目详情
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
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

  // 表单验证
  const validateForm = () => {
    const errors: Partial<Record<keyof FormData, string>> = {}
    
    // 如果选择了需要保证金的方式，则必须上传图片
    if (formData.type !== DepositType.NONE && formData.images_path.length === 0) {
      errors.images_path = '请上传保证金凭证'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setConfirmDialog(true)
  }

  // 提交保证金信息
  const onSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await fetch(`/api/projects/${params.id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      // 跳转到上传页面
      router.replace(`/dashboard/projects/${params.id}/detail`)
    } catch (err) {
      console.error('提交保证金信息失败:', err)
      setError(err instanceof Error ? err.message : '提交保证金信息失败')
    } finally {
      setSubmitting(false)
      setConfirmDialog(false)
    }
  }

  // 处理保证金方式变更
  const handleTypeChange = (type: DepositType) => {
    setFormData(prev => ({ ...prev, type }))
    // 清除图片错误
    if (formErrors.images_path) {
      setFormErrors(prev => ({ ...prev, images_path: undefined }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 头部 */}
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            onClick={() => router.back()}
            sx={{ color: 'text.secondary' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">
            提交保证金信息
          </Typography>
        </Stack>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* 表单区域 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
          <Paper>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3} sx={{ p: 3 }}>
                {/* 保证金方式 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    保证金方式
                  </Typography>
                  <Stack spacing={2}>
                    {Object.keys(DEPOSIT_TYPE_CONFIG).map((type) => (
                      <Card 
                        key={type}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: 1,
                          borderColor: formData.type === type ? 'primary.main' : 'divider',
                          bgcolor: formData.type === type ? alpha('#1976d2', 0.04) : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: alpha('#1976d2', 0.04)
                          }
                        }}
                        onClick={() => {
                          handleTypeChange(type as DepositType)
                        }}
                      >
                        <CardContent sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          p: 2,
                          '&:last-child': { pb: 2 }
                        }}>
                          <Radio 
                            checked={formData.type === type}
                            sx={{ mr: 2 }}
                          />
                          <Box>
                            <Typography variant="subtitle1">
                              {DEPOSIT_TYPE_CONFIG[type as DepositType].label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {DEPOSIT_TYPE_CONFIG[type as DepositType].description}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    {formErrors.type && (
                      <Typography color="error" variant="caption">
                        {formErrors.type}
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* 保证金凭证 */}
                {formData.type !== DepositType.NONE && (
                  <Box>
                    <ImageUpload
                      title="保证金凭证"
                      value={formData.images_path}
                      onChange={(paths) => {
                        setFormData(prev => ({
                          ...prev,
                          images_path: paths
                        }))
                      }}
                      error={formErrors.images_path}
                    />
                  </Box>
                )}
              </Stack>
            </form>
          </Paper>
        </Box>
      </Box>

      {/* 底部按钮 */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
          >
            返回
          </Button>
          <Button
            variant="contained"
            onClick={() => setConfirmDialog(true)}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '提交保证金'}
          </Button>
        </Stack>
      </Box>

      {/* 确认对话框 */}
      <Dialog
        open={confirmDialog}
        onClose={() => !submitting && setConfirmDialog(false)}
      >
        <DialogTitle>确认提交</DialogTitle>
        <DialogContent>
          <Typography>
            确定要提交保证金信息吗？提交后将进入上传阶段。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={onSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? '提交中...' : '确认'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}