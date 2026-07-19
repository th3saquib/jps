'use client';

import React from 'react';
import { LogIn, LogOut, Loader2, Lock } from 'lucide-react';
import type { GpsStatus, NetworkStatus } from '../types/attendance';

interface ClockButtonsProps {
  canClockIn: boolean;
  canClockOut: boolean;
  isClockingIn: boolean;
  isClockingOut: boolean;
  shakeClockIn: boolean;
  shakeClockOut: boolean;
  employeeStatus: 'In' | 'Out' | null;
  gpsStatus: GpsStatus;
  networkStatus: NetworkStatus;
  onClockIn: () => void;
  onClockOut: () => void;
}

function getBlockReason(
  action: 'in' | 'out',
  employeeStatus: 'In' | 'Out' | null,
  gpsStatus: GpsStatus,
  networkStatus: NetworkStatus
): string | null {
  if (!employeeStatus) return 'Select your Employee ID above.';

  if (action === 'in' && employeeStatus === 'In') return 'You are already clocked in.';
  if (action === 'out' && employeeStatus === 'Out') return 'You are not currently clocked in.';

  const reasons: string[] = [];
  if (gpsStatus === 'out_of_range') reasons.push('GPS out of range');
  else if (gpsStatus === 'error') reasons.push('GPS unavailable');
  else if (gpsStatus === 'checking' || gpsStatus === 'idle') reasons.push('GPS verifying…');

  if (networkStatus === 'unauthorized') reasons.push('network unauthorized');
  else if (networkStatus === 'error') reasons.push('network error');
  else if (networkStatus === 'checking' || networkStatus === 'idle')
    reasons.push('network verifying…');

  if (reasons.length > 0) return `Blocked: ${reasons.join(', ')}.`;
  return null;
}

export default function ClockButtons({
  canClockIn,
  canClockOut,
  isClockingIn,
  isClockingOut,
  shakeClockIn,
  shakeClockOut,
  employeeStatus,
  gpsStatus,
  networkStatus,
  onClockIn,
  onClockOut,
}: ClockButtonsProps) {
  const clockInBlockReason = !canClockIn
    ? getBlockReason('in', employeeStatus, gpsStatus, networkStatus)
    : null;

  const clockOutBlockReason = !canClockOut
    ? getBlockReason('out', employeeStatus, gpsStatus, networkStatus)
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Clock In */}
      <div className={`flex flex-col gap-1 ${shakeClockIn ? 'animate-shake' : ''}`}>
        <button
          onClick={onClockIn}
          disabled={!canClockIn || isClockingIn || isClockingOut}
          className="btn-clock-in w-full rounded-xl py-4 px-6 font-bold text-base flex items-center justify-center gap-2.5 min-h-[58px]"
          aria-label="Clock In"
        >
          {isClockingIn ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Logging Clock-In…</span>
            </>
          ) : (
            <>
              {!canClockIn && <Lock size={16} className="opacity-60" />}
              {canClockIn && <LogIn size={20} />}
              <span>Clock In</span>
            </>
          )}
        </button>
        {clockInBlockReason && !isClockingIn && (
          <p className="text-xs text-muted-foreground px-1 flex items-center gap-1">
            <Lock size={10} className="flex-shrink-0" />
            {clockInBlockReason}
          </p>
        )}
      </div>

      {/* Clock Out */}
      <div className={`flex flex-col gap-1 ${shakeClockOut ? 'animate-shake' : ''}`}>
        <button
          onClick={onClockOut}
          disabled={!canClockOut || isClockingIn || isClockingOut}
          className="btn-clock-out w-full rounded-xl py-4 px-6 font-bold text-base flex items-center justify-center gap-2.5 min-h-[58px]"
          aria-label="Clock Out"
        >
          {isClockingOut ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Logging Clock-Out…</span>
            </>
          ) : (
            <>
              {!canClockOut && <Lock size={16} className="opacity-60" />}
              {canClockOut && <LogOut size={20} />}
              <span>Clock Out</span>
            </>
          )}
        </button>
        {clockOutBlockReason && !isClockingOut && (
          <p className="text-xs text-muted-foreground px-1 flex items-center gap-1">
            <Lock size={10} className="flex-shrink-0" />
            {clockOutBlockReason}
          </p>
        )}
      </div>
    </div>
  );
}
