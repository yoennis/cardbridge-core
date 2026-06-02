import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  resolved: 'light' | 'dark'
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue)

function systemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? systemPreference() : theme
}

function applyClass(r: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', r === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('cb-theme') as Theme) ?? 'system'
  )
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(theme))

  useEffect(() => {
    const r = resolve(theme)
    setResolved(r)
    applyClass(r)
  }, [theme])

  // Keep in sync if user changes OS preference while theme is 'system'
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        const r = systemPreference()
        setResolved(r)
        applyClass(r)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const toggle = () => {
    // Always resolves to explicit light/dark — never back to system via toggle
    const next: Theme = resolved === 'dark' ? 'light' : 'dark'
    localStorage.setItem('cb-theme', next)
    setThemeState(next)
  }

  return (
    <ThemeContext.Provider value={{ resolved, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
