'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProjectList from '@/app/components/ProjectList'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert, Snackbar } from '@mui/material'

export default function BidHallPage() {
  const router = useRouter()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    projectId?: number
  }>({
    open: false
  })
  const [error, setError] = useState<string | null>(null)

  // 处理接单
  const handleTakeProject = async (projectId: number) => {
    setConfirmDialog({
      open: true,
      projectId
    })
  }

  // 确认接单
  const handleConfirmTake = async () => {
    if (!confirmDialog.projectId) return

    try {
      const res = await fetch(`/api/projects/${confirmDialog.projectId}/take`, {
        method: 'POST'
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '接单失败')
      }

      // 跳转到详情页面
      router.push(`/dashboard/projects/${confirmDialog.projectId}/detail`)
    } catch (err) {
      console.error('接单失败:', err)
      setError(err instanceof Error ? err.message : '接单失败')
    } finally {
      setConfirmDialog({ open: false })
    }
  }

  return (
    <>
      <ProjectList 
        type="all" 
        showCreateButton 
        onTakeProject={handleTakeProject}
        defaultStatus="pending"
        hideStatusFilter
      />

      {/* 接单确认对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
      >
        <DialogTitle>确认接单</DialogTitle>
        <DialogContent>
          <Typography>
            确定要接此项目吗？接单后需要在报名截止时间前完成报名。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false })}>
            取消
          </Button>
          <Button
            onClick={handleConfirmTake}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)'
            }}
          >
            确认接单
          </Button>
        </DialogActions>
      </Dialog>

      {/* 错误提示 */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  )
} 