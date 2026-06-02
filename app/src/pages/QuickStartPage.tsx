import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft, Box, Wifi, Smartphone, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import Logo from '../components/Logo'

export default function QuickStartPage() {
  const navigate = useNavigate()
  const [expandedStep, setExpandedStep] = useState<number | null>(1)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const steps = [
    {
      num: 1,
      title: 'Physical Setup',
      time: '2 min',
      icon: Box,
      details: [
        {
          type: 'dashcam',
          label: 'For dashcam (in-car)',
          items: [
            'Mount the Pi + hub behind dashboard',
            'Connect dashcam to USB hub',
            'Connect power supply to hub',
            'Power on — wait 30 seconds'
          ]
        },
        {
          type: 'home',
          label: 'For home/stationary',
          items: [
            'Place Pi + hub near router',
            'Connect your device to USB hub',
            'Plug in power supply',
            'Power on'
          ]
        }
      ]
    },
    {
      num: 2,
      title: 'Connect via Phone',
      time: '2–3 min',
      icon: Wifi,
      details: [
        {
          type: 'phone',
          label: 'On your phone',
          items: [
            'Open Settings → WiFi',
            'Connect to "CardBridge" (pass: cardbridge)',
            'Open browser: http://192.168.4.1:8080',
            'Create account in Setup Wizard',
            'Enter home WiFi name & password',
            'Confirm'
          ]
        }
      ]
    },
    {
      num: 3,
      title: 'Verify & Sync',
      time: '1–2 min',
      icon: Smartphone,
      details: [
        {
          type: 'verify',
          label: 'Check the app',
          items: [
            'Disconnect from CardBridge WiFi',
            'Connect to your home WiFi',
            'Visit: http://cardbridge.local:8080',
            'Log in with your account',
            'You should see your device listed',
            'Plug in camera — clips appear in 10–30 sec'
          ]
        }
      ]
    },
  ]

  const faqs = [
    {
      q: "I can't see CardBridge WiFi",
      a: 'Make sure the Pi is powered on (green light blinking). Wait 30 seconds after power-on. If still stuck, try forgetting and re-joining the network.',
    },
    {
      q: 'Clips are not showing up',
      a: 'Check that your device is plugged into the USB hub (not directly to Pi). Wait 10–30 seconds for the first scan. Go to Settings → Storage → Scan now for a manual scan.',
    },
    {
      q: 'I forgot my password',
      a: 'Connect to CardBridge WiFi, visit http://192.168.4.1:8080, and click "Forgot password?"',
    },
    {
      q: 'Can I use this away from home?',
      a: "Yes! Your phone can connect to the CardBridge WiFi hotspot anywhere (SSID: 'CardBridge', password: 'cardbridge'). You'll have full access.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={15} />
              Back
            </button>
            <div className="w-px h-4 bg-white/10" />
            <Logo variant="light" size="sm" />
          </div>
          <span className="text-xs text-slate-500">Quick Start Guide</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Get Started in 5–10 Minutes</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Follow these 3 simple steps to get your CardBridge unit running and syncing clips.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {steps.map((step) => {
            const Icon = step.icon
            const isExpanded = expandedStep === step.num
            return (
              <div
                key={step.num}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden hover:border-white/20 transition-colors"
              >
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.num)}
                  className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 shrink-0">
                    <Icon size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step {step.num}</span>
                      <span className="text-xs text-slate-500">{step.time}</span>
                    </div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-slate-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-white/5 space-y-4">
                    {step.details.map((detail, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-slate-300 mb-3">{detail.label}</p>
                        <ol className="space-y-2">
                          {detail.items.map((item, j) => (
                            <li key={j} className="flex gap-3 text-sm text-slate-400">
                              <span className="font-mono text-xs text-slate-600 shrink-0 w-5 text-right">{j + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Access info */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 mb-12">
          <div className="flex gap-3 mb-4">
            <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-50 mb-2">All Set! Access CardBridge</h3>
              <div className="space-y-2 text-sm text-emerald-100/80">
                <p>
                  <strong>On home WiFi:</strong> http://cardbridge.local:8080
                </p>
                <p>
                  <strong>Or by IP:</strong> http://192.168.x.x:8080 (shown on your unit)
                </p>
                <p>
                  <strong>Away from home:</strong> Use CardBridge WiFi hotspot (CardBridge / cardbridge)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Common Issues</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-white/5 transition-colors"
                >
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{faq.q}</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform shrink-0 ${expandedFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-4 border-t border-white/5 text-sm text-slate-400">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-slate-400 mb-4">Still need help?</p>
          <a
            href="mailto:support@cardbridge.io"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-medium text-sm hover:bg-slate-100 transition-colors"
          >
            Contact Support
            <ExternalLink size={14} />
          </a>
          <p className="text-xs text-slate-600 mt-3">
            📧 support@cardbridge.io | 🐙{' '}
            <a href="https://github.com/yoennis/cardbridge" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400">
              GitHub
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-xs text-slate-600">
            Full setup guide available at{' '}
            <a href="#" className="text-slate-400 hover:text-slate-300 underline">
              docs/SETUP_GUIDE.md
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
