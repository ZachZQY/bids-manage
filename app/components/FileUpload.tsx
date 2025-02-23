'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import { CloudUpload, Close, InsertDriveFile } from '@mui/icons-material'
import { getFileUrl } from '@/lib/qiniu'

interface FileUploadProps {
  value: string[];
  onChange: (paths: string[]) => void;
  error?: string;
  title?: string;
  required?: boolean;
  maxFiles?: number;
  accept?: string;
}

export default function FileUpload({
  value = [],
  onChange,
  error,
  title = '上传文件',
  required = false,
  maxFiles = Infinity,
  accept = '*'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // 处理文件上传
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

  // 处理文件删除
  const handleFileDelete = (path: string) => {
    onChange(value.filter(p => p !== path))
  }

  // 获取文件名
  const getFileName = (path: string) => {
    const parts = path.split('/')
    return parts[parts.length - 1]
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        {title}
        {!required && <Typography component="span" color="text.secondary"> (选填)</Typography>}
        {maxFiles < Infinity && (
          <Typography component="span" color="text.secondary"> (最多{maxFiles}个)</Typography>
        )}
      </Typography>
      <Box 
        sx={{ 
          border: theme => `1px dashed ${error ? theme.palette.error.main : theme.palette.divider}`,
          borderRadius: 1,
          p: 3
        }}
      >
        <Stack spacing={2}>
          {/* 上传按钮 */}
          <Box sx={{ textAlign: 'center' }}>
            <input
              type="file"
              accept={accept}
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
              disabled={uploading || value.length >= maxFiles}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                disabled={uploading || value.length >= maxFiles}
              >
                {uploading ? '上传中...' : '上传文件'}
              </Button>
            </label>
          </Box>

          {/* 错误提示 */}
          {(error || uploadError) && (
            <Typography color="error" variant="caption">
              {error || uploadError}
            </Typography>
          )}

          {/* 文件列表 */}
          {value.length > 0 && (
            <List disablePadding>
              {value.map((path, index) => (
                <ListItem
                  key={path}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    mb: 1,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <InsertDriveFile sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={getFileName(path)}
                    primaryTypographyProps={{
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleFileDelete(path)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Close />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
