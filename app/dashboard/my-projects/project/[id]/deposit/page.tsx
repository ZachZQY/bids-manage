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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { ArrowBack, CloudUpload, Delete } from '@mui/icons-material'
import type { Project, DepositInfo } from '@/types/schema'
import { DepositType } from '@/types/schema'
import { getFileUrl } from '@/lib/qiniu'

export default function ProjectDepositPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    type: DepositType.NONE,
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
        if (data.project.deposit_info) {
          setDepositInfo(data.project.deposit_info)
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

      setDepositInfo(prev => ({
        ...prev,
        images_path: [...(prev.images_path || []), data.path]
      }))
    } catch (err) {
      console.error('上传图片失败:', err)
      setError(err instanceof Error ? err.message : '上传图片失败')
    }
  }

  // 提交保证金
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      const res = await fetch(`/api/my-projects/project/${params.id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(depositInfo)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 提交成功后跳转
      router.push(`/dashboard/my-projects/status/preparation`)

    } catch (err) {
      console.error('提交保证金失败:', err)
      setError(err instanceof Error ? err.message : '提交保证金失败')
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
            上传保证金 - {project.name}
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>保证金方式</InputLabel>
              <Select
                value={depositInfo.type}
                label="保证金方式"
                onChange={e => setDepositInfo(prev => ({
                  ...prev,
                  type: e.target.value as DepositType
                }))}
              >
                <MenuItem value={DepositType.INSURANCE}>保证金保险</MenuItem>
                <MenuItem value={DepositType.BANK_GUARANTEE}>银行保函</MenuItem>
                <MenuItem value={DepositType.TRANSFER}>网银汇款</MenuItem>
                <MenuItem value={DepositType.NONE}>不收取保证金</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                保证金凭证
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {depositInfo.images_path?.map((path, index) => (
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
                      alt={`保证金凭证 ${index + 1}`}
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
                        setDepositInfo(prev => ({
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
                    onChange={handleUpload}
                  />
                  <CloudUpload />
                  <Typography variant="caption" align="center">
                    上传凭证
                  </Typography>
                </Button>
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                disabled={submitting}
                onClick={handleSubmit}
                sx={{
                  minWidth: 120,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                }}
              >
                {submitting ? <CircularProgress size={24} /> : '提交保证金'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}