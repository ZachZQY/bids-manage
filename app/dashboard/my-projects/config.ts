import type { BidStatus } from "@/types/schema"

export const STATUS_CONFIG: Record<BidStatus, {
  label: string
  color: string
  bgColor: string
  gradient: string
}> = {
  pending: {
    label: '待接单',
    color: '#1976d2',
    bgColor: '#E3F2FD',
    gradient: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)'
  },
  registration: {
    label: '报名阶段',
    color: '#ed6c02',
    bgColor: '#FFF3E0',
    gradient: 'linear-gradient(45deg, #ed6c02 30%, #e65100 90%)'
  },
  deposit: {
    label: '保证金阶段',
    color: '#2e7d32',
    bgColor: '#E8F5E9',
    gradient: 'linear-gradient(45deg, #2e7d32 30%, #1b5e20 90%)'
  },
  preparation: {
    label: '上传阶段',
    color: '#9c27b0',
    bgColor: '#F3E5F5',
    gradient: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)'
  },
  bidding: {
    label: '报价阶段',
    color: '#0288d1',
    bgColor: '#E1F5FE',
    gradient: 'linear-gradient(45deg, #0288d1 30%, #0277bd 90%)'
  },
  completed: {
    label: '已完成',
    color: '#757575',
    bgColor: '#F5F5F5',
    gradient: 'linear-gradient(45deg, #757575 30%, #616161 90%)'
  }
}