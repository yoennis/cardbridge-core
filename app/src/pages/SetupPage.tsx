import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Wifi, WifiOff, ChevronRight, Check, HardDrive, Eye, EyeOff, ShieldCheck, UserPlus, LogIn, X, MessageSquare, Bug, Send, BookOpen, Lock, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, getDeviceInfo, activateDevice, type DeviceInfo } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from '../utils/toast'
import Logo from '../components/Logo'
import { Button } from '../components/ui'

// ── Support modal ─────────────────────────────────────────────────────────────

type SupportMode = 'contact' | 'report'

const ISSUE_CATEGORIES = ['Activation problem', 'WiFi / connectivity', 'App not loading', 'Hardware issue', 'Other']

function SupportModal({ mode, serial, version, onClose }: {
  mode: SupportMode
  serial?: string
  version?: string
  onClose: () => void
}) {
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0])
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [attachDiag, setAttachDiag] = useState(true)
  const [fetchingDiag, setFetchingDiag] = useState(false)
  const isReport = mode === 'report'

  const handleSend = async () => {
    let diagText = ''
    if (attachDiag) {
      setFetchingDiag(true)
      try {
        const res = await fetch('/api/device/diagnostics')
        if (res.ok) {
          const d = await res.json()
          diagText = [
            '\n--- System Diagnostics ---',
            `Uptime: ${d.uptime}`,
            `Serial: ${d.serial}  Firmware: v${d.version}`,
            'Interfaces: ' + (d.interfaces ?? []).map((i: any) => `${i.name}=${i.ip ?? 'no-ip'}`).join(', '),
            'Services: ' + (d.services ?? []).map((s: any) => `${s.name}:${s.active ? 'active' : 'INACTIVE'}`).join(', '),
            'Recent logs:',
            ...(d.recentLogs ?? []).slice(-15),
          ].join('\n')
        }
      } catch {
        diagText = '\n--- Diagnostics unavailable ---'
      } finally {
        setFetchingDiag(false)
      }
    }

    const subject = isReport
      ? `[Bug Report] ${category} — ${serial ?? 'Unknown unit'}`
      : `Support request — ${serial ?? 'CardBridge unit'}`

    const body = [
      isReport ? `Category: ${category}` : '',
      `Serial: ${serial ?? '—'}`,
      `Firmware: ${version ? `v${version}` : '—'}`,
      email ? `Reply to: ${email}` : '',
      '',
      message,
      diagText,
    ].filter(Boolean).join('\n')

    window.location.href = `mailto:support@cardbridge.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/8">
              {isReport ? <Bug size={15} className="text-slate-300" /> : <MessageSquare size={15} className="text-slate-300" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{isReport ? 'Report an issue' : 'Contact support'}</p>
              <p className="text-[11px] text-slate-500">support@cardbridge.io</p>
            </div>
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Pre-filled unit info */}
          {serial && (
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/8">
              <HardDrive size={14} className="text-slate-500 shrink-0" />
              <span className="text-xs text-slate-400 font-mono">{serial}</span>
              {version && <span className="text-xs text-slate-600 ml-auto">v{version}</span>}
            </div>
          )}

          {/* Category (report only) */}
          {isReport && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select
                title="Issue category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-2 focus:ring-white/20 transition"
              >
                {ISSUE_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {isReport ? 'Describe the issue' : 'How can we help?'}
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={isReport
                ? 'What happened? What were you doing when it occurred?'
                : 'Tell us what you need help with…'}
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-white/20 resize-none transition"
            />
          </div>

          {/* Reply email */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Your email (for reply)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-white/20 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5 gap-3">
          <button
            type="button"
            onClick={() => setAttachDiag(p => !p)}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${attachDiag ? 'text-slate-400' : 'text-slate-600'}`}
          >
            <div className={`w-7 h-4 rounded-full transition-colors relative ${attachDiag ? 'bg-slate-500' : 'bg-slate-700'}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${attachDiag ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </div>
            Attach diagnostics
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || fetchingDiag}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {fetchingDiag
                ? <><span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />Preparing…</>
                : <><Send size={13} />Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Gate (shown when not authenticated) ──────────────────────────────────────

function SetupGate({ pin }: { pin: string }) {
  const { data: deviceInfo } = useQuery({
    queryKey: ['device-info-gate'],
    queryFn: getDeviceInfo,
    retry: 1,
    staleTime: Infinity,
  })

  const [supportMode, setSupportMode] = useState<SupportMode | null>(null)
  const next = encodeURIComponent(`/setup${pin ? `?pin=${pin}` : ''}`)

  return (
    <div className="setup-gate-bg min-h-screen flex flex-col">
      {/* Subtle ambient light at top */}
      <div className="setup-gate-glow absolute inset-x-0 top-0 h-96 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
        <Logo variant="light" size="sm" />
        <Link
          to="/quick-start"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <BookOpen size={13} />
          Quick Start Guide
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pb-16">
        {/* Hero section */}
        <div className="flex flex-col items-center mb-12 text-center">
          {/* Icon with glow */}
          <div className="relative mb-8">
            <div className="setup-gate-icon-glow absolute inset-0 scale-150 rounded-full blur-2xl opacity-30" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-b from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center shadow-2xl">
              <HardDrive size={30} className="text-slate-200" />
            </div>
            {deviceInfo && (
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 rounded-full shadow-lg shadow-emerald-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-bold tracking-wider whitespace-nowrap">READY</span>
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="setup-gate-headline text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            Welcome to CardBridge
          </h1>

          {/* Serial pill */}
          {deviceInfo ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-slate-400 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {deviceInfo.serial}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-600 mb-5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              Detecting unit…
            </span>
          )}

          <p className="text-slate-400 text-sm max-w-[260px] leading-relaxed mb-6">
            Your unit is ready. Create an account or sign in to activate it and start managing your recordings.
          </p>

          {/* Value props */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {['Wireless', 'Automatic', 'Private'].map((label, i) => (
              <span key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-[11px] text-slate-500">
                <span className={`w-1 h-1 rounded-full ${['bg-blue-400', 'bg-violet-400', 'bg-emerald-400'][i]}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Action cards */}
        <div className="w-full max-w-xs space-y-3">
          <Link
            to={`/register?next=${next}`}
            className="group flex items-center justify-between bg-white hover:bg-slate-50 active:scale-[0.98] transition-all rounded-2xl px-5 py-4 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 shrink-0">
                <UserPlus size={16} className="text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">New here</p>
                <p className="font-semibold text-slate-900">Create account</p>
                <p className="text-xs text-slate-500 mt-0.5">Get set up in under a minute</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all ml-3 shrink-0" />
          </Link>

          <div className="flex items-center gap-3 px-1">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] text-slate-600 font-medium">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <Link
            to={`/login?next=${next}`}
            className="group flex items-center justify-between bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all rounded-2xl px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 shrink-0">
                <LogIn size={16} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Already registered</p>
                <p className="font-semibold text-white">Sign in</p>
                <p className="text-xs text-slate-500 mt-0.5">Link this unit to your account</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all ml-3 shrink-0" />
          </Link>
        </div>

        <p className="flex items-center gap-1.5 mt-8 text-[11px] text-slate-600">
          <ShieldCheck size={12} />
          This unit will be permanently linked to your account
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-center gap-4 px-6 py-5 border-t border-white/5">
        <span className="text-[11px] text-slate-600">© {new Date().getFullYear()} CardBridge</span>
        <span className="text-slate-700">·</span>
        <Link to="/quick-start" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
          Quick Start Guide
        </Link>
        <span className="text-slate-700">·</span>
        <button type="button" onClick={() => setSupportMode('contact')} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors">
          Contact support
        </button>
        <span className="text-slate-700">·</span>
        <button type="button" onClick={() => setSupportMode('report')} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors">
          Report an issue
        </button>
      </footer>

      {supportMode && (
        <SupportModal
          mode={supportMode}
          serial={deviceInfo?.serial}
          version={deviceInfo?.version}
          onClose={() => setSupportMode(null)}
        />
      )}
    </div>
  )
}

// ── Wizard (shown when authenticated) ────────────────────────────────────────

function SetupWizard({ pin }: { pin: string }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [infoError, setInfoError] = useState(false)
  const [pinValidated, setPinValidated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinChecking, setPinChecking] = useState(false)
  const [name, setName] = useState('')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  type WifiNet = { ssid: string; signal: number; security: string }
  const [networks, setNetworks] = useState<WifiNet[] | null>(null)
  const [scanning, setScanning] = useState(false)

  const scanNetworks = useCallback(async () => {
    setScanning(true)
    try {
      const r = await api.get<WifiNet[]>('/api/network/scan')
      setNetworks(r.data)
    } catch {
      setNetworks([])
    } finally {
      setScanning(false)
    }
  }, [])

  const fetchInfo = () => {
    setInfoError(false)
    setDeviceInfo(null)
    setPinValidated(false)
    setPinError(null)

    getDeviceInfo()
      .then(async info => {
        setDeviceInfo(info)
        setName(info.name)

        if (!info.pinRequired) {
          setPinValidated(true)
          return
        }

        if (pin) {
          setPinChecking(true)
          try {
            await activateDevice(pin)
            setPinValidated(true)
          } catch (err: any) {
            if (err.response?.status === 409) {
              setPinError('This unit is already registered to another account.')
            } else {
              setPinError('The QR code PIN was not accepted. Enter it manually below.')
            }
          } finally {
            setPinChecking(false)
          }
        }
      })
      .catch(() => setInfoError(true))
  }

  useEffect(() => { fetchInfo() }, [])

  const handleManualPin = async () => {
    if (!pinInput.trim()) return
    setPinChecking(true)
    setPinError(null)
    try {
      await activateDevice(pinInput.trim().toUpperCase())
      setPinValidated(true)
    } catch (err: any) {
      if (err.response?.status === 409) {
        setPinError('This unit is already registered to another account.')
      } else {
        setPinError('Wrong PIN — check the label on your CardBridge box.')
      }
    } finally {
      setPinChecking(false)
    }
  }

  const handleNameSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await api.post('/api/device/name', { name: name.trim() })
      setStep(3)
      scanNetworks()
    } catch {
      toast.error('Failed to save name')
    } finally {
      setSaving(false)
    }
  }

  const [wifiState, setWifiState] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')
  const [wifiError, setWifiError] = useState('')
  const [wifiIP, setWifiIP] = useState('')

  const handleWifiSave = async () => {
    if (!ssid.trim()) return
    setWifiState('connecting')
    setWifiError('')
    try {
      const r = await api.post<{ connected: boolean; ip?: string; error?: string }>(
        '/api/network/connect', { ssid: ssid.trim(), password }
      )
      if (r.data.connected) {
        setWifiIP(r.data.ip ?? '')
        setWifiState('success')
        setTimeout(() => setStep(4), 1800)
      } else {
        setWifiError(r.data.error ?? 'Could not connect. Check the password and try again.')
        setWifiState('error')
      }
    } catch {
      setWifiError('Connection test failed. Check the password and try again.')
      setWifiState('error')
    }
  }

  const stepLabels = ['Detect', 'Name', 'WiFi', 'Done']

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => {
            const s = i + 1
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-colors ${
                  step > s
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : step === s
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {step > s ? <Check size={11} /> : s}
                </div>
                <span className={`text-xs hidden sm:inline ${
                  step === s ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'
                }`}>{label}</span>
                {s < stepLabels.length && (
                  <ChevronRight size={12} className="text-slate-300 dark:text-slate-700 mx-0.5" />
                )}
              </div>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-5 pt-12 pb-16">
        <div className="w-full max-w-md">

          {/* Step 1 — Detect */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Connecting to your unit</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">We'll detect your CardBridge and verify your activation code.</p>

              {!deviceInfo && !infoError && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                  <div className="w-7 h-7 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Connecting to CardBridge unit…</p>
                </div>
              )}

              {infoError && (
                <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Unit not detected</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                    Make sure you're on the <span className="font-mono">CardBridge</span> WiFi or your home network.
                  </p>
                  <Button variant="secondary" onClick={fetchInfo}>Retry</Button>
                </div>
              )}

              {deviceInfo && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <HardDrive size={16} className="text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">CardBridge unit found</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Connected
                        </p>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { label: 'Serial', value: deviceInfo.serial },
                        { label: 'Firmware', value: `v${deviceInfo.version}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                          <span className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {deviceInfo.pinRequired && !pinValidated && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                      {pinChecking ? (
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin shrink-0" />
                          <p className="text-sm">Validating activation code…</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Enter activation PIN</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Found on the label inside your CardBridge box.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={pinInput}
                              onChange={e => setPinInput(e.target.value.toUpperCase())}
                              onKeyDown={e => e.key === 'Enter' && handleManualPin()}
                              placeholder="e.g. A3F7"
                              maxLength={8}
                              autoFocus
                              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm font-mono outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition uppercase tracking-widest"
                            />
                            <Button onClick={handleManualPin} disabled={!pinInput.trim()}>Verify</Button>
                          </div>
                          {pinError && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">{pinError}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {pinValidated && deviceInfo.pinRequired && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Unit activated — linked to your account</p>
                    </div>
                  )}

                  <Button onClick={() => setStep(2)} disabled={!pinValidated} className="w-full">
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Name */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Name your unit</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Give it a name so you can identify it later — this is for the hardware unit, not your recording devices.
              </p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                placeholder='e.g. "Home Unit" or "Car Bridge"'
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition mb-6"
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleNameSave} disabled={!name.trim() || saving} className="flex-1">
                  {saving ? 'Saving…' : <><span>Continue</span><ChevronRight size={16} /></>}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — WiFi */}
          {step === 3 && (
            <div>
              {/* Connecting overlay */}
              {wifiState === 'connecting' && (
                <div className="text-center py-10">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-blue-50 dark:bg-blue-900/20 animate-ping opacity-40" />
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                      <Wifi size={28} className="text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Testing connection…</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Connecting to <span className="font-medium text-slate-700 dark:text-slate-300">"{ssid}"</span></p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">This may take up to 15 seconds</p>
                </div>
              )}

              {/* Success overlay */}
              {wifiState === 'success' && (
                <div className="text-center py-10">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mx-auto mb-6">
                    <Check size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Connected!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Successfully joined <span className="font-medium text-slate-700 dark:text-slate-300">"{ssid}"</span>
                  </p>
                  {wifiIP && (
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg inline-block mt-3">
                      {wifiIP}
                    </p>
                  )}
                </div>
              )}

              {/* Form (idle or error) */}
              {(wifiState === 'idle' || wifiState === 'error') && (
                <>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Connect to home WiFi</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Select your network so any device on the same WiFi can reach CardBridge.
                  </p>

                  {/* Error banner */}
                  {wifiState === 'error' && (
                    <div className="flex items-start gap-3 p-3.5 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <WifiOff size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">Connection failed</p>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{wifiError}</p>
                      </div>
                    </div>
                  )}

                  {/* Network list */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <Wifi size={11} className="text-slate-400" /> Available networks
                      </label>
                      <button type="button" onClick={scanNetworks} disabled={scanning}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-40">
                        <RefreshCw size={11} className={scanning ? 'animate-spin' : ''} />
                        {scanning ? 'Scanning…' : 'Refresh'}
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                      {scanning && !networks ? (
                        <div className="flex items-center justify-center gap-2.5 py-8 text-slate-400 text-sm">
                          <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                          Scanning for networks…
                        </div>
                      ) : networks?.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-slate-400 text-sm">
                          <WifiOff size={18} />
                          No networks found
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                          {(networks ?? []).map(net => {
                            const bars = net.signal >= 70 ? 3 : net.signal >= 40 ? 2 : 1
                            const selected = ssid === net.ssid
                            return (
                              <button key={net.ssid} type="button" onClick={() => { setSsid(net.ssid); setWifiState('idle') }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                                  selected ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}>
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex items-end gap-[2px] shrink-0">
                                    {[{ h: 'h-1.5', b: 1 }, { h: 'h-2.5', b: 2 }, { h: 'h-4', b: 3 }].map(({ h, b }) => (
                                      <span key={b} className={`block w-[3px] rounded-sm ${h} transition-colors ${
                                        b <= bars
                                          ? selected ? 'bg-slate-900 dark:bg-white' : 'bg-slate-500 dark:bg-slate-400'
                                          : 'bg-slate-200 dark:bg-slate-700'
                                      }`} />
                                    ))}
                                  </div>
                                  <span className={`text-sm truncate ${selected ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {net.ssid}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  {net.security !== 'open' && <Lock size={10} className="text-slate-300 dark:text-slate-600" />}
                                  {selected && <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center"><Check size={11} className="text-white dark:text-slate-900" /></div>}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                      Don't see your network?{' '}
                      <button type="button" className="underline hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                        onClick={() => { const n = prompt('Network name (SSID):'); if (n) { setSsid(n); setWifiState('idle') } }}>
                        Enter manually
                      </button>
                    </p>
                  </div>

                  {/* Password */}
                  {ssid && (
                    <div className="mb-5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        Password for <span className="font-semibold text-slate-800 dark:text-slate-200">"{ssid}"</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleWifiSave()}
                          placeholder="WiFi password"
                          autoFocus
                          className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
                        />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                    <Button onClick={handleWifiSave} disabled={!ssid.trim()} className="flex-1">
                      <Wifi size={15} /> Connect
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mx-auto mb-5 shadow-lg">
                <Check size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">CardBridge is ready!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 max-w-xs mx-auto">
                Your unit is joining your home WiFi. Access the app at{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300">cardbridge.local:8080</span> once connected.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">This may take up to 30 seconds.</p>
              <Button onClick={() => navigate('/devices/add')}>
                Add a recording device <ChevronRight size={16} />
              </Button>
              <div className="mt-4">
                <Link
                  to="/quick-start"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <BookOpen size={14} />
                  View Quick Start Guide
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function SetupPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const pin = searchParams.get('pin') ?? ''

  if (!user) return <SetupGate pin={pin} />
  return <SetupWizard pin={pin} />
}
