import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Lock, ShieldCheck, UserPlus, AlertCircle, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/layout/AuthLayout'
import { Button, Input, Badge } from '../components/ui'

function passwordStrength(pwd: string): { score: number; label: string; color: string; bg: string } {
  if (!pwd) return { score: 0, label: '', color: '', bg: '' }
  let score = 0
  if (pwd.length >= 8)  score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { score: 1, label: 'Weak',   color: 'text-red-500',    bg: 'bg-red-500' }
  if (score <= 3) return { score: 3, label: 'Fair',   color: 'text-amber-500',  bg: 'bg-amber-500' }
  return              { score: 5, label: 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500' }
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const strength = passwordStrength(form.password)
  const confirmTouched = form.confirm.length > 0
  const passwordsMatch = form.password === form.confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!passwordsMatch) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate(searchParams.get('next') ?? '/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Create your account</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Start managing your devices wirelessly
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Badge variant="error" size="md" icon={<AlertCircle size={15} />}>
            {error}
          </Badge>
        )}

        <Input
          type="text"
          label="Full name"
          required
          clearable
          value={form.name}
          onChange={set('name')}
          placeholder="John Doe"
          icon={<User size={15} />}
        />

        <Input
          type="email"
          label="Email"
          required
          clearable
          value={form.email}
          onChange={set('email')}
          placeholder="you@example.com"
          icon={<Mail size={15} />}
        />

        {/* Password + strength */}
        <div>
          <Input
            type="password"
            label="Password"
            required
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••"
            icon={<Lock size={15} />}
          />
          {form.password && (
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= strength.score ? strength.bg : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[11px] font-semibold w-10 ${strength.color}`}>{strength.label}</span>
            </div>
          )}
        </div>

        {/* Confirm password + match indicator */}
        <div>
          <Input
            type="password"
            label="Confirm password"
            required
            value={form.confirm}
            onChange={set('confirm')}
            placeholder="••••••••"
            icon={<ShieldCheck size={15} />}
          />
          {confirmTouched && (
            <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium ${
              passwordsMatch ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {passwordsMatch
                ? <><Check size={12} /> Passwords match</>
                : <><X size={12} /> Passwords don't match</>
              }
            </div>
          )}
        </div>

        <Button type="submit" size="lg" isLoading={loading} icon={<UserPlus size={16} />} className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
        Already have an account?{' '}
        <Link
          to={searchParams.get('next') ? `/login?next=${encodeURIComponent(searchParams.get('next')!)}` : '/login'}
          className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
