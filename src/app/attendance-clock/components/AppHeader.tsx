import React from 'react';
import AppLogo from '@/components/ui/AppLogo';

interface AppHeaderProps {
  currentTime: string;
  currentDate: string;
}

export default function AppHeader({ currentTime, currentDate }: AppHeaderProps) {
  return (
    <header className="app-header text-white safe-bottom">
      <div className="w-full max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppLogo size={32} className="brightness-0 invert" />
          <span className="font-bold text-lg tracking-tight">AttendTrack</span>
        </div>
        <div className="text-right">
          <p className="font-tabular font-bold text-base leading-tight">
            {currentTime || '––:––:––'}
          </p>
          <p className="text-xs opacity-80 leading-tight">{currentDate || 'Loading…'}</p>
        </div>
      </div>
    </header>
  );
}
