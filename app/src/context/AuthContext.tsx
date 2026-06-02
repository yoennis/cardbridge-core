import { createContext, useContext, useState } from 'react'
import { api } from '../api/client'

export interface User {
  id: string
  name: string
  email: string
}

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue)

const TOKEN_KEY = 'cb-token'

function decodeUser(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && Date.now() / 1000 > payload.exp) return null
    return { id: payload.sub, name: payload.name, email: payload.email }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    return token ? decodeUser(token) : null
  })

  const handleAuthResponse = (token: string, serverUser: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser(serverUser)
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
    handleAuthResponse(data.token, data.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/api/auth/register', { name, email, password })
    handleAuthResponse(data.token, data.user)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
