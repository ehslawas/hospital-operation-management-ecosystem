import React from 'react'
import { Globe, Check } from 'lucide-react'
import { useLanguage, Language } from '@/shared/contexts/LanguageContext'

interface LanguageSelectorProps {
  variant?: 'header' | 'dropdown' | 'minimal'
  className?: string
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'header', className = '' }) => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  ]

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-white/10 ${className}`}>
        {options.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              language === opt.code
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{opt.flag}</span>
            <span>{opt.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/15 transition-colors border border-white/10"
        title="Change language / Tukar Bahasa"
      >
        <Globe className="w-3.5 h-3.5 text-teal-400" />
        <span className="uppercase font-bold tracking-wider">{language}</span>
        <span className="text-white/40 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-1 overflow-hidden backdrop-blur-xl">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-teal-400" />
            <span>Select Language</span>
          </div>
          {options.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                setLanguage(opt.code)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                language === opt.code
                  ? 'bg-teal-600/20 text-teal-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{opt.flag}</span>
                <span>{opt.label}</span>
              </div>
              {language === opt.code && <Check className="w-3.5 h-3.5 text-teal-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
