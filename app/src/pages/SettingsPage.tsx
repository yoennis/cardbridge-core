import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications, type NotifPrefs } from '../hooks/useNotifications'
import { toast } from '../utils/toast'
import Toggle from '../components/Toggle'
import { api } from '../api/client'
import PageHeader from '../components/PageHeader'
import { Card, Button } from '../components/ui'
import {
  Sun, Moon, User, Mail, Palette, Bell, BellOff, Film, HardDrive, Wifi, AlertTriangle, Eye, EyeOff, Settings, Save, Zap, Shield, Fingerprint, Trash2, BookOpen, ChevronRight, MessageSquare, Plug, Unplug, CircleDot,
} from 'lucide-react'

// ── Home Assistant / MQTT integration card ───────────────────────────────────

interface MQTTStatus {
  configured: boolean
  connected: boolean
  broker: string
  user: string
}

function HomeAssistantCard() {
  const [status, setStatus] = useState<MQTTStatus | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [broker, setBroker] = useState('')
  const [mqttUser, setMqttUser] = useState('')
  const [mqttPass, setMqttPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<MQTTStatus>('/api/integrations/mqtt')
      .then(r => {
        setStatus(r.data)
        if (r.data.configured) {
          setBroker(r.data.broker)
          setMqttUser(r.data.user)
        }
      })
      .catch(() => {})
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await api.post<{ ok: boolean; connected: boolean }>('/api/integrations/mqtt', {
        broker, user: mqttUser, password: mqttPass,
      })
      setStatus(s => ({ ...s!, configured: true, connected: r.data.connected, broker, user: mqttUser }))
      setMqttPass('')
      setExpanded(false)
      toast.success(r.data.connected ? 'Connected to MQTT broker' : 'Config saved — broker unreachable')
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to connect')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.delete('/api/integrations/mqtt')
      setStatus({ configured: false, connected: false, broker: '', user: '' })
      setBroker('')
      setMqttUser('')
      setMqttPass('')
      setExpanded(false)
      toast.success('MQTT disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const dotColor = status?.connected
    ? 'bg-emerald-500'
    : status?.configured
      ? 'bg-amber-400'
      : 'bg-slate-300 dark:bg-slate-600'

  const statusLabel = status?.connected
    ? 'Connected'
    : status?.configured
      ? 'Not reachable'
      : 'Not configured'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
            <img src="https://brands.home-assistant.io/_/hassio/icon.png" alt="" className="w-5 h-5" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Home Assistant</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />
              <p className="text-xs text-slate-500 dark:text-slate-400">{statusLabel}</p>
            </div>
          </div>
        </div>
        <ChevronRight
          size={15}
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expandable form */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connect to an MQTT broker so CardBridge publishes events to Home Assistant automatically.
          </p>
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Broker URL
              </label>
              <input
                type="text"
                value={broker}
                onChange={e => setBroker(e.target.value)}
                placeholder="tcp://192.168.1.10:1883"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={mqttUser}
                onChange={e => setMqttUser(e.target.value)}
                placeholder="mqtt_user"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={mqttPass}
                  onChange={e => setMqttPass(e.target.value)}
                  placeholder={status?.configured ? '••••••••' : 'password'}
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-medium rounded-lg transition disabled:opacity-60"
              >
                <Plug size={13} />
                {saving ? 'Connecting…' : 'Connect'}
              </button>
              {status?.configured && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition"
                >
                  <Unplug size={13} />
                  Disconnect
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Section({
  title, icon: Icon, children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Card className="mb-6 p-6">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
          <Icon size={18} className="text-slate-600 dark:text-slate-400" />
        </div>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
      <div>{children}</div>
    </Card>
  )
}

function FieldLabel({ icon: Icon, htmlFor, children }: { icon: React.ElementType; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium mb-2">
      <Icon size={14} className="text-slate-500 dark:text-slate-500" />
      {children}
    </label>
  )
}

const NOTIF_ITEMS: { key: keyof NotifPrefs; icon: React.ElementType; label: string; description: string }[] = [
  {
    key: 'newClips',
    icon: Film,
    label: 'New clips recorded',
    description: 'Get notified when your device records new footage',
  },
  {
    key: 'storageFull',
    icon: HardDrive,
    label: 'Storage almost full',
    description: 'Alert when device storage exceeds 90%',
  },
  {
    key: 'deviceStatus',
    icon: Wifi,
    label: 'Device connectivity',
    description: 'Know when a device goes offline or comes back online',
  },
]

interface NetworkConfig {
  apSsid: string
  apPassword: string
  homeSsid: string
  homePassword: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { resolved, toggle } = useTheme()
  const [name, setName] = useState(user?.name ?? '')
  const { supported, permission, prefs, requestPermission, updatePref, sendTest } = useNotifications()

  const [netCfg, setNetCfg] = useState<NetworkConfig>({ apSsid: '', apPassword: '', homeSsid: '', homePassword: '' })
  const [netLoading, setNetLoading] = useState(false)
  const [showApPw, setShowApPw] = useState(false)
  const [showHomePw, setShowHomePw] = useState(false)

  useEffect(() => {
    api.get<NetworkConfig>('/api/network/config')
      .then(r => setNetCfg(r.data))
      .catch(() => {})
  }, [])

  const handleSaveNetwork = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setNetLoading(true)
    try {
      await api.post('/api/network/config', netCfg)
      toast.success('Network settings saved')
    } catch {
      toast.error('Failed to save network settings')
    } finally {
      setNetLoading(false)
    }
  }

  const handleSaveName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const raw = localStorage.getItem('cb-session')
    if (raw) {
      const u = JSON.parse(raw)
      u.name = name
      localStorage.setItem('cb-session', JSON.stringify(u))
    }
    toast.success('Changes saved')
  }

  const handleEnableNotifications = async () => {
    await requestPermission()
    toast.success('Notifications enabled')
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
        icon={<Settings size={24} />}
      />

      {/* ── Profile ─────────────────────────────────────────────────────── */}
      <Section title="Profile" icon={User}>
        <form onSubmit={handleSaveName} className="space-y-4 max-w-sm">
          <div>
            <FieldLabel icon={User} htmlFor="settings-name">Full name</FieldLabel>
            <input
              id="settings-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
            />
          </div>
          <div>
            <FieldLabel icon={Mail} htmlFor="settings-email">Email</FieldLabel>
            <input
              id="settings-email"
              type="email"
              placeholder="email@example.com"
              value={user?.email ?? ''}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Email cannot be changed</p>
          </div>
          <Button icon={<Save size={16} />} className="mt-6">
            Save Changes
          </Button>
        </form>
      </Section>

      {/* ── Appearance ──────────────────────────────────────────────────── */}
      <Section title="Appearance" icon={Palette}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Currently: <span className="font-medium">{resolved}</span> mode
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            Switch
          </button>
        </div>
      </Section>

      {/* ── Notifications ───────────────────────────────────────────────── */}
      <Section title="Notifications" icon={Bell}>
        {!supported ? (
          <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400">
            <BellOff size={16} className="shrink-0" />
            Your browser doesn't support notifications.
          </div>
        ) : permission === 'denied' ? (
          <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg shrink-0">
              <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Notifications blocked</p>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                Allow notifications in your browser settings to receive updates.
              </p>
            </div>
          </div>
        ) : permission === 'default' ? (
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
              <Bell size={18} className="text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enable notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Get alerts for new clips, storage warnings, and device status.
              </p>
              <Button icon={<Bell size={14} />} onClick={handleEnableNotifications}>
                Enable notifications
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {NOTIF_ITEMS.map(({ key, icon: Icon, label, description }, i) => (
              <div
                key={key}
                className={`flex items-center justify-between py-4 ${
                  i < NOTIF_ITEMS.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 mt-0.5">
                    <Icon size={14} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                  </div>
                </div>
                <Toggle
                  checked={prefs[key]}
                  onChange={v => updatePref(key, v)}
                />
              </div>
            ))}

            <div className="pt-4">
              <button
                type="button"
                onClick={() => { sendTest(); toast.success('Test notification sent') }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
              >
                <Zap size={14} />
                Send test
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* ── Network ─────────────────────────────────────────────────────── */}
      <Section title="Network" icon={Shield}>
        <form onSubmit={handleSaveNetwork} className="space-y-6 max-w-sm">
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
              CardBridge AP (hotspot)
            </p>
            <div className="space-y-4">
              <div>
                <FieldLabel icon={Wifi} htmlFor="ap-ssid">Access point name</FieldLabel>
                <input
                  id="ap-ssid"
                  type="text"
                  value={netCfg.apSsid}
                  onChange={e => setNetCfg(c => ({ ...c, apSsid: e.target.value }))}
                  placeholder="CardBridge"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
                />
              </div>
              <div>
                <FieldLabel icon={showApPw ? EyeOff : Eye} htmlFor="ap-pw">AP password</FieldLabel>
                <div className="relative">
                  <input
                    id="ap-pw"
                    type={showApPw ? 'text' : 'password'}
                    value={netCfg.apPassword}
                    onChange={e => setNetCfg(c => ({ ...c, apPassword: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApPw(v => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  >
                    {showApPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="my-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
              Home WiFi (optional)
            </p>
            <div className="space-y-4">
              <div>
                <FieldLabel icon={Wifi} htmlFor="home-ssid">Network name (SSID)</FieldLabel>
                <input
                  id="home-ssid"
                  type="text"
                  value={netCfg.homeSsid}
                  onChange={e => setNetCfg(c => ({ ...c, homeSsid: e.target.value }))}
                  placeholder="Your home WiFi"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
                />
              </div>
              <div>
                <FieldLabel icon={showHomePw ? EyeOff : Eye} htmlFor="home-pw">Password</FieldLabel>
                <div className="relative">
                  <input
                    id="home-pw"
                    type={showHomePw ? 'text' : 'password'}
                    value={netCfg.homePassword}
                    onChange={e => setNetCfg(c => ({ ...c, homePassword: e.target.value }))}
                    placeholder="WiFi password"
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHomePw(v => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  >
                    {showHomePw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={netLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-medium rounded-lg transition disabled:opacity-60"
            >
              <Save size={14} />
              {netLoading ? 'Saving…' : 'Save settings'}
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Changes take effect after a Pi reboot.
          </p>
        </form>
      </Section>

      {/* ── Integrations ────────────────────────────────────────────────── */}
      <Section title="Integrations" icon={CircleDot}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Connect CardBridge to external services. These are optional device-level settings.
        </p>
        <HomeAssistantCard />
      </Section>

      {/* ── Account ─────────────────────────────────────────────────────── */}
      <Section title="Help & Resources" icon={BookOpen}>
        <div className="space-y-1">
          <Link
            to="/quick-start"
            className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Quick Start Guide</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Setup steps, tips & common issues</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </Link>
          <a
            href="mailto:support@cardbridge.io"
            className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Contact Support</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">support@cardbridge.io</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </a>
        </div>
      </Section>

      <Section title="Account" icon={Shield}>
        <div className="space-y-4">
          <div className="py-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1.5">
              <Fingerprint size={14} />
              Account ID
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">{user?.id}</p>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Permanently delete your account and all data.
            </p>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium"
            >
              <Trash2 size={14} />
              Delete account
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}
