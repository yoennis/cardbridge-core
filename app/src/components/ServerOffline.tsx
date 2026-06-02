import { WifiOff, RefreshCw } from 'lucide-react'

const steps = [
  'Make sure the Pi is powered on (solid green LED)',
  'Connect your phone to the CardBridge WiFi network',
  'If the network doesn\'t appear, wait 30 s after powering on',
]

interface Props {
  onRetry: () => void
  retrying?: boolean
}

export default function ServerOffline({ onRetry, retrying = false }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 max-w-sm mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
        <WifiOff size={24} className="text-slate-400 dark:text-slate-500" />
      </div>

      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Can't reach the Pi
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        CardBridge runs locally on your network — no internet required,
        but your phone needs to be on the same WiFi as the Pi.
      </p>

      <ol className="w-full text-left space-y-3 mb-8">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-100 transition disabled:opacity-60"
      >
        <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  )
}
