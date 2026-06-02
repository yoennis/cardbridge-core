interface MarkProps {
  width?: number
  className?: string
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
  className?: string
}

const sizes = {
  sm: { mark: 56, text: 'text-base' },
  md: { mark: 72, text: 'text-xl' },
  lg: { mark: 108, text: 'text-3xl' },
}

export function LogoMark({ width = 72, className }: MarkProps) {
  const height = Math.round((width * 378) / 908)

  return (
    <svg
      viewBox="95 243 908 378"
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M220 540 H322 C368 540 375 507 401 472 L455 400
           C474 375 493 365 526 365 H590
           C623 365 642 375 661 400 L715 472
           C741 507 748 540 794 540 H852"
        stroke="currentColor"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M360 430 L456 316 C477 292 498 282 532 282 H584
           C618 282 639 292 660 316 L756 430"
        stroke="currentColor"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="134" y="484" width="86" height="86" rx="11"
        stroke="currentColor" strokeWidth="38" strokeLinejoin="round" />
      <rect x="852" y="470" width="112" height="112" rx="13"
        stroke="currentColor" strokeWidth="38" strokeLinejoin="round" />
      <circle cx="360" cy="430" r="28" fill="currentColor" />
      <circle cx="756" cy="430" r="28" fill="currentColor" />
    </svg>
  )
}

export default function Logo({ size = 'md', variant = 'dark', className }: LogoProps) {
  const { mark, text } = sizes[size]
  const color = variant === 'dark'
    ? 'text-slate-900 dark:text-white'
    : 'text-white'

  return (
    <span className={`inline-flex items-center gap-3 ${color} ${className ?? ''}`}>
      <LogoMark width={mark} />
      <span className={`font-bold tracking-tight leading-none ${text}`}>CardBridge</span>
    </span>
  )
}
