'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Chip
} from '@mui/material'
import { ArrowBack, CloudUpload, Delete } from '@mui/icons-material'
import type { Project, BiddingInfo } from '@/types/schema'
import { DepositType } from '@/types/schema'
import { getFileUrl } from '@/lib/qiniu'

// 保证金方式显示配置
const DEPOSIT_TYPE_CONFIG = {
  [DepositType.INSURANCE]: { label: '保证金保险', color: '#1976d2' },
  [DepositType.BANK_GUARANTEE]: { label: '银行保函', color: '#2e7d32' },
  [DepositType.TRANSFER]: { label: '网银汇款', color: '#ed6c02' },
  [DepositType.NONE]: { label: '不收取保证金', color: '#757575' }
}

export default function ProjectBiddingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [biddingInfo, setBiddingInfo] = useState<BiddingInfo>({
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
        if (data.project.bidding_info) {
          setBiddingInfo(data.project.bidding_info)
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

      setBiddingInfo(prev => ({
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

      setBiddingInfo(prev => ({
        ...prev,
        documents_path: [...(prev.documents_path || []), data.path]
      }))
    } catch (err) {
      console.error('上传文件失败:', err)
      setError(err instanceof Error ? err.message : '上传文件失败')
    }
  }

  // 提交报价信息
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      if (!biddingInfo.images_path?.length) {
        throw new Error('请上传报价截图')
      }

      if (!biddingInfo.documents_path?.length) {
        throw new Error('请上传报价文件')
      }

      const res = await fetch(`/api/my-projects/project/${params.id}/bidding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(biddingInfo)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 提交成功后跳转
      router.push(`/dashboard/my-projects/status/completed`)

    } catch (err) {
      console.error('提交报价信息失败:', err)
      setError(err instanceof Error ? err.message : '提交报价信息失败')
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
            提交报价 - {project.name}
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* 项目信息 */}
            <Stack spacing={2}>
              <Typography variant="subtitle2">项目信息</Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="电脑信息"
                  value={project.registration_info?.computer}
                  fullWidth
                  disabled
                />
                <TextField
                  label="网络信息"
                  value={project.registration_info?.network}
                  fullWidth
                  disabled
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="MAC地址"
                  value={project.preparation_info?.mac_address}
                  fullWidth
                  disabled
                />
                <TextField
                  label="IP地址"
                  value={project.preparation_info?.ip_address}
                  fullWidth
                  disabled
                />
              </Stack>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  保证金方式：
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
            </Stack>

            {/* 上传报价截图 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                报价截图
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {biddingInfo.images_path?.map((path, index) => (
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
                      alt={`报价截图 ${index + 1}`}
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
                        setBiddingInfo(prev => ({
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

            {/* 上传报价文件 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                报价文件
              </Typography>
              <Stack spacing={2}>
                {biddingInfo.documents_path?.map((path, index) => (
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
                        setBiddingInfo(prev => ({
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
                  background: 'linear-gradient(45deg, #0288d1 30%, #0277bd 90%)',
                }}
              >
                {submitting ? '提交中...' : '提交报价'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
} 