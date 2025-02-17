'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

interface FileUploadProps {
  onChange?: (key: string) => void;
  accept?: string;
}

export default function FileUpload({ onChange, accept }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
      try {
        setUploading(true);
      setError(null);
        
        // 1. 获取上传凭证和上传地址
        const tokenRes = await fetch('/api/upload/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          filename: file.name
          }),
        });
        
        if (!tokenRes.ok) {
          throw new Error('获取上传凭证失败');
        }
        
        const { token, key, upload_url } = await tokenRes.json();

        // 2. 上传到七牛云
        const formData = new FormData();
        formData.append('file', file);
        formData.append('token', token);
        formData.append('key', key);

        const uploadRes = await fetch(upload_url, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error('上传失败');
        }

        // 3. 只返回文件key
        onChange?.(key);
      setSuccess('上传成功');

      } catch (error: any) {
      setError(error.message || '上传失败');
      } finally {
        setUploading(false);
    }
  };

  return (
    <>
      <Paper
        sx={{
          border: '2px dashed',
          borderColor: 'primary.main',
          bgcolor: 'primary.light',
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
          '&:hover': {
            bgcolor: 'primary.lighter',
          }
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2,
          color: 'primary.main'
        }}>
          <UploadIcon sx={{ fontSize: 40 }} />
          <Typography variant="h6" component="div">
            点击或拖拽文件到此区域上传
          </Typography>
          {accept && (
            <Typography variant="body2" color="text.secondary">
              支持的文件类型: {accept}
            </Typography>
          )}
        </Box>

        {uploading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
          }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>

      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
} 