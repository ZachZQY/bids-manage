'use client'

import { useParams, useRouter } from 'next/navigation'
import { Box, Typography, Button, Paper } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { STATUS_CONFIG } from '../../config'
import RegistrationTable from '../../components/RegistrationTable'
import DepositTable from '../../components/DepositTable'
import PreparationTable from '../../components/PreparationTable'
import BiddingTable from '../../components/BiddingTable'
import CompletedTable from '../../components/CompletedTable'

const TableComponents = {
  registration: RegistrationTable,
  deposit: DepositTable,
  preparation: PreparationTable,
  bidding: BiddingTable,
  completed: CompletedTable
}

export default function ProjectStatusPage() {
  const params = useParams()
  const router = useRouter()
  const status = params.status as keyof typeof STATUS_CONFIG
  const config = STATUS_CONFIG[status]
  const TableComponent = TableComponents[status as keyof typeof TableComponents]

  if (!config || !TableComponent) {
    router.push('/dashboard/my-projects')
    return null
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
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 500,
            background: config.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {config.label}项目
        </Typography>
      </Box>

      {/* 内容区域 */}
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <TableComponent />
      </Paper>
    </Box>
  )
}