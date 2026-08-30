import React from 'react'

interface TallManLetteringProps {
  name: string
  className?: string
  highlightClassName?: string
}

/**
 * Renders Tall Man lettering by detecting uppercase letter sequences
 * Example: "DOBUTamine" -> renders "DOBUT" highlighted & "amine" standard
 */
export const TallManLettering: React.FC<TallManLetteringProps> = ({
  name,
  className = 'font-bold text-slate-900',
  highlightClassName = 'font-black tracking-wider text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200'
}) => {
  if (!name) return null

  // Regex to split into uppercase sequences vs lowercase/mixed
  // We match uppercase chunks of length >= 2 or capital letters surrounded by lowercase
  const parts: { text: string; isTallMan: boolean }[] = []
  let currentChunk = ''
  let isCurrentUpper = false

  for (let i = 0; i < name.length; i++) {
    const char = name[i]
    const isLetter = /[a-zA-Z]/.test(char)
    const isUpper = isLetter && char === char.toUpperCase()

    if (i === 0) {
      currentChunk = char
      isCurrentUpper = isUpper
    } else {
      if (isUpper === isCurrentUpper) {
        currentChunk += char
      } else {
        parts.push({ text: currentChunk, isTallMan: isCurrentUpper })
        currentChunk = char
        isCurrentUpper = isUpper
      }
    }
  }
  if (currentChunk) {
    parts.push({ text: currentChunk, isTallMan: isCurrentUpper })
  }

  // If the whole word is uppercase or normal capitalized, just render normally unless there is a distinct tall-man mix
  const hasDistinctUpperLowerMix = parts.some(p => p.isTallMan) && parts.some(p => !p.isTallMan)

  if (!hasDistinctUpperLowerMix) {
    return <span className={className}>{name}</span>
  }

  return (
    <span className={`inline-flex items-baseline flex-wrap gap-0.5 ${className}`}>
      {parts.map((p, idx) => (
        <span
          key={idx}
          className={p.isTallMan ? highlightClassName : 'text-slate-800 font-semibold'}
        >
          {p.text}
        </span>
      ))}
    </span>
  )
}
