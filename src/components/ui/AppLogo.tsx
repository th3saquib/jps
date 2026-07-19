'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export default function AppLogo({ size = 32, className = '' }: AppLogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Clock size={size} />
    </div>
  );
}
