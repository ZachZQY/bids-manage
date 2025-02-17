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
  IconButton
} from "@mui/material"
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material"

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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div>
          <Card elevation={8}>
            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 4, 
                    textAlign: 'center',
                    background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}
                >
                  投标管理系统
                </Typography>

                {error && (
                  <div>
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  </div>
                )}

                <TextField
                  fullWidth
                  label="登录暗号"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  sx={{ mb: 4 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<LoginIcon />}
                  sx={{
                    height: 48,
                    background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                    fontSize: '1.1rem'
                  }}
                >
                  {loading ? "登录中..." : "登录"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </div>
      </Box>
    </Container>
  )
}
