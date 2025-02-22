'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  name: string
  role: 'admin' | 'staff'
  phone?: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // 在客户端挂载后读取 localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) {
      setUser(JSON.parse(saved))
    }
  }, [])

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser)
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
      // 设置 cookie
      document.cookie = `user=${JSON.stringify(newUser)};path=/`
    } else {
      localStorage.removeItem('user')
      // 清除 cookie
      document.cookie = 'user=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT'
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, clearUser: () => handleSetUser(null) }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 