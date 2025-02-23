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
  Grid,
  TextField,
  InputAdornment
} from '@mui/material'
import { ArrowBack, Close, Download } from '@mui/icons-material'
import type { Project } from '@/types/schema'
import ImageUpload from '@/app/components/ImageUpload'
import FileUpload from '@/app/components/FileUpload'

interface FormData {
  images_path: string[];
  documents_path: string[];
  amount: string;
}

export default function BiddingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    images_path: [],
    documents_path: [],
    amount: ''
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
        
        // 如果已经有报价信息，初始化表单数据
        if (data.project.bidding_info) {
          setFormData({
            images_path: data.project.bidding_info.images_path || [],
            documents_path: data.project.bidding_info.documents_path || [],
            amount: data.project.bidding_info.amount || ''
          })
        }
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
    
    if (formData.images_path.length === 0) {
      errors.images_path = '请上传至少一张报价截图'
    }
    if (formData.documents_path.length === 0) {
      errors.documents_path = '请上传至少一个报价文件'
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

  // 提交报价信息
  const onSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')
      
      const res = await fetch(`/api/projects/${params.id}/bidding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      // 跳转到项目详情页面
      router.replace(`/dashboard/projects/${params.id}/detail`)
    } catch (err) {
      console.error('提交报价信息失败:', err)
      setError(err instanceof Error ? err.message : '提交报价信息失败')
    } finally {
      setSubmitting(false)
      setConfirmDialog(false)
    }
  }

  // 处理图片上传
  const handleImageChange = (paths: string[]) => {
    setFormData(prev => ({
      ...prev,
      images_path: paths
    }))
    // 清除图片错误
    if (formErrors.images_path) {
      setFormErrors(prev => ({
        ...prev,
        images_path: undefined
      }))
    }
  }

  // 处理文件上传
  const handleDocumentChange = (paths: string[]) => {
    setFormData(prev => ({
      ...prev,
      documents_path: paths
    }))
    // 清除文件错误
    if (formErrors.documents_path) {
      setFormErrors(prev => ({
        ...prev,
        documents_path: undefined
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
            提交报价信息
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
                {/* 上传图片 */}
                <Box>
                  <ImageUpload
                    title="报价图片"
                    value={formData.images_path}
                    onChange={handleImageChange}
                    error={formErrors.images_path}
                  />
                </Box>

                {/* 上传文件 */}
                <Box>
                  <FileUpload
                    title="报价文件"
                    value={formData.documents_path}
                    onChange={handleDocumentChange}
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
            {submitting ? '提交中...' : '提交报价'}
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
            确定要提交报价信息吗？提交后不可修改。
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