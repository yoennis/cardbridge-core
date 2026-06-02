import { useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallBanner() {
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-4 sm:w-80 z-50
      bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
      shadow-xl rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shrink-0">
        <Smartphone size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Install CardBridge</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          Add to your home screen for instant access — works offline too.
        </p>
        <button
          type="button"
          onClick={install}
          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-medium rounded-lg transition"
        >
          <Download size={12} />
          Install app
        </button>
      </div>
      <button
        type="button"
        title="Dismiss"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
      >
        <X size={15} />
      </button>
    </div>
  )
}
