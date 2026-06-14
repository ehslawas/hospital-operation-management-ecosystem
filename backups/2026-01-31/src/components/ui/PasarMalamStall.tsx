import React from 'react';

interface PasarMalamStallProps {
  size?: number;
  className?: string;
}

export function PasarMalamStall({ size = 200, className = "" }: PasarMalamStallProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
      
      {/* Stall structure */}
      <g transform="translate(100, 100)">
        {/* Red roof with yellow decoration */}
        <rect x="-40" y="-50" width="80" height="25" rx="3" fill="#dc2626"/>
        <ellipse cx="0" cy="-45" rx="12" ry="6" fill="#fbbf24"/>
        
        {/* White panel with black and white stripes */}
        <rect x="-40" y="-25" width="80" height="20" fill="white" stroke="#d1d5db" strokeWidth="0.5"/>
        
        {/* Piano key stripes */}
        {[...Array(8)].map((_, i) => (
          <rect 
            key={i} 
            x={-40 + i * 10} 
            y={-25} 
            width="10" 
            height="20" 
            fill={i % 2 === 0 ? "white" : "#000000"}
          />
        ))}
        
        {/* Decorative items on the panel */}
        {/* Blue rectangle (top left) */}
        <rect x="-30" y="-20" width="8" height="6" fill="#3b82f6"/>
        
        {/* Green leaf shape (top right) */}
        <ellipse cx="25" cy="-17" rx="6" ry="3" fill="#22c55e" transform="rotate(15)"/>
        
        {/* Red fruit (bottom left) */}
        <circle cx="-25" cy="-10" r="4" fill="#dc2626"/>
        
        {/* Yellow banana/skewer (bottom right) */}
        <ellipse cx="30" cy="-8" rx="8" ry="2" fill="#fbbf24" transform="rotate(-15)"/>
        
        {/* Grey counter */}
        <rect x="-40" y="-5" width="80" height="3" fill="#9ca3af"/>
        
        {/* Supporting poles */}
        <line x1="-35" y1="-2" x2="-35" y2="20" stroke="#9ca3af" strokeWidth="3"/>
        <line x1="35" y1="-2" x2="35" y2="20" stroke="#9ca3af" strokeWidth="3"/>
        
        {/* Yellow pot bases */}
        <ellipse cx="-35" cy="25" rx="8" ry="6" fill="#fbbf24"/>
        <ellipse cx="35" cy="25" rx="8" ry="6" fill="#fbbf24"/>
        <ellipse cx="-35" cy="22" rx="6" ry="4" fill="#fbbf24"/>
        <ellipse cx="35" cy="22" rx="6" ry="4" fill="#fbbf24"/>
      </g>
      
      {/* Text box */}
      <g transform="translate(100, 160)">
        <rect x="-50" y="-15" width="100" height="30" rx="5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
        
        {/* Text */}
        <text x="0" y="-5" textAnchor="middle" fontSize="8" fill="#000000" fontFamily="Arial, sans-serif" fontWeight="bold">
          PASAR MALAM
        </text>
        <text x="0" y="3" textAnchor="middle" fontSize="8" fill="#000000" fontFamily="Arial, sans-serif" fontWeight="bold">
          DE KAMPUNG KAMPUNG
        </text>
        <text x="0" y="10" textAnchor="middle" fontSize="6" fill="#000000" fontFamily="Arial, sans-serif">
          KUALA LUMPUR
        </text>
      </g>
    </svg>
  );
}
