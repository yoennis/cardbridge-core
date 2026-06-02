import { WifiOff } from 'lucide-react'
import { useServerHealth } from '../hooks/useServerHealth'

export default function OfflineBanner() {
  const { offline } = useServerHealth()

  if (!offline) return null

  return (
    <div className="flex items-center gap-2.5 px-4 sm:px-6 py-2.5
      bg-amber-500 dark:bg-amber-600 text-white text-sm font-medium">
      <WifiOff size={14} className="shrink-0" />
      <span>Cannot reach CardBridge — make sure the firmware is running</span>
      <span className="ml-auto flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
      </span>
    </div>
  )
}
