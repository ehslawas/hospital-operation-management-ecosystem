import React from 'react'
import { cn } from '@/lib/utils'

interface JataNegaraProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

/**
 * Jata Negara (Malaysian Coat of Arms) SVG Component
 * Official representation for government systems
 */
export const JataNegara: React.FC<JataNegaraProps> = ({ className, size = 'md' }) => {
  return (
    <div className={cn('flex items-center justify-center', sizes[size], className)}>
      <svg
        viewBox="0 0 300 360"
        className="w-full h-full drop-shadow-lg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle cx="150" cy="180" r="140" fill="#1a1a1a" />
        
        {/* Shield */}
        <path
          d="M150 60 L220 85 L220 180 L150 260 L80 180 L80 85 Z"
          fill="#FFD700"
          stroke="#000"
          strokeWidth="3"
        />
        
        {/* Star and Crescent (Crest) */}
        <g transform="translate(150, 40)">
          {/* 14-pointed Star */}
          <path
            d="M0 -20 L3 -6 L17 -6 L5 2 L8 16 L0 8 L-8 16 L-5 2 L-17 -6 L-3 -6 Z"
            fill="#FFD700"
            stroke="#000"
            strokeWidth="1"
          />
          {/* Crescent */}
          <path
            d="M-8 25 A8 8 0 0 1 8 25 A6 6 0 0 0 -8 25"
            fill="#000"
          />
        </g>
        
        {/* Shield Sections - Simplified */}
        <rect x="90" y="90" width="120" height="100" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
        
        {/* Horizontal Stripes (Federated States) */}
        <line x1="90" y1="105" x2="210" y2="105" stroke="#DC143C" strokeWidth="4" />
        <line x1="90" y1="120" x2="210" y2="120" stroke="#000000" strokeWidth="3" />
        <line x1="90" y1="135" x2="210" y2="135" stroke="#FFFFFF" strokeWidth="3" />
        <line x1="90" y1="150" x2="210" y2="150" stroke="#FFD700" strokeWidth="3" />
        
        {/* Tigers (Simplified - Supporters) */}
        <g transform="translate(50, 180)">
          <ellipse cx="0" cy="0" rx="25" ry="40" fill="#FF8C00" stroke="#000" strokeWidth="2" />
          <circle cx="-8" cy="-10" r="4" fill="#000" />
          <circle cx="8" cy="-10" r="4" fill="#000" />
        </g>
        <g transform="translate(250, 180)">
          <ellipse cx="0" cy="0" rx="25" ry="40" fill="#FF8C00" stroke="#000" strokeWidth="2" />
          <circle cx="-8" cy="-10" r="4" fill="#000" />
          <circle cx="8" cy="-10" r="4" fill="#000" />
        </g>
        
        {/* Motto Scroll */}
        <rect x="60" y="280" width="180" height="50" rx="8" fill="#FFD700" stroke="#000" strokeWidth="2" />
        <text
          x="150"
          y="305"
          textAnchor="middle"
          fontSize="14"
          fill="#000"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          BERSEKUTU
        </text>
        <text
          x="150"
          y="325"
          textAnchor="middle"
          fontSize="14"
          fill="#000"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          BERTAMBAH MUTU
        </text>
      </svg>
    </div>
  )
}

export default JataNegara

