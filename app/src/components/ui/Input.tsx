import { type InputHTMLAttributes, type ReactNode, useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  clearable?: boolean
}

export default function Input({
  label, error, helperText, icon, clearable = false,
  className = '', type, onChange, value, ...props
}: InputProps) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword && showPwd ? 'text' : type
  const hasValue = typeof value === 'string' && value.length > 0

  const handleClear = () => {
    onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
  }

  const showClear = clearable && hasValue && !isPassword
  const hasRightSlot = showClear || isPassword

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-white">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={effectiveType}
          value={value}
          onChange={onChange}
          className={`w-full ${icon ? 'pl-9' : 'pl-3.5'} ${hasRightSlot ? 'pr-9' : 'pr-3.5'} py-2.5 rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition ${
            error
              ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
              : 'border-slate-200 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500'
          } ${className}`}
          {...props}
        />

        {/* Right actions */}
        {hasRightSlot && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {showClear && (
              <button
                type="button"
                tabIndex={-1}
                title="Clear"
                onClick={handleClear}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={12} />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                tabIndex={-1}
                title={showPwd ? 'Hide password' : 'Show password'}
                onClick={() => setShowPwd(p => !p)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {helperText && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  )
}
