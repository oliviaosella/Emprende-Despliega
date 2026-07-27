import { useState } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-slate-400 hover:text-slate-600"
      >
        <Info size={13} />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[200px] bg-slate-800 text-white text-[11px] leading-snug px-2.5 py-1.5 rounded-lg shadow-lg z-50 pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}
