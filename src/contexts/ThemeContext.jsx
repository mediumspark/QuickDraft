import * as React from 'react'

const ThemeContext = React.createContext(null)
const STORAGE_KEY = 'aqd-theme'

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme) {
  const root = document.documentElement
  const dark = theme === 'dark' || (theme === 'system' && getSystemDark())
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system'
    } catch {
      return 'system'
    }
  })

  React.useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  React.useEffect(() => {
    if (theme !== 'system') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = React.useCallback((next) => {
    setThemeState(next)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      const resolved = current === 'system'
        ? (getSystemDark() ? 'dark' : 'light')
        : current
      return resolved === 'dark' ? 'light' : 'dark'
    })
  }, [])

  const resolved = theme === 'system'
    ? (typeof window !== 'undefined' && getSystemDark() ? 'dark' : 'light')
    : theme

  const value = { theme, resolved, setTheme, toggleTheme }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
