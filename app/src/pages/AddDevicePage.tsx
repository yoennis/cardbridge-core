import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Plane, Clapperboard, ChevronRight, Check, Usb, HardDrive, Wifi, Globe, Copy, MemoryStick, Plus, Monitor, Zap, Shield, HelpCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui'

const deviceTypes = [
  { id: 'dashcam',  label: 'Dash Cam',        icon: Camera,      description: 'Vehicle front/rear camera' },
  { id: 'drone',    label: 'Drone',            icon: Plane,       description: 'Aerial camera' },
  { id: 'action',   label: 'Action Camera',    icon: Clapperboard, description: 'GoPro, Insta360, DJI Osmo' },
  { id: 'security', label: 'Security Camera',  icon: Monitor,     description: 'Home security, IP camera' },
  { id: 'other',    label: 'Other',            icon: HelpCircle,  description: 'Body cam, trail cam, medical…' },
]

export default function AddDevicePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState('')
  const [name, setName] = useState('')

  const handleFinish = () => {
    // Phase 0: just navigate back — real registration requires hardware
    navigate('/dashboard')
  }

  return (
    <div>
      <PageHeader
        title="Add a Device"
        subtitle="Connect any SD-based recording device to CardBridge. Dashcams, drones, action cameras, and more."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Devices', href: '/devices' },
          { label: 'Add Device' }
        ]}
        icon={<Plus size={24} />}
      />

      <div className="max-w-2xl">

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                step > s ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' :
                step === s ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' :
                'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className={`text-xs hidden sm:inline ${step === s ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                {['Device type', 'Name', 'Setup'][s - 1]}
              </span>
              {s < 3 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 ml-1" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Device type */}
        {step === 1 && (
          <div>
            <p className="text-sm font-medium mb-1 text-slate-900 dark:text-white">What device are you connecting?</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">CardBridge works with any SD-based recording device.</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {deviceTypes.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    selected === id
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-white/[0.06]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg mb-3
                    bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon size={20} />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
                  {selected === id && (
                    <div className="absolute top-2.5 right-2.5">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-white">
                        <Check size={11} className="text-white dark:text-slate-900" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button 
              onClick={() => setStep(2)} 
              disabled={!selected}
              className="w-full"
            >
              Continue <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* Step 2 — Name */}
        {step === 2 && (
          <div>
            <p className="text-sm font-semibold mb-2 text-slate-900 dark:text-white">Give your device a name</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">This helps you identify it in the dashboard</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`e.g. "Front Cam" or "Mavic 3"`}
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition mb-6"
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!name.trim()}
                className="flex-1"
              >
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Hardware setup instructions */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Hardware requirement banner */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                <HardDrive size={17} className="text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Hardware unit required</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <strong className="text-slate-700 dark:text-slate-300">{name}</strong> needs a CardBridge unit (Raspberry Pi Zero 2W + USB hub) to sync wirelessly to your app.
                </p>
              </div>
            </div>

            {/* One-time setup */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={14} />
                One-time setup
              </p>
              <ol className="space-y-3">
                {[
                  { icon: Usb, text: 'Power the CardBridge unit via USB-C' },
                  { icon: Wifi, text: 'Connect to WiFi: ssh pi@raspberrypi.local → raspi-config → Network → WiFi' },
                  { icon: Globe, text: 'Run: ./scripts/install.sh from your dev machine' },
                ].map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      <Icon size={16} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300 pt-0.5">{text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Per-sync methods */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield size={14} />
                To sync clips — choose one method
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Usb, title: 'USB cable', desc: `Plug ${name} directly into CardBridge USB hub. Files appear instantly.`, badge: 'Recommended' },
                  { icon: MemoryStick, title: 'SD card reader', desc: `Remove SD card and insert into USB reader connected to CardBridge.`, badge: null },
                ].map(({ icon: Icon, title, desc, badge }, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Icon size={16} className="text-slate-600 dark:text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
                    {badge && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-3">{badge}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Access URLs */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Globe size={14} />
                Access the app
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Home network', url: 'http://cardbridge.local:8080', sub: 'When Pi and phone are on the same WiFi' },
                  { label: 'CardBridge AP', url: 'http://192.168.4.1:8080', sub: 'Connect phone to "CardBridge" WiFi (pass: cardbridge)' },
                ].map(({ label, url, sub }) => (
                  <div key={url} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                      <p className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 truncate">{url}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{sub}</p>
                    </div>
                    <button
                      type="button"
                      title={`Copy ${label} URL`}
                      onClick={() => navigator.clipboard.writeText(url)}
                      className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleFinish} className="flex-1">
                Finish <Check size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
