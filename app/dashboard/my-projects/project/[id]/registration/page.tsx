'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material'
import { ArrowBack, CloudUpload, Delete } from '@mui/icons-material'
import type { Project, RegistrationInfo } from '@/types/schema'
import dayjs from 'dayjs'
import { getFileUrl } from '@/lib/qiniu'

export default function ProjectRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo>({
    computer: '',
    network: '',
    images_path: []
  })

  // 获取项目详情
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/my-projects/project/${params.id}`)
        const data = await res.json()
        
        if (!res.ok) throw new Error(data.error)
        
        setProject(data.project)
        if (data.project.registration_info) {
          setRegistrationInfo(data.project.registration_info)
        }
      } catch (err) {
        console.error('获取项目详情失败:', err)
        setError(err instanceof Error ? err.message : '获取项目详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

  // 上传图片
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    try {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setRegistrationInfo(prev => ({
        ...prev,
        images_path: [...(prev.images_path || []), data.path]
      }))
    } catch (err) {
      console.error('上传图片失败:', err)
      setError(err instanceof Error ? err.message : '上传图片失败')
    }
  }

  // 提交报名
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      if (!registrationInfo.computer || !registrationInfo.network) {
        throw new Error('请填写电脑和网络信息')
      }

      if (!registrationInfo.images_path?.length) {
        throw new Error('请上传报名图片')
      }

      const res = await fetch(`/api/my-projects/project/${params.id}/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationInfo)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 提交成功后跳转
      router.push(`/dashboard/my-projects/status/deposit`)

    } catch (err) {
      console.error('提交报名失败:', err)
      setError(err instanceof Error ? err.message : '提交报名失败')
    } finally {
      setSubmitting(false)
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
        <Alert severity="error">项目不存在</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: 'calc(100% - 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      {/* 头部 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 2
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ color: 'text.secondary' }}
        >
          返回
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          项目报名 - {project.name}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 项目信息 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          项目信息
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              开标时间
            </Typography>
            <Typography>
              {dayjs(project.bidding_deadline).format('YYYY-MM-DD HH:mm')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              报名截止时间
            </Typography>
            <Typography>
              {dayjs(project.registration_deadline).format('YYYY-MM-DD HH:mm')}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* 报名表单 */}
      <Paper sx={{ p: 3, flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          报名信息
        </Typography>
        <Stack spacing={3}>
          <TextField
            label="电脑信息"
            value={registrationInfo.computer}
            onChange={(e) => setRegistrationInfo(prev => ({
              ...prev,
              computer: e.target.value
            }))}
            fullWidth
            required
            multiline
            rows={2}
          />
          <TextField
            label="网络信息"
            value={registrationInfo.network}
            onChange={(e) => setRegistrationInfo(prev => ({
              ...prev,
              network: e.target.value
            }))}
            fullWidth
            required
            multiline
            rows={2}
          />
          
          {/* 图片上传区域 */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              报名图片
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              {registrationInfo?.images_path?.map((path, index) => (
                <Paper 
                  key={path} 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getFileUrl(path)}
                    alt={`报名图片 ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)'
                      }
                    }}
                    onClick={() => {
                      setRegistrationInfo(prev => ({
                        ...prev,
                        images_path: prev?.images_path?.filter(p => p !== path)
                      }))
                    }}
                  >
                    <Delete sx={{ color: 'white' }} />
                  </IconButton>
                </Paper>
              ))}
              <Button
                variant="outlined"
                sx={{ 
                  width: 120, 
                  height: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
                component="label"
              >
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleUpload}
                />
                <CloudUpload />
                <Typography variant="caption" align="center">
                  上传图片
                </Typography>
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* 底部按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          disabled={submitting}
        >
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !registrationInfo.computer || !registrationInfo.network}
          sx={{
            background: 'linear-gradient(45deg, #ed6c02 30%, #e65100 90%)',
          }}
        >
          {submitting ? '提交中...' : '提交报名'}
        </Button>
      </Box>
    </Box>
  )
}