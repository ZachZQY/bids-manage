'use client'

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Autocomplete,
  Stack,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dayjs, { Dayjs } from 'dayjs'
import type { Company } from '@/types/schema'
import { useDebounce } from '@/app/hooks/useDebounce'

interface FormData {
  batch_name: string
  product_name: string
  bidUserId: string
  biddingDeadline: Dayjs
  registrationDeadline: Dayjs
  bid_company_bid_companies: string | number
}

interface User {
  id: number
  name: string
  role: 'admin' | 'staff'
}

const getInitialFormData = (): FormData => ({
  batch_name: '',
  product_name: '',
  bidUserId: '',
  biddingDeadline: dayjs().add(7, 'day'),
  registrationDeadline: dayjs().add(3, 'day'),
  bid_company_bid_companies: ''
})

export default function CreateProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>(getInitialFormData())
  const [users, setUsers] = useState<User[]>([])
  const [showBidUser, setShowBidUser] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [projectNames, setProjectNames] = useState<string[]>([])
  const [loadingNames, setLoadingNames] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const debouncedInputValue = useDebounce(inputValue, 300)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 批次名称自动填充
  const [batchInputValue, setBatchInputValue] = useState('')
  const [batchNames, setBatchNames] = useState<string[]>([])
  const [loadingBatchNames, setLoadingBatchNames] = useState(false)
  const debouncedBatchValue = useDebounce(batchInputValue, 300)

  // 产品名称自动填充
  const [productInputValue, setProductInputValue] = useState('')
  const [productNames, setProductNames] = useState<string[]>([])
  const [loadingProductNames, setLoadingProductNames] = useState(false)
  const debouncedProductValue = useDebounce(productInputValue, 300)

  useEffect(() => {
    setFormData(getInitialFormData())
    return () => {
      setFormData(getInitialFormData())
      setShowBidUser(false)
      setError('')
    }
  }, [])

  const handleSuccess = useCallback(() => {
    setFormData(getInitialFormData())
    setShowBidUser(false)
    setError('')
    router.replace('/dashboard/all-projects')
  }, [router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setUsers(data.users)
      } catch (err) {
        console.error('获取用户列表失败:', err)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/admin/companies?status=active')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCompanies(data.companies)
      } catch (err) {
        console.error('获取公司列表失败:', err)
      }
    }

    fetchCompanies()
  }, [])

  useEffect(() => {
    const fetchBatchNames = async () => {
      if (!debouncedBatchValue) {
        setBatchNames([])
        return
      }

      try {
        setLoadingBatchNames(true)
        const res = await fetch(`/api/projects/names?type=batch&keyword=${encodeURIComponent(debouncedBatchValue)}`)
        if (!res.ok) throw new Error('获取批次名称失败')
        
        const data = await res.json() as { names: string[] }
        const uniqueNames = Array.from(new Set(data.names.map(item => item)))
        setBatchNames(uniqueNames)
      } catch (err) {
        console.error('获取批次名称失败:', err)
      } finally {
        setLoadingBatchNames(false)
      }
    }

    fetchBatchNames()
  }, [debouncedBatchValue])

  useEffect(() => {
    const fetchProductNames = async () => {
      if (!debouncedProductValue) {
        setProductNames([])
        return
      }

      try {
        setLoadingProductNames(true)
        const res = await fetch(`/api/projects/names?type=product&keyword=${encodeURIComponent(debouncedProductValue)}`)
        if (!res.ok) throw new Error('获取产品名称失败')
        
        const data = await res.json() as { names: string[] }
        const uniqueNames = Array.from(new Set(data.names.map(item => item)))
        setProductNames(uniqueNames)
      } catch (err) {
        console.error('获取产品名称失败:', err)
      } finally {
        setLoadingProductNames(false)
      }
    }

    fetchProductNames()
  }, [debouncedProductValue])

  const validateForm = (): string => {
    if (!formData.batch_name.trim()) {
      return '请输入投标批次名称'
    }

    if (!formData.product_name.trim()) {
      return '请输入投标产品名称'
    }

    if (!formData.biddingDeadline.isValid()) {
      return '请输入正确的开标时间格式'
    }
    if (!formData.registrationDeadline.isValid()) {
      return '请输入正确的报名截止时间格式'
    }

    const now = dayjs()
    if (formData.biddingDeadline.isBefore(now)) {
      return '开标时间不能早于当前时间'
    }
    if (formData.registrationDeadline.isBefore(now)) {
      return '报名截止时间不能早于当前时间'
    }
    if (formData.registrationDeadline.isAfter(formData.biddingDeadline)) {
      return '报名截止时间必须早于开标时间'
    }

    if (showBidUser && !formData.bidUserId) {
      return '请选择接单人'
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 打开确认弹窗
    setConfirmDialogOpen(true)
  }

  const handleConfirmPublish = async () => {
    try {
      setSubmitting(true)
      setError('')

      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setConfirmDialogOpen(false)
        return
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_name: formData.batch_name,
          product_name: formData.product_name,
          bid_user_bid_users: showBidUser ? Number(formData.bidUserId) : undefined,
          bidding_deadline: formData.biddingDeadline.valueOf(),
          registration_deadline: formData.registrationDeadline.valueOf(),
          bid_company_bid_companies: formData.bid_company_bid_companies
        })
      })

      if (!res.ok) {
        throw new Error('创建项目失败')
      }

      handleSuccess()

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      setConfirmDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBiddingDeadlineChange = (newValue: Dayjs | null) => {
    if (!newValue) {
      setError('请选择开标时间')
      return
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        biddingDeadline: newValue,
        registrationDeadline: prev.registrationDeadline &&
          prev.registrationDeadline.isAfter(newValue) ?
          newValue : prev.registrationDeadline || newValue
      }
      return newData
    })

    if (!newValue.isValid() || isNaN(newValue.valueOf())) {
      setError('请输入正确的开标时间格式')
      return
    }

    if (newValue.isBefore(dayjs())) {
      setError('开标时间不能早于当前时间')
      return
    }

    setError('')
  }

  const handleRegistrationDeadlineChange = (newValue: Dayjs | null) => {
    if (!newValue) {
      setError('请选择报名截止时间')
      return
    }
    setFormData(prev => ({ ...prev, registrationDeadline: newValue }))
    
    if (!newValue.isValid() || isNaN(newValue.valueOf())) {
      setError('请输入正确的报名截止时间格式')
      return
    }

    if (newValue.isBefore(dayjs())) {
      setError('报名截止时间不能早于当前时间')
      return
    }

    if (newValue.isAfter(formData.biddingDeadline)) {
      setError('报名截止时间必须早于开标时间')
      return
    }

    setError('')
  }

  const renderUserSelect = () => {
    if (!showBidUser) return null

    return (
      <Box>
        <Autocomplete
          options={users}
          getOptionLabel={(option) => `${option.name} (${option.role === 'admin' ? '管理员' : '员工'})`}
          value={users.find(user => user.id.toString() === formData.bidUserId) || null}
          onChange={(_, newValue) => {
            setFormData(prev => ({
              ...prev,
              bidUserId: newValue ? newValue.id.toString() : ''
            }))
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="指定接单人"
              required
              error={!!error && error.includes('接单人')}
              placeholder="搜索用户名或角色"
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props
            return (
              <li key={option.id} {...otherProps}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  py: 1,
                  px: 0.5
                }}>
                  <Typography sx={{ fontWeight: 500 }}>{option.name}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: option.role === 'admin' ? 'primary.main' : 'success.main',
                      fontWeight: 500
                    }}
                  >
                    {option.role === 'admin' ? '管理员' : '员工'}
                  </Typography>
                </Box>
              </li>
            )
          }}
          filterOptions={(options, { inputValue }) => {
            const searchValue = inputValue.toLowerCase()
            return options.filter(option =>
              option.name.toLowerCase().includes(searchValue) ||
              (option.role === 'admin' ? '管理员' : '员工').includes(searchValue)
            )
          }}
          sx={{ width: '100%' }}
          noOptionsText="未找到匹配的用户"
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mt: 1,
            ml: 1.5
          }}
        >
          指定接单人后项目会自动加入该账号的个人项目列表中
        </Typography>
      </Box>
    )
  }

  // 检查表单是否可以提交
  const isSubmittable = useCallback(() => {
    // 基本字段验证
    if (!formData.batch_name.trim()) return false
    if (!formData.product_name.trim()) return false

    // 时间格式验证
    if (!formData.biddingDeadline || !formData.registrationDeadline) return false
    if (!formData.biddingDeadline.isValid() || !formData.registrationDeadline.isValid()) return false

    // 时间值验证
    const biddingTime = formData.biddingDeadline.valueOf()
    const registrationTime = formData.registrationDeadline.valueOf()
    if (isNaN(biddingTime) || isNaN(registrationTime)) return false

    // 时间逻辑验证
    const now = dayjs()
    if (formData.biddingDeadline.isBefore(now) ||
      formData.registrationDeadline.isBefore(now) ||
      formData.registrationDeadline.isAfter(formData.biddingDeadline)) {
      return false
    }

    

    // 指定接单人验证
    if (showBidUser && !formData.bidUserId) return false

    return true
  }, [formData, showBidUser])

  return (
    <>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper sx={{
          p: 4,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{
            mb: 4,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            发布新项目
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* 投标批次输入 */}
              <Autocomplete
                freeSolo
                options={batchNames}
                loading={loadingBatchNames}
                value={formData.batch_name}
                inputValue={batchInputValue}
                onInputChange={(_, newValue) => {
                  setBatchInputValue(newValue)
                  setFormData(prev => ({
                    ...prev,
                    batch_name: newValue
                  }))
                }}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setFormData(prev => ({ 
                      ...prev, 
                      batch_name: newValue
                    }))
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="投标批次"
                    required
                    error={!!error && !formData.batch_name}
                    helperText={!!error && !formData.batch_name ? '请输入投标批次' : ''}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingBatchNames ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              {/* 投标产品输入 */}
              <Autocomplete
                freeSolo
                options={productNames}
                loading={loadingProductNames}
                value={formData.product_name}
                inputValue={productInputValue}
                onInputChange={(_, newValue) => {
                  setProductInputValue(newValue)
                  setFormData(prev => ({
                    ...prev,
                    product_name: newValue
                  }))
                }}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setFormData(prev => ({ 
                      ...prev, 
                      product_name: newValue
                    }))
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="投标产品"
                    required
                    error={!!error && !formData.product_name}
                    helperText={!!error && !formData.product_name ? '请输入投标产品' : ''}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingProductNames ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <DateTimePicker
                label="开标时间"
                value={formData.biddingDeadline}
                onChange={handleBiddingDeadlineChange}
                minDateTime={dayjs()}
                format="YYYY年MM月DD日 HH:mm"
                ampm={false}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!error && (error.includes('开标时间') || error.includes('格式')),
                    helperText: error && (error.includes('开标时间') || error.includes('格式')) ? error : ''
                  },
                  actionBar: {
                    actions: ['clear', 'cancel', 'accept']
                  }
                }}
                localeText={{
                  okButtonLabel: '确定',
                  cancelButtonLabel: '取消',
                  clearButtonLabel: '清除'
                }}
              />

              <DateTimePicker
                label="报名截止时间"
                value={formData.registrationDeadline}
                onChange={handleRegistrationDeadlineChange}
                minDateTime={dayjs()}
                maxDateTime={formData.biddingDeadline}
                format="YYYY年MM月DD日 HH:mm"
                ampm={false}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!error && (error.includes('报名截止时间') || error.includes('格式')),
                    helperText: error && (error.includes('报名截止时间') || error.includes('格式')) ? error : ''
                  },
                  actionBar: {
                    actions: ['clear', 'cancel', 'accept']
                  }
                }}
                localeText={{
                  okButtonLabel: '确定',
                  cancelButtonLabel: '取消',
                  clearButtonLabel: '清除'
                }}
              />

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'action.hover',
                borderRadius: 1,
                p: 1
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showBidUser}
                      onChange={(e) => {
                        setShowBidUser(e.target.checked)
                        if (!e.target.checked) {
                          setFormData(prev => ({ ...prev, bidUserId: '' }))
                        }
                      }}
                    />
                  }
                  label="指定接单人"
                  sx={{
                    mr: 0,
                    '& .MuiFormControlLabel-label': {
                      cursor: 'default',
                      fontWeight: 500
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 2 }}
                >
                  不指定时项目将进入项目大厅，所有人可接单
                </Typography>
              </Box>

              {renderUserSelect()}

              <Autocomplete
                options={companies}
                getOptionLabel={(option) => option.name}
                value={companies.find(company => company.id === formData.bid_company_bid_companies) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    bid_company_bid_companies: newValue ? newValue.id : ''
                  }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="所属公司"
                    required
                    error={!!error && error.includes('公司')}
                    placeholder="搜索公司名称"
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props
                  return (
                    <li key={option.id} {...otherProps}>
                      <Typography>{option.name}</Typography>
                    </li>
                  )
                }}
                filterOptions={(options, { inputValue }) => {
                  const searchValue = inputValue.toLowerCase()
                  return options.filter(option =>
                    option.name.toLowerCase().includes(searchValue)
                  )
                }}
                noOptionsText="未找到匹配的公司"
              />

              <Box sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
                mt: 2,
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  sx={{
                    minWidth: 120,
                    borderRadius: 2
                  }}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!!error || loading || !isSubmittable()}
                  sx={{
                    minWidth: 120,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                    boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 30%, #0d47a1 90%)',
                    }
                  }}
                >
                  {loading ? '发布中...' : '发布项目'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Box>

      {/* 确认弹窗 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !submitting && setConfirmDialogOpen(false)}
      >
        <DialogTitle>确认发布项目</DialogTitle>
        <DialogContent>
          <Typography>
            发布项目后，系统将自动向所有账号发送短信通知。确定要发布吗？
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary">
              投标批次：{formData.batch_name}
            </Typography>
            <Typography variant="subtitle2" color="primary">
              投标产品：{formData.product_name}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              开标时间：{formData.biddingDeadline?.format('YYYY年MM月DD日 HH:mm')}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              报名截止时间：{formData.registrationDeadline?.format('YYYY年MM月DD日 HH:mm')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirmPublish}
            variant="contained"
            disabled={submitting}
            autoFocus
          >
            {submitting ? <CircularProgress size={24} /> : '确认发布'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}