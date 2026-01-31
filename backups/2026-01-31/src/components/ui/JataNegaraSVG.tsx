import React from 'react';

interface JataNegaraSVGProps {
  size?: number;
  className?: string;
}

export function JataNegaraSVG({ size = 84, className = "" }: JataNegaraSVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle/oval */}
      <ellipse cx="100" cy="120" rx="90" ry="110" fill="white" stroke="#d1d5db" strokeWidth="1"/>
      
      {/* Crescent Moon */}
      <path
        d="M 100 15 A 8 12 0 0 1 100 39 A 8 12 0 0 1 100 15"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="0.5"
      />
      
      {/* 14-pointed star */}
      <g transform="translate(100, 35)">
        {[...Array(14)].map((_, i) => {
          const angle = (i * 360) / 14;
          const x1 = 0;
          const y1 = -12;
          const x2 = 0;
          const y2 = -6;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#fbbf24"
              strokeWidth="1"
              strokeLinecap="round"
              transform={`rotate(${angle})`}
            />
          );
        })}
        <circle cx="0" cy="0" r="2" fill="#fbbf24"/>
      </g>
      
      {/* Shield */}
      <g transform="translate(100, 80)">
        {/* Shield outline */}
        <path
          d="M -50 -40 L 50 -40 L 55 -20 L 55 40 L 50 50 L -50 50 L -55 40 L -55 -20 Z"
          fill="white"
          stroke="#374151"
          strokeWidth="1"
        />
        
        {/* Chief - Red band with kris */}
        <rect x="-50" y="-40" width="100" height="15" fill="#dc2626"/>
        <g fill="#fbbf24">
          {[...Array(5)].map((_, i) => (
            <path
              key={i}
              d="M -40 -32.5 L -35 -30 L -35 -25 L -40 -27.5 Z"
              transform={`translate(${i * 20}, 0)`}
            />
          ))}
        </g>
        
        {/* Upper left - Penang (palm tree) */}
        <g transform="translate(-30, -20)">
          {/* Sea */}
          <path d="M -15 0 Q -10 -5 0 0 Q 10 5 15 0" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5"/>
          {/* Island */}
          <ellipse cx="0" cy="2" rx="12" ry="3" fill="#84cc16"/>
          {/* Palm tree */}
          <line x1="0" y1="-5" x2="0" y2="8" stroke="#16a34a" strokeWidth="2"/>
          <path d="M 0 -5 Q -8 -8 -6 -12 Q -4 -10 0 -8 Q 4 -10 6 -12 Q 8 -8 0 -5" fill="#22c55e"/>
          <path d="M 0 -5 Q -5 -8 -3 -10 Q -2 -9 0 -7 Q 2 -9 3 -10 Q 5 -8 0 -5" fill="#22c55e"/>
          <path d="M 0 -5 Q 5 -8 3 -10 Q 2 -9 0 -7 Q -2 -9 -3 -10 Q -5 -8 0 -5" fill="#22c55e"/>
        </g>
        
        {/* Upper right - Malacca (Malacca tree) */}
        <g transform="translate(30, -20)">
          {/* Ground */}
          <ellipse cx="0" cy="5" rx="12" ry="4" fill="#84cc16"/>
          {/* Tree trunk */}
          <rect x="-1" y="-8" width="2" height="12" fill="#a3a3a3"/>
          {/* Tree canopy */}
          <ellipse cx="0" cy="-12" rx="8" ry="6" fill="#22c55e"/>
        </g>
        
        {/* Central vertical panels */}
        <rect x="-50" y="-25" width="12.5" height="30" fill="#000000"/>
        <rect x="-37.5" y="-25" width="12.5" height="30" fill="#ffffff" stroke="#374151" strokeWidth="0.5"/>
        <rect x="-25" y="-25" width="12.5" height="30" fill="#dc2626"/>
        <rect x="-12.5" y="-25" width="12.5" height="30" fill="#fbbf24"/>
        <rect x="0" y="-25" width="12.5" height="30" fill="#000000"/>
        <rect x="12.5" y="-25" width="12.5" height="30" fill="#ffffff" stroke="#374151" strokeWidth="0.5"/>
        <rect x="25" y="-25" width="12.5" height="30" fill="#dc2626"/>
        <rect x="37.5" y="-25" width="12.5" height="30" fill="#fbbf24"/>
        
        {/* Lower left - Sabah (flags) */}
        <g transform="translate(-30, 5)">
          {[...Array(4)].map((_, i) => (
            <g key={i} transform={`translate(${i * 6}, 0)`}>
              <line x1="0" y1="0" x2="0" y2="8" stroke="#92400e" strokeWidth="1"/>
              <rect x="-1" y="0" width="3" height="4" fill="#3b82f6"/>
              <rect x="-1" y="4" width="3" height="4" fill="#ffffff" stroke="#d1d5db" strokeWidth="0.3"/>
            </g>
          ))}
        </g>
        
        {/* Lower center - Hibiscus */}
        <g transform="translate(0, 5)">
          {/* Flower center */}
          <circle cx="0" cy="0" r="3" fill="#fbbf24"/>
          {/* Petals */}
          {[...Array(5)].map((_, i) => {
            const angle = (i * 360) / 5;
            return (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx="8"
                ry="4"
                fill="#dc2626"
                transform={`rotate(${angle})`}
              />
            );
          })}
          {/* Stem */}
          <line x1="0" y1="3" x2="0" y2="8" stroke="#16a34a" strokeWidth="1.5"/>
          {/* Leaves */}
          <ellipse cx="-3" cy="5" rx="3" ry="1.5" fill="#22c55e" transform="rotate(-30)"/>
          <ellipse cx="3" cy="6" rx="3" ry="1.5" fill="#22c55e" transform="rotate(30)"/>
        </g>
        
        {/* Lower right - Sarawak (hornbill) */}
        <g transform="translate(30, 5)">
          {/* Small shield */}
          <rect x="-3" y="-2" width="6" height="8" fill="#fbbf24" stroke="#92400e" strokeWidth="0.5"/>
          {/* Hornbill body */}
          <ellipse cx="0" cy="8" rx="6" ry="4" fill="#dc2626"/>
          {/* Hornbill head */}
          <ellipse cx="0" cy="3" rx="4" ry="3" fill="#dc2626"/>
          {/* Beak */}
          <path d="M 0 3 L 6 1 L 8 3 L 6 5 Z" fill="#fbbf24"/>
          {/* Wing */}
          <ellipse cx="-3" cy="8" rx="3" ry="2" fill="#7c2d12"/>
        </g>
      </g>
      
      {/* Tigers */}
      <g transform="translate(100, 130)">
        {/* Left Tiger */}
        <g transform="translate(-60, 0)">
          {/* Tiger body */}
          <ellipse cx="0" cy="15" rx="8" ry="12" fill="#fbbf24"/>
          {/* Tiger head */}
          <circle cx="0" cy="0" r="6" fill="#fbbf24"/>
          {/* Tiger stripes */}
          {[...Array(6)].map((_, i) => (
            <rect key={i} x="-7" y={-2 + i * 2} width="2" height="1" fill="#000000" transform={`rotate(${i * 15 - 30})`}/>
          ))}
          {[...Array(4)].map((_, i) => (
            <rect key={i} x="-6" y={5 + i * 2} width="1.5" height="0.8" fill="#000000" transform={`rotate(${i * 10 - 20})`}/>
          ))}
          {/* Tiger face */}
          <circle cx="-2" cy="-1" r="1" fill="white"/>
          <circle cx="2" cy="-1" r="1" fill="white"/>
          <circle cx="-2" cy="-1" r="0.5" fill="#000000"/>
          <circle cx="2" cy="-1" r="0.5" fill="#000000"/>
          <ellipse cx="0" cy="1" rx="1" ry="0.5" fill="#000000"/>
          {/* Tiger tail */}
          <path d="M 8 10 Q 12 5 10 0 Q 8 -5 6 0" stroke="#fbbf24" strokeWidth="2" fill="none"/>
          <rect x="8" y="8" width="2" height="1" fill="#000000"/>
        </g>
        
        {/* Right Tiger */}
        <g transform="translate(60, 0) scale(-1, 1)">
          {/* Tiger body */}
          <ellipse cx="0" cy="15" rx="8" ry="12" fill="#fbbf24"/>
          {/* Tiger head */}
          <circle cx="0" cy="0" r="6" fill="#fbbf24"/>
          {/* Tiger stripes */}
          {[...Array(6)].map((_, i) => (
            <rect key={i} x="-7" y={-2 + i * 2} width="2" height="1" fill="#000000" transform={`rotate(${i * 15 - 30})`}/>
          ))}
          {[...Array(4)].map((_, i) => (
            <rect key={i} x="-6" y={5 + i * 2} width="1.5" height="0.8" fill="#000000" transform={`rotate(${i * 10 - 20})`}/>
          ))}
          {/* Tiger face */}
          <circle cx="-2" cy="-1" r="1" fill="white"/>
          <circle cx="2" cy="-1" r="1" fill="white"/>
          <circle cx="-2" cy="-1" r="0.5" fill="#000000"/>
          <circle cx="2" cy="-1" r="0.5" fill="#000000"/>
          <ellipse cx="0" cy="1" rx="1" ry="0.5" fill="#000000"/>
          {/* Tiger tail */}
          <path d="M 8 10 Q 12 5 10 0 Q 8 -5 6 0" stroke="#fbbf24" strokeWidth="2" fill="none"/>
          <rect x="8" y="8" width="2" height="1" fill="#000000"/>
        </g>
      </g>
      
      {/* Scroll banner */}
      <g transform="translate(100, 200)">
        {/* Banner background */}
        <path
          d="M -40 0 Q -45 -8 -40 -15 Q -35 -8 -40 0 Q -35 8 -40 15 Q -45 8 -40 0 M 40 0 Q 45 -8 40 -15 Q 35 -8 40 0 Q 35 8 40 15 Q 45 8 40 0"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="1"
        />
        <rect x="-40" y="-15" width="80" height="30" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
        
        {/* Banner text */}
        <text x="0" y="-5" textAnchor="middle" fontSize="6" fill="#000000" fontFamily="Arial, sans-serif" fontWeight="bold">
          BERSEKUTU
        </text>
        <text x="0" y="5" textAnchor="middle" fontSize="6" fill="#000000" fontFamily="Arial, sans-serif" fontWeight="bold">
          BERTAMBAH MUTU
        </text>
        
        {/* Jawi script (simplified representation) */}
        <text x="0" y="12" textAnchor="middle" fontSize="4" fill="#000000" fontFamily="Arial, sans-serif">
          برسكوتو برتمبه موتو
        </text>
      </g>
    </svg>
  );
}