import { createContext, useContext, useState, type ReactNode } from 'react'

export type ViewMode = 'list' | 'grid'

const STORAGE_KEY = 'miniEmprende.viewMode'

interface ViewModeContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'list'
    return window.localStorage.getItem(STORAGE_KEY) === 'grid' ? 'grid' : 'list'
  })

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    window.localStorage.setItem(STORAGE_KEY, mode)
  }

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider')
  return ctx
}
