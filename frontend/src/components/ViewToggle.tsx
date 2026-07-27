import { List, LayoutGrid } from 'lucide-react'
import { useViewMode } from './ViewModeContext'

export function ViewToggle() {
  const { viewMode, setViewMode } = useViewMode()

  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
      <button
        onClick={() => setViewMode('list')}
        title="Vista de lista"
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'list' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => setViewMode('grid')}
        title="Vista de cuadrícula"
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'grid' ? 'bg-white text-lilac-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <LayoutGrid size={18} />
      </button>
    </div>
  )
}
