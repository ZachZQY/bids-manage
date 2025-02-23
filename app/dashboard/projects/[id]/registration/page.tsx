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
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import type { Project } from '@/types/schema'
import ImageUpload from '@/app/components/ImageUpload'

// 表单验证schema
interface ValidationRule {
  required?: string;
  pattern?: {
    value: RegExp;
    message: string;
  };
  isArray?: boolean;
}

const schema: Record<keyof FormData, ValidationRule> = {
  contact_person: { required: '请输入联系人姓名' },
  contact_mobile: { required: '请输入手机号码' },
  contact_phone: {},
  contact_email: { 
    pattern: { 
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
      message: '请输入正确的邮箱格式' 
    } 
  },
  computer: { required: '请输入电脑信息' },
  network: { required: '请输入网络信息' },
  images_path: { isArray: true }
}

interface FormData {
  contact_person: string;    // 联系人
  contact_mobile: string;    // 联系手机
  contact_phone?: string;    // 座机号码（选填）
  contact_email?: string;    // 预留邮箱（选填）
  computer: string;         // 报名电脑
  network: string;         // 报名网络
  images_path: string[];   // 报名图片路径
}

export default function RegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    contact_person: '',
    contact_mobile: '',
    contact_phone: '',
    contact_email: '',
    computer: '',
    network: '',
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
    
    // 验证必填字段
    Object.entries(schema).forEach(([key, rules]) => {
      const value = formData[key as keyof FormData]
      if (rules.required) {
        if (rules.isArray) {
          if (!Array.isArray(value) || value.length === 0) {
            errors[key as keyof FormData] = rules.required
          }
        } else if (!value) {
          errors[key as keyof FormData] = rules.required
        }
      }
      if (rules.pattern && typeof value === 'string' && value && !rules.pattern.value.test(value)) {
        errors[key as keyof FormData] = rules.pattern.message
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setConfirmDialog(true)
  }

  // 提交报名信息
  const onSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await fetch(`/api/projects/${params.id}/registration`, {
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

      // 跳转到详情页面
      router.replace(`/dashboard/projects/${params.id}/detail`)
    } catch (err) {
      console.error('提交报名信息失败:', err)
      setError(err instanceof Error ? err.message : '提交报名信息失败')
    } finally {
      setSubmitting(false)
      setConfirmDialog(false)
    }
  }

  // 处理表单字段变化
  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    // 清除对应字段的错误
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
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
            提交报名信息
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
                {/* 联系方式 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    联系方式
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="联系人"
                        value={formData.contact_person}
                        onChange={handleChange('contact_person')}
                        error={!!formErrors.contact_person}
                        helperText={formErrors.contact_person}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="手机号码"
                        value={formData.contact_mobile}
                        onChange={handleChange('contact_mobile')}
                        error={!!formErrors.contact_mobile}
                        helperText={formErrors.contact_mobile}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="座机号码（选填）"
                        value={formData.contact_phone}
                        onChange={handleChange('contact_phone')}
                        error={!!formErrors.contact_phone}
                        helperText={formErrors.contact_phone}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="电子邮箱（选填）"
                        type="email"
                        value={formData.contact_email}
                        onChange={handleChange('contact_email')}
                        error={!!formErrors.contact_email}
                        helperText={formErrors.contact_email}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* 设备信息 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    设备信息
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="电脑信息"
                        value={formData.computer}
                        onChange={handleChange('computer')}
                        error={!!formErrors.computer}
                        helperText={formErrors.computer}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="网络信息"
                        value={formData.network}
                        onChange={handleChange('network')}
                        error={!!formErrors.network}
                        helperText={formErrors.network}
                        required
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* 报名图片 */}
                <Box>

                  <ImageUpload
                  title='报名图片'
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
            {submitting ? '提交中...' : '提交报名'}
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
            确定要提交报名信息吗？提交后将进入保证金缴纳阶段。
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