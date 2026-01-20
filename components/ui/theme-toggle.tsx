'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  /** Modo compacto: apenas ícone, sem label */
  compact?: boolean
  /** Classe CSS adicional */
  className?: string
}

/**
 * Componente de toggle de tema Light/Dark
 * Usa next-themes para persistir preferência
 */
export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evita hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // Retorna placeholder durante SSR para evitar flash
  if (!mounted) {
    if (compact) {
      return (
        <button
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--ds-text-secondary)] transition-colors ${className}`}
          disabled
          aria-label="Carregando tema"
        >
          <div className="h-4 w-4" />
        </button>
      )
    }
    return (
      <button
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors border border-transparent ${className}`}
        disabled
        aria-label="Carregando tema"
      >
        <div className="w-9 h-9 rounded-full bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] flex items-center justify-center">
          <div className="h-4 w-4" />
        </div>
        <span className="text-[var(--ds-text-secondary)]">Tema</span>
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Escuro' : 'Claro'

  // Modo compacto: apenas ícone (para sidebar collapsed)
  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-transparent
          text-[var(--ds-text-secondary)] transition-colors
          hover:border-[var(--ds-border-default)] hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text-primary)]
          ${className}`}
        aria-label={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
        title={`Tema: ${label}`}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>
    )
  }

  // Modo expandido: ícone + label (para sidebar expanded)
  return (
    <button
      onClick={toggleTheme}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors border border-transparent
        hover:bg-[var(--ds-bg-hover)] hover:border-[var(--ds-border-subtle)]
        ${className}`}
      aria-label={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
    >
      <div className="w-9 h-9 rounded-full bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] flex items-center justify-center relative">
        <Sun className="h-4 w-4 text-[var(--ds-text-secondary)] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 text-[var(--ds-text-secondary)] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
      <span className="text-[var(--ds-text-secondary)]">Tema: {label}</span>
    </button>
  )
}
