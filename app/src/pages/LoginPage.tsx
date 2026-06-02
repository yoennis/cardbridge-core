import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/layout/AuthLayout'
import { Button, Input, Badge } from '../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(searchParams.get('next') ?? '/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Welcome back</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Badge variant="error" size="md" icon={<AlertCircle size={15} />}>
            {error}
          </Badge>
        )}

        <Input
          type="email"
          label="Email"
          required
          clearable
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
          icon={<Mail size={15} />}
        />

        <Input
          type="password"
          label="Password"
          required
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="••••••••"
          icon={<Lock size={15} />}
        />

        <Button type="submit" size="lg" isLoading={loading} icon={<LogIn size={16} />} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
        No account?{' '}
        <Link
          to={searchParams.get('next') ? `/register?next=${encodeURIComponent(searchParams.get('next')!)}` : '/register'}
          className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
