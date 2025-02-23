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
import FileUpload from '@/app/components/FileUpload'

interface FormData {
  computer: string;
  network: string;
  mac_address: string;
  ip_address: string;
  images_path: string[];
  documents_path: string[];
}

interface FormErrors {
  computer?: string;
  network?: string;
  mac_address?: string;
  ip_address?: string;
  images_path?: string;
  documents_path?: string;
}

export default function PreparationPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<FormData>({
    computer: '',
    network: '',
    mac_address: '',
    ip_address: '',
    images_path: [],
    documents_path: []
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)

  // 加载项目信息
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`)
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || '获取项目信息失败')
        }
        const { project } = await res.json()
        setProject(project)

        // 预填充电脑和网络信息
        if (project.registration_info) {
          setFormData(prev => ({
            ...prev,
            computer: project.registration_info.computer,
            network: project.registration_info.network
          }))
        }
      } catch (err) {
        console.error('获取项目信息失败:', err)
        setError(err instanceof Error ? err.message : '获取项目信息失败')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      // 验证必填字段
      const errors: FormErrors = {}
      if (!formData.computer) {
        errors.computer = '请输入电脑信息'
      }
      if (!formData.network) {
        errors.network = '请输入网络信息'
      }
      if (!formData.mac_address) {
        errors.mac_address = '请输入MAC地址'
      }
      if (!formData.ip_address) {
        errors.ip_address = '请输入IP地址'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

      setSubmitting(true)
      setError('')
      setFormErrors({})

      const res = await fetch(`/api/projects/${params.id}/preparation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || '提交准备信息失败')
      }

      // 提交成功后跳转到项目详情页
      router.replace(`/dashboard/projects/${params.id}/detail`)
    } catch (err) {
      console.error('提交准备信息失败:', err)
      setError(err instanceof Error ? err.message : '提交准备信息失败')
    } finally {
      setSubmitting(false)
      setConfirmDialog(false)
    }
  }

  const onSubmit = async () => {
    await handleSubmit()
  }

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
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
            提交上传信息
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="MAC地址"
                        value={formData.mac_address}
                        onChange={handleChange('mac_address')}
                        error={!!formErrors.mac_address}
                        helperText={formErrors.mac_address}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="IP地址"
                        value={formData.ip_address}
                        onChange={handleChange('ip_address')}
                        error={!!formErrors.ip_address}
                        helperText={formErrors.ip_address}
                        required
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* 上传图片 */}
                <Box>
                  <ImageUpload
                    title="上传图片"
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

                {/* 上传文件 */}
                <Box>
                  <FileUpload
                    title="上传文件"
                    value={formData.documents_path}
                    onChange={(paths) => {
                      setFormData(prev => ({
                        ...prev,
                        documents_path: paths
                      }))
                    }}
                    error={formErrors.documents_path}
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
            {submitting ? '提交中...' : '提交上传'}
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
            确定要提交上传信息吗？提交后将进入报价阶段。
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