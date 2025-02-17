'use client'

import { 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Typography
} from "@mui/material"
import { useState } from "react"
import type { BidStatus } from "@/types/schema"

export interface ProjectFormData {
  name: string
  bidding_deadline: string
  registration_deadline: string
}

interface ProjectFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProjectFormData) => Promise<void>
}

export default function ProjectForm({ isOpen, onClose, onSubmit }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    bidding_deadline: '',
    registration_deadline: ''
  })

  const handleSubmit = async () => {
    try {
      setLoading(true)
      await onSubmit(formData)
      onClose()
      setFormData({
        name: '',
        bidding_deadline: '',
        registration_deadline: ''
      })
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ 
            background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            发布新项目
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请填写项目基本信息
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="项目名称"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            fullWidth
            required
          />
          <TextField
            label="开标时间"
            type="datetime-local"
            value={formData.bidding_deadline}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setFormData(prev => ({ ...prev, bidding_deadline: e.target.value }))
            }
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="报名截止时间"
            type="datetime-local"
            value={formData.registration_deadline}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))
            }
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
          }}
        >
          {loading ? "发布中..." : "发布"}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 