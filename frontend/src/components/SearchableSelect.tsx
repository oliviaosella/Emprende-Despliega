import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SearchableSelectOption {
  value: string
  label: string
  searchText?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyMessage = 'Sin resultados.',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter((o) =>
    (o.searchText ?? o.label).toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setOpen(true)}
        className="w-full flex items-center bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus-within:ring-2 focus-within:ring-lilac-300 cursor-text"
      >
        <input
          type="text"
          value={open ? query : (selected?.label ?? '')}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
        />
        <ChevronDown size={15} className="text-slate-400 shrink-0" />
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-30">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 px-3 py-2.5">{emptyMessage}</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setQuery('')
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  o.value === value ? 'bg-lilac-50 text-lilac-600 font-medium' : 'text-slate-700'
                }`}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
