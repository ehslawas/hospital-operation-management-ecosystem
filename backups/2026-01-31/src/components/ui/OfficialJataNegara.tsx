import React from 'react';

interface OfficialJataNegaraProps {
  size?: number;
  className?: string;
}

export function OfficialJataNegara({ size, className = "" }: OfficialJataNegaraProps) {
  return (
    <svg
      viewBox="0 0 300 360"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size ? size : undefined}
      height={size ? size * 1.2 : undefined}
    >
      {/* 14-pointed star (Bintang Persekutuan) */}
      <g transform="translate(150, 30)">
        {[...Array(14)].map((_, i) => {
          const angle = (i * 360) / 14;
          const outerRadius = 20;
          const innerRadius = 8;
          const x1 = Math.cos((angle - 90) * Math.PI / 180) * outerRadius;
          const y1 = Math.sin((angle - 90) * Math.PI / 180) * outerRadius;
          const x2 = Math.cos((angle - 90) * Math.PI / 180) * innerRadius;
          const y2 = Math.sin((angle - 90) * Math.PI / 180) * innerRadius;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} L ${x2} ${y2} L ${Math.cos(((angle + 12.86) - 90) * Math.PI / 180) * outerRadius} ${Math.sin(((angle + 12.86) - 90) * Math.PI / 180) * outerRadius} Z`}
              fill="#FFD700"
              stroke="#B8860B"
              strokeWidth="0.5"
            />
          );
        })}
      </g>

      {/* Crescent moon */}
      <path
        d="M 140 50 A 12 18 0 0 1 160 50 A 12 18 0 0 1 140 50"
        fill="#FFD700"
        stroke="#B8860B"
        strokeWidth="1"
      />

      {/* Main shield */}
      <g transform="translate(150, 100)">
        {/* Shield outline */}
        <path
          d="M -60 -50 L 60 -50 L 65 -30 L 65 40 L 60 50 L -60 50 L -65 40 L -65 -30 Z"
          fill="white"
          stroke="#000000"
          strokeWidth="2"
        />

        {/* Chief - Red band with kris */}
        <rect x="-60" y="-50" width="120" height="20" fill="#DC143C" />
        <g fill="#FFD700">
          {[...Array(5)].map((_, i) => (
            <g key={i} transform={`translate(${-40 + i * 20}, -40)`}>
              <path d="M -8 -5 L -6 -3 L -6 3 L -8 1 Z" />
              <path d="M -6 -3 L -4 -1 L -4 1 L -6 3 Z" />
              <path d="M -4 -1 L -2 1 L -2 3 L -4 1 Z" />
              <path d="M -2 1 L 0 3 L 0 5 L -2 3 Z" />
              <path d="M 0 3 L 2 1 L 2 3 L 0 5 Z" />
              <path d="M 2 1 L 4 -1 L 4 1 L 2 3 Z" />
              <path d="M 4 -1 L 6 -3 L 6 -1 L 4 1 Z" />
              <path d="M 6 -3 L 8 -5 L 6 -5 L 6 -1 Z" />
            </g>
          ))}
        </g>

        {/* Upper Left - Penang (Palm tree on island) */}
        <g transform="translate(-40, -25)">
          {/* Sea waves */}
          <path d="M -20 5 Q -15 0 -10 5 Q -5 10 0 5 Q 5 0 10 5 Q 15 10 20 5"
            fill="#4169E1" stroke="#000080" strokeWidth="0.5" />
          {/* Island */}
          <ellipse cx="0" cy="8" rx="18" ry="5" fill="#228B22" />
          {/* Palm tree trunk */}
          <rect x="-2" y="-10" width="4" height="18" fill="#8B4513" />
          {/* Palm fronds */}
          <path d="M 0 -10 Q -8 -15 -6 -20 Q -3 -18 0 -15 Q 3 -18 6 -20 Q 8 -15 0 -10" fill="#32CD32" />
          <path d="M 0 -10 Q -6 -13 -4 -16 Q -2 -15 0 -13 Q 2 -15 4 -16 Q 6 -13 0 -10" fill="#32CD32" />
          <path d="M 0 -10 Q 6 -13 4 -16 Q 2 -15 0 -13 Q -2 -15 -4 -16 Q -6 -13 0 -10" fill="#32CD32" />
        </g>

        {/* Upper Right - Malacca (Malacca tree) */}
        <g transform="translate(40, -25)">
          {/* Ground */}
          <ellipse cx="0" cy="8" rx="18" ry="6" fill="#228B22" />
          {/* Tree trunk */}
          <rect x="-3" y="-12" width="6" height="20" fill="#654321" />
          {/* Tree canopy */}
          <ellipse cx="0" cy="-15" rx="12" ry="8" fill="#32CD32" />
          <ellipse cx="-8" cy="-12" rx="8" ry="6" fill="#228B22" />
          <ellipse cx="8" cy="-12" rx="8" ry="6" fill="#228B22" />
        </g>

        {/* Central vertical panels (Federated Malay States) */}
        <rect x="-60" y="-30" width="15" height="35" fill="#000000" />
        <rect x="-45" y="-30" width="15" height="35" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
        <rect x="-30" y="-30" width="15" height="35" fill="#DC143C" />
        <rect x="-15" y="-30" width="15" height="35" fill="#FFD700" />
        <rect x="0" y="-30" width="15" height="35" fill="#000000" />
        <rect x="15" y="-30" width="15" height="35" fill="#FFFFFF" stroke="#000000" strokeWidth="0.5" />
        <rect x="30" y="-30" width="15" height="35" fill="#DC143C" />
        <rect x="45" y="-30" width="15" height="35" fill="#FFD700" />

        {/* Lower Left - Sabah (Four flags) */}
        <g transform="translate(-40, 10)">
          {[...Array(4)].map((_, i) => (
            <g key={i} transform={`translate(${i * 8}, 0)`}>
              <line x1="0" y1="0" x2="0" y2="12" stroke="#8B4513" strokeWidth="1.5" />
              <rect x="-2" y="0" width="4" height="6" fill="#4169E1" />
              <rect x="-2" y="6" width="4" height="6" fill="#FFFFFF" stroke="#000000" strokeWidth="0.3" />
            </g>
          ))}
        </g>

        {/* Lower Center - Hibiscus (Bunga Raya) */}
        <g transform="translate(0, 10)">
          {/* Flower center */}
          <circle cx="0" cy="0" r="6" fill="#FFD700" />
          {/* Petals */}
          {[...Array(5)].map((_, i) => {
            const angle = (i * 360) / 5;
            return (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx="15"
                ry="8"
                fill="#DC143C"
                transform={`rotate(${angle})`}
              />
            );
          })}
          {/* Stem */}
          <line x1="0" y1="6" x2="0" y2="15" stroke="#228B22" strokeWidth="2" />
          {/* Leaves */}
          <ellipse cx="-8" cy="8" rx="6" ry="3" fill="#32CD32" transform="rotate(-30)" />
          <ellipse cx="8" cy="10" rx="6" ry="3" fill="#32CD32" transform="rotate(30)" />
        </g>

        {/* Lower Right - Sarawak (Hornbill) */}
        <g transform="translate(40, 10)">
          {/* Small shield */}
          <rect x="-5" y="-3" width="10" height="12" fill="#FFD700" stroke="#8B4513" strokeWidth="1" />
          {/* Hornbill body */}
          <ellipse cx="0" cy="12" rx="8" ry="6" fill="#DC143C" />
          {/* Hornbill head */}
          <ellipse cx="0" cy="5" rx="6" ry="4" fill="#DC143C" />
          {/* Beak */}
          <path d="M 0 5 L 8 2 L 10 4 L 8 6 Z" fill="#FFD700" />
          {/* Wing */}
          <ellipse cx="-4" cy="12" rx="5" ry="3" fill="#8B0000" />
        </g>
      </g>

      {/* Tigers (Supporters) */}
      <g transform="translate(150, 180)">
        {/* Left Tiger */}
        <g transform="translate(-80, 0)">
          {/* Tiger body */}
          <ellipse cx="0" cy="20" rx="12" ry="18" fill="#FFD700" />
          {/* Tiger head */}
          <ellipse cx="0" cy="0" r="10" fill="#FFD700" />
          {/* Tiger stripes */}
          {[...Array(8)].map((_, i) => (
            <rect key={i} x="-11" y={-8 + i * 2} width="3" height="1.5" fill="#000000"
              transform={`rotate(${i * 10 - 20})`} />
          ))}
          {/* Tiger face details */}
          <circle cx="-3" cy="-2" r="1.5" fill="white" />
          <circle cx="3" cy="-2" r="1.5" fill="white" />
          <circle cx="-3" cy="-2" r="0.8" fill="#000000" />
          <circle cx="3" cy="-2" r="0.8" fill="#000000" />
          <ellipse cx="0" cy="2" rx="1.5" ry="0.8" fill="#000000" />
          {/* Tiger mouth */}
          <path d="M -2 4 Q 0 6 2 4" stroke="#000000" strokeWidth="1" fill="none" />
          {/* Tiger tail */}
          <path d="M 12 15 Q 18 10 16 0 Q 14 -10 10 -5" stroke="#FFD700" strokeWidth="3" fill="none" />
          {[...Array(4)].map((_, i) => (
            <rect key={i} x={12 + i * 1} y={15 - i * 2} width="1.5" height="1" fill="#000000" />
          ))}
        </g>

        {/* Right Tiger */}
        <g transform="translate(80, 0) scale(-1, 1)">
          {/* Tiger body */}
          <ellipse cx="0" cy="20" rx="12" ry="18" fill="#FFD700" />
          {/* Tiger head */}
          <ellipse cx="0" cy="0" r="10" fill="#FFD700" />
          {/* Tiger stripes */}
          {[...Array(8)].map((_, i) => (
            <rect key={i} x="-11" y={-8 + i * 2} width="3" height="1.5" fill="#000000"
              transform={`rotate(${i * 10 - 20})`} />
          ))}
          {/* Tiger face details */}
          <circle cx="-3" cy="-2" r="1.5" fill="white" />
          <circle cx="3" cy="-2" r="1.5" fill="white" />
          <circle cx="-3" cy="-2" r="0.8" fill="#000000" />
          <circle cx="3" cy="-2" r="0.8" fill="#000000" />
          <ellipse cx="0" cy="2" rx="1.5" ry="0.8" fill="#000000" />
          {/* Tiger mouth */}
          <path d="M -2 4 Q 0 6 2 4" stroke="#000000" strokeWidth="1" fill="none" />
          {/* Tiger tail */}
          <path d="M 12 15 Q 18 10 16 0 Q 14 -10 10 -5" stroke="#FFD700" strokeWidth="3" fill="none" />
          {[...Array(4)].map((_, i) => (
            <rect key={i} x={12 + i * 1} y={15 - i * 2} width="1.5" height="1" fill="#000000" />
          ))}
        </g>
      </g>

      {/* Scroll banner */}
      <g transform="translate(150, 280)">
        {/* Banner background */}
        <path
          d="M -60 -15 Q -70 -25 -60 -35 Q -50 -25 -60 -15 M 60 -15 Q 70 -25 60 -35 Q 50 -25 60 -15"
          fill="#FFD700"
          stroke="#DC143C"
          strokeWidth="2"
        />
        <rect x="-60" y="-35" width="120" height="40" fill="#FFD700" stroke="#DC143C" strokeWidth="2" />

        {/* Banner text */}
        <text x="0" y="-10" textAnchor="middle" fontSize="10" fill="#000000"
          fontFamily="Arial, sans-serif" fontWeight="bold">
          BERSEKUTU
        </text>
        <text x="0" y="5" textAnchor="middle" fontSize="10" fill="#000000"
          fontFamily="Arial, sans-serif" fontWeight="bold">
          BERTAMBAH MUTU
        </text>

        {/* Jawi script */}
        <text x="0" y="18" textAnchor="middle" fontSize="7" fill="#000000"
          fontFamily="Arial, sans-serif">
          برسكوتو برتمبه موتو
        </text>
      </g>
    </svg>
  );
}
