'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/app/contexts/user"
import { 
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Stack
} from "@mui/material"
import { Visibility, VisibilityOff, Login as LoginIcon, BoltRounded } from "@mui/icons-material"

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError("")

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await setUser(data.user)
      
      router.push('/dashboard/projects')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
    }}>
      {/* 顶部公司信息 */}
      <Box sx={{ 
        p: 2, 
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <BoltRounded 
          sx={{ 
            fontSize: 40,
            color: 'white',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))'
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white',
            fontWeight: 500,
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          山东雷电电力有限公司
        </Typography>
      </Box>

      {/* 登录框 */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Paper 
          elevation={4}
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 4,
            borderRadius: 2
          }}
        >
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
                投标管理系统
              </Typography>
              <Typography variant="body2" color="text.secondary">
                内部系统，仅供授权人员使用
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="登录暗号"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    height: 48,
                    background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)'
                  }}
                >
                  {loading ? '登录中...' : '登 录'}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Box>

      {/* 底部版权信息 */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          © {new Date().getFullYear()} 山东雷电电力有限公司 版权所有
        </Typography>
      </Box>
    </Box>
  )
}
