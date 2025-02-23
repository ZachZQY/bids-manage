'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  Alert
} from '@mui/material'
import { CloudUpload, Close } from '@mui/icons-material'
import { getFileUrl } from '@/lib/qiniu'

interface ImageUploadProps {
  value: string[];
  onChange: (paths: string[]) => void;
  error?: string;
  title?: string;
  required?: boolean;
  maxFiles?: number;
}

export default function ImageUpload({
  value = [],
  onChange,
  error,
  title = '上传图片',
  required = false,
  maxFiles = Infinity
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // 处理图片上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 检查文件数量限制
    if (value.length + files.length > maxFiles) {
      setUploadError(`最多只能上传 ${maxFiles} 个文件`)
      return
    }

    try {
      setUploading(true)
      setUploadError('')

      // 创建 FormData
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      // 上传文件
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message)
      }

      const { paths } = await res.json()

      // 更新文件列表
      onChange([...value, ...paths])
    } catch (err) {
      console.error('上传文件失败:', err)
      setUploadError(err instanceof Error ? err.message : '上传文件失败')
    } finally {
      setUploading(false)
    }
  }

  // 处理图片删除
  const handleFileDelete = (path: string) => {
    onChange(value.filter(p => p !== path))
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        {title}
        {!required && <Typography component="span" color="text.secondary"> (选填)</Typography>}
        {maxFiles < Infinity && (
          <Typography component="span" color="text.secondary"> (最多{maxFiles}张)</Typography>
        )}
      </Typography>
      <Box 
        sx={{ 
          border: theme => `1px dashed ${error ? theme.palette.error.main : theme.palette.divider}`,
          borderRadius: 1,
          p: 3,
          textAlign: 'center'
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="image-upload"
          disabled={uploading || value.length >= maxFiles}
        />
        <label htmlFor="image-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            sx={{ mb: 1 }}
            disabled={uploading || value.length >= maxFiles}
          >
            {uploading ? '上传中...' : '上传图片'}
          </Button>
        </label>

        {/* 错误提示 */}
        {(error || uploadError) && (
          <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
            {error || uploadError}
          </Typography>
        )}

        {/* 图片预览 */}
        {value.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
            {value.map((path, index) => (
              <Paper
                key={path}
                sx={{
                  width: 120,
                  height: 120,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <img
                  src={getFileUrl(path)}
                  alt={`图片 ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleFileDelete(path)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                >
                  <Close sx={{ fontSize: 16, color: 'white' }} />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  )
}
