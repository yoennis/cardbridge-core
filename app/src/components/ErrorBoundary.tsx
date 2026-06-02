import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  errorInfo: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: '' }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info.componentStack ?? '' })
    console.error('[CardBridge] Unhandled render error:', error, info)
  }

  private openReport() {
    const { error, errorInfo } = this.state
    const subject = encodeURIComponent('[UI Error] ' + (error?.message ?? 'Unknown error'))
    const body = encodeURIComponent(
      [
        'Error: ' + (error?.message ?? '—'),
        '',
        'Stack:',
        error?.stack ?? '—',
        '',
        'Component trace:',
        errorInfo || '—',
        '',
        'URL: ' + window.location.href,
        'UA: ' + navigator.userAgent,
      ].join('\n')
    )
    window.location.href = `mailto:support@cardbridge.io?subject=${subject}&body=${body}`
  }

  render() {
    if (!this.state.error) return this.props.children

    const msg = this.state.error.message

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
          <AlertTriangle size={24} className="text-red-400" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-400 max-w-xs mb-6">
          The app encountered an unexpected error. You can try reloading or send us the details.
        </p>

        {msg && (
          <div className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl mb-6 max-w-sm w-full text-left">
            <p className="text-[11px] text-slate-500 font-mono break-all">{msg}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={14} />
            Reload app
          </button>
          <button
            type="button"
            onClick={() => this.openReport()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-medium hover:bg-white/12 transition-colors"
          >
            <Bug size={14} />
            Report issue
          </button>
        </div>
      </div>
    )
  }
}
