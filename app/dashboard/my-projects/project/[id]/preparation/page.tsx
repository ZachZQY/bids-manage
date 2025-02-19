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
import type { Project, PreparationInfo } from '@/types/schema'
import { getFileUrl } from '@/lib/qiniu'

export default function ProjectPreparationPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [preparationInfo, setPreparationInfo] = useState<PreparationInfo>({
    computer: '',
    network: '',
    mac_address: '',
    ip_address: '',
    images_path: [],
    documents_path: []
  })

  // 获取项目详情
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/my-projects/project/${params.id}`)
        const data = await res.json()
        
        if (!res.ok) throw new Error(data.error)
        
        setProject(data.project)
        if (data.project.preparation_info) {
          setPreparationInfo(data.project.preparation_info)
        } else if (data.project.registration_info) {
          // 如果没有制作信息，使用报名信息初始化
          setPreparationInfo(prev => ({
            ...prev,
            computer: data.project.registration_info.computer,
            network: data.project.registration_info.network
          }))
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

  // 上传图片
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setPreparationInfo(prev => ({
        ...prev,
        images_path: [...(prev.images_path || []), data.path]
      }))
    } catch (err) {
      console.error('上传图片失败:', err)
      setError(err instanceof Error ? err.message : '上传图片失败')
    }
  }

  // 上传文件
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setPreparationInfo(prev => ({
        ...prev,
        documents_path: [...(prev.documents_path || []), data.path]
      }))
    } catch (err) {
      console.error('上传文件失败:', err)
      setError(err instanceof Error ? err.message : '上传文件失败')
    }
  }

  // 提交制作信息
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      if (!preparationInfo.mac_address || !preparationInfo.ip_address) {
        throw new Error('请填写MAC地址和IP地址')
      }

      if (!preparationInfo.images_path?.length) {
        throw new Error('请上传制作截图')
      }

      if (!preparationInfo.documents_path?.length) {
        throw new Error('请上传标书文件')
      }

      const res = await fetch(`/api/my-projects/project/${params.id}/preparation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preparationInfo)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 提交成功后跳转
      router.push(`/dashboard/my-projects/status/bidding`)

    } catch (err) {
      console.error('提交制作信息失败:', err)
      setError(err instanceof Error ? err.message : '提交制作信息失败')
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
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => router.back()}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">
            提交制作 - {project.name}
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* 电脑和网络信息 */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="电脑信息"
                value={preparationInfo.computer}
                onChange={e => setPreparationInfo(prev => ({ ...prev, computer: e.target.value }))}
                fullWidth
                disabled
              />
              <TextField
                label="网络信息"
                value={preparationInfo.network}
                onChange={e => setPreparationInfo(prev => ({ ...prev, network: e.target.value }))}
                fullWidth
                disabled
              />
            </Stack>

            {/* MAC地址和IP地址 */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="MAC地址"
                value={preparationInfo.mac_address}
                onChange={e => setPreparationInfo(prev => ({ ...prev, mac_address: e.target.value }))}
                fullWidth
                required
                error={!!error && error.includes('MAC')}
                placeholder="请输入MAC地址"
              />
              <TextField
                label="IP地址"
                value={preparationInfo.ip_address}
                onChange={e => setPreparationInfo(prev => ({ ...prev, ip_address: e.target.value }))}
                fullWidth
                required
                error={!!error && error.includes('IP')}
                placeholder="请输入IP地址"
              />
            </Stack>

            {/* 上传图片 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                制作截图
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {preparationInfo.images_path?.map((path, index) => (
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
                      alt={`制作截图 ${index + 1}`}
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
                        setPreparationInfo(prev => ({
                          ...prev,
                          images_path: prev.images_path?.filter(p => p !== path)
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
                    onChange={handleUploadImage}
                  />
                  <CloudUpload />
                  <Typography variant="caption" align="center">
                    上传截图
                  </Typography>
                </Button>
              </Stack>
            </Box>

            {/* 上传文件 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                标书文件
              </Typography>
              <Stack spacing={2}>
                {preparationInfo.documents_path?.map((path, index) => (
                  <Paper
                    key={path}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography>
                      文件 {index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setPreparationInfo(prev => ({
                          ...prev,
                          documents_path: prev.documents_path?.filter(p => p !== path)
                        }))
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Paper>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    onChange={handleUploadDocument}
                  />
                  上传文件
                </Button>
              </Stack>
            </Box>

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
                disabled={submitting}
                sx={{
                  background: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)',
                }}
              >
                {submitting ? '提交中...' : '提交制作'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
} 