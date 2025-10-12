import React from 'react';
import { JataNegaraSVG } from './JataNegaraSVG';

interface JataNegaraProps {
  size?: number;
  className?: string;
}

export function JataNegara({ size = 84, className = "" }: JataNegaraProps) {
  return <JataNegaraSVG size={size} className={className} />;
}
