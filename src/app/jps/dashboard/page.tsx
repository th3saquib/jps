'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  isAuthenticated,
  setAuthenticated,
  loadData,
  addPunch,
  getTodayPunches,
  getCurrentStatus,
  computeDailyMinutes,
  formatDuration,
  formatTime,
  buildMonthSummary,
} from '../utils/jpsUtils';
import type { PunchRecord } from '../types/jps';
import AppLogo from '@/components/ui/AppLogo';
import AppIcon from '@/components/ui/AppIcon';
import ValidationBadges from '@/app/attendance-clock/components/ValidationBadges';
const OFFICE_LATITUDE = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LATITUDE || '28.645668');
const OFFICE_LONGITUDE = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LONGITUDE || '77.201187');
const OFFICE_RADIUS = parseFloat(process.env.NEXT_PUBLIC_OFFICE_RADIUS || '50');

function computeHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

import type { GpsState, NetworkState } from '@/app/attendance-clock/types/attendance';

export default function JPSDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'in' | 'out'>('out');
  const [todayPunches, setTodayPunches] = useState<PunchRecord[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [lastPunchTime, setLastPunchTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [punchAnim, setPunchAnim] = useState(false);
  const [monthDays, setMonthDays] = useState(0);
  const [monthMinutes, setMonthMinutes] = useState(0);

  const [gpsState, setGpsState] = useState<GpsState>({
    status: 'idle',
    distance: null,
    coords: null,
    error: null,
  });
  const [networkState, setNetworkState] = useState<NetworkState>({
    status: 'idle',
    networkName: null,
    error: null,
  });

  const gpsWatchRef = useRef<number | null>(null);
  const networkCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshData = useCallback(async () => {
    const data = await loadData();
    const today = getTodayPunches(data.punches);
    const currentStatus = getCurrentStatus(today);
    const minutes = computeDailyMinutes(today);

    setTodayPunches(today);
    setStatus(currentStatus);
    setTodayMinutes(minutes);

    if (today.length > 0) {
      setLastPunchTime(today[today.length - 1].timestamp);
    }

    const now = new Date();
    const summary = buildMonthSummary(now.getFullYear(), now.getMonth(), data.punches);
    setMonthDays(summary.daysWorked);
    setMonthMinutes(summary.totalMinutes);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/jps/login');
      return;
    }
    setMounted(true);
    refreshData();
  }, [router, refreshData]);

  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss}`);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      setCurrentDate(
        `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Start GPS watch on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (!navigator || !navigator.geolocation)) {
      setGpsState({
        status: 'error',
        distance: null,
        coords: null,
        error:
          'GPS is unavailable. Note: Geolocation requires HTTPS to prompt for permission on mobile devices. (Set NEXT_PUBLIC_BYPASS_GEOFENCE=true in .env to bypass this during local testing)',
      });
      return;
    }

    setGpsState((prev) => ({ ...prev, status: 'checking' }));

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const distance = computeHaversineDistance(
          latitude,
          longitude,
          OFFICE_LATITUDE,
          OFFICE_LONGITUDE
        );
        const withinRange = distance <= OFFICE_RADIUS;
        setGpsState({
          status: withinRange ? 'verified' : 'out_of_range',
          distance: Math.round(distance),
          coords: { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) },
          error: withinRange
            ? null
            : `You are ${Math.round(distance)}m from the office. Move within ${OFFICE_RADIUS}m to clock in.`,
        });
      },
      (err) => {
        let errorMsg = 'Unable to get your location.';
        if (err.code === 1)
          errorMsg =
            'Location access denied. Note: Geolocation requires HTTPS to work on mobile devices. Set NEXT_PUBLIC_BYPASS_GEOFENCE=true in .env to bypass this during local testing.';
        else if (err.code === 2)
          errorMsg = 'Location unavailable. Check that GPS is enabled on your device.';
        else if (err.code === 3)
          errorMsg = 'Location request timed out. Move to an area with better signal and retry.';
        setGpsState({
          status: 'error',
          distance: null,
          coords: null,
          error: errorMsg,
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  // Real-time network check via server IP verification endpoint
  const runNetworkCheck = useCallback(async () => {
    setNetworkState({ status: 'checking', networkName: null, error: null });

    try {
      const res = await fetch('/api/jps/network-check');
      if (!res.ok) throw new Error('Verification request failed');
      const data = await res.json();
      setNetworkState(data);
    } catch (err) {
      setNetworkState({
        status: 'error',
        networkName: null,
        error: 'Unable to reach validation server. Please verify your connection.',
      });
    }
  }, []);

  useEffect(() => {
    runNetworkCheck();
    const interval = setInterval(runNetworkCheck, 30000);
    const currentTimer = networkCheckRef.current;
    return () => {
      clearInterval(interval);
      if (currentTimer) clearTimeout(currentTimer);
    };
  }, [runNetworkCheck]);

  // Live tally when clocked in
  useEffect(() => {
    if (status !== 'in') return;
    const id = setInterval(async () => {
      const data = await loadData();
      const today = getTodayPunches(data.punches);
      setTodayMinutes(computeDailyMinutes(today));
    }, 30000);
    return () => clearInterval(id);
  }, [status]);

  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bypassGeofence = process.env.NEXT_PUBLIC_BYPASS_GEOFENCE === 'true';
  const canPunch =
    bypassGeofence || (gpsState.status === 'verified' && networkState.status === 'authorized');

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (!canPunch) return;
    cancelHold();

    const startTime = Date.now();
    const duration = 1000; // 1 second hold

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        if (holdTimerRef.current) {
          clearInterval(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(80);
        }
        // Execute punch
        const action = status === 'out' ? 'in' : 'out';
        addPunch(action).then(() => {
          setPunchAnim(true);
          setTimeout(() => setPunchAnim(false), 400);
          refreshData();
        });
        setHoldProgress(0);
      }
    }, 30);
  }, [canPunch, status, refreshData, cancelHold]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  function handleLogout() {
    setAuthenticated(false);
    router.push('/jps/login');
  }

  const monthName = new Date().toLocaleString('en-US', { month: 'long' });

  if (!mounted) return null;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="jps-header px-5 pt-safe-top pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#f26322]">
            <AppLogo size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Job Punch System</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/jps/history')}
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/80 active:scale-95 transition-transform"
            aria-label="History"
          >
            <AppIcon name="ArrowPathIcon" size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/80 active:scale-95 transition-transform"
            aria-label="Logout"
          >
            <AppIcon name="ArrowLeftOnRectangleIcon" size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-5 py-5 gap-4 max-w-md mx-auto w-full">
        {/* Clock */}
        <div className="text-center">
          <div className="font-tabular text-4xl font-bold text-[#003056] tracking-tight">
            {currentTime}
          </div>
          <div className="text-sm text-[var(--muted-foreground)] mt-1">{currentDate}</div>
        </div>

        {/* Status Card */}
        <div
          className={`card-base p-4 flex items-center gap-4 ${status === 'in' ? 'border-[#86EFAC]' : 'border-[var(--border)]'}`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${status === 'in' ? 'bg-[#F0FDF4]' : 'bg-[var(--secondary)]'}`}
          >
            {status === 'in' ? (
              <div className="relative">
                <span className="pulse-dot pulse-dot-green" />
              </div>
            ) : (
              <AppIcon name="ClockIcon" size={22} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status === 'in' ? 'status-in' : 'status-out'}`}
              >
                {status === 'in' ? '● Clocked In' : '○ Clocked Out'}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {lastPunchTime ? `Last punch at ${formatTime(lastPunchTime)}` : 'No punches today'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-tabular text-xl font-bold text-[#003056]">
              {formatDuration(todayMinutes)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">today</div>
          </div>
        </div>

        {/* Validation Badges */}
        <div className="card-base p-4">
          <ValidationBadges
            gpsState={gpsState}
            networkState={networkState}
            onRetryNetwork={runNetworkCheck}
          />
        </div>

        {/* BIG PUNCH BUTTON */}
        <div className="flex flex-col items-center py-4">
          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            disabled={!canPunch}
            className={`relative w-44 h-44 rounded-full font-bold text-xl shadow-card-lg active:scale-95 transition-all duration-200 select-none ${
              status === 'out' ? 'btn-punch-in' : 'btn-punch-out'
            } ${punchAnim ? 'animate-success-bounce' : ''}`}
            aria-label={status === 'out' ? 'Punch In' : 'Punch Out'}
          >
            {holdProgress > 0 && (
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 176 176"
              >
                <circle
                  cx="88"
                  cy="88"
                  r="82"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeDasharray="515"
                  strokeDashoffset={515 - (515 * holdProgress) / 100}
                  className="transition-all duration-75 ease-out"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div className="flex flex-col items-center gap-2">
              {status === 'out' ? (
                <>
                  <AppIcon name="ArrowUpOnSquareIcon" size={36} />
                  <span>PUNCH IN</span>
                </>
              ) : (
                <>
                  <AppIcon name="ArrowDownOnSquareIcon" size={36} />
                  <span>PUNCH OUT</span>
                </>
              )}
            </div>
          </button>
          <p className="text-xs text-[var(--muted-foreground)] mt-3">
            {status === 'out' ? 'Press & hold to start shift' : 'Press & hold to end shift'}
          </p>
        </div>

        {/* Monthly Summary */}
        <div className="card-base p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label">{monthName} Summary</span>
            <button
              onClick={() => router.push('/jps/history')}
              className="text-xs text-[#f26322] font-medium"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--secondary)] rounded-xl p-3">
              <div className="text-2xl font-bold text-[#003056] font-tabular">{monthDays}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Days Worked</div>
            </div>
            <div className="bg-[var(--secondary)] rounded-xl p-3">
              <div className="text-2xl font-bold text-[#f26322] font-tabular">
                {formatDuration(monthMinutes)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Total Hours</div>
            </div>
          </div>
        </div>

        {/* Today's Punches */}
        {todayPunches.length > 0 && (
          <div className="card-base p-4">
            <span className="section-label block mb-3">Today&apos;s Log</span>
            <div className="space-y-2">
              {todayPunches.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                    p.action === 'in'
                      ? 'bg-[#F0FDF4] border-l-2 border-[#16A34A]'
                      : 'bg-[#FFF7F4] border-l-2 border-[#f26322]'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold w-8 ${p.action === 'in' ? 'text-[#16A34A]' : 'text-[#f26322]'}`}
                  >
                    {p.action === 'in' ? 'IN' : 'OUT'}
                  </span>
                  <span className="font-tabular text-sm font-medium text-[#0A1628]">
                    {formatTime(p.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
