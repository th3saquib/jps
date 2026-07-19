'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from './AppHeader';
import EmployeeSelector from './EmployeeSelector';
import ValidationBadges from './ValidationBadges';
import HeroStatus from './HeroStatus';
import ClockButtons from './ClockButtons';
import AttendanceLedger from './AttendanceLedger';
import SuccessToast from './SuccessToast';
import { EMPLOYEES, OFFICE_CONFIG, ALLOWED_NETWORKS } from '../data/mockData';
import {
  computeHaversineDistance,
  formatTimestamp,
  computeTotalHoursToday,
} from '../utils/attendanceUtils';
import type {
  Employee,
  AttendanceRecord,
  GpsState,
  NetworkState,
  ToastMessage,
} from '../types/attendance';

// Backend integration point: replace localStorage reads/writes with API calls
// to your attendance service (e.g. POST /api/attendance/clock-in)

const STORAGE_KEY = 'attendtrack_employees_v1';

function loadEmployeesFromStorage(): Employee[] {
  if (typeof window === 'undefined') return EMPLOYEES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPLOYEES;
    return JSON.parse(raw) as Employee[];
  } catch {
    return EMPLOYEES;
  }
}

function saveEmployeesToStorage(employees: Employee[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

export default function AttendanceClockClient() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
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
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [shakeClockIn, setShakeClockIn] = useState(false);
  const [shakeClockOut, setShakeClockOut] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  const gpsWatchRef = useRef<number | null>(null);
  const networkCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadEmployeesFromStorage();
    setEmployees(stored);
  }, []);

  // Live clock
  useEffect(() => {
    function updateClock() {
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
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  // Start GPS watch on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState({
        status: 'error',
        distance: null,
        coords: null,
        error: 'GPS not supported on this device.',
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
          OFFICE_CONFIG.latitude,
          OFFICE_CONFIG.longitude
        );
        const withinRange = distance <= OFFICE_CONFIG.radiusMeters;
        setGpsState({
          status: withinRange ? 'verified' : 'out_of_range',
          distance: Math.round(distance),
          coords: { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) },
          error: withinRange
            ? null
            : `You are ${Math.round(distance)}m from the office. Move within ${OFFICE_CONFIG.radiusMeters}m to clock in.`,
        });
      },
      (err) => {
        let errorMsg = 'Unable to get your location.';
        if (err.code === 1)
          errorMsg =
            'Location access denied. Please enable GPS permissions in your browser settings.';
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

  // Mock network check on mount + periodic re-check
  const runNetworkCheck = useCallback(() => {
    setNetworkState({ status: 'checking', networkName: null, error: null });

    // Backend integration point: replace this mock with a real IP check
    // e.g. fetch('/api/network/verify') which checks client IP against allowlist
    // or use a service worker to read navigator.connection info

    // Simulate async network check (1–1.5s)
    const delay = 1000 + Math.floor(900 * (0.5 + 0.5 * ((Date.now() % 100) / 100)));
    networkCheckRef.current = setTimeout(() => {
      // Mock: randomly pick a "detected" network from the allowed list
      // In production, this would be a real IP/SSID verification
      const mockDetectedIndex = Date.now() % ALLOWED_NETWORKS.length;
      const detectedNetwork = ALLOWED_NETWORKS[mockDetectedIndex];

      // For demo: simulate ~80% success rate based on current second
      const currentSecond = Math.floor(Date.now() / 1000);
      const isAuthorized = currentSecond % 5 !== 0; // fails every 5th second for demo

      if (isAuthorized) {
        setNetworkState({
          status: 'authorized',
          networkName: detectedNetwork.name,
          error: null,
        });
      } else {
        setNetworkState({
          status: 'unauthorized',
          networkName: null,
          error: 'Network not recognized. Connect to an authorized office Wi-Fi network.',
        });
      }
    }, delay);
  }, []);

  useEffect(() => {
    runNetworkCheck();
    // Re-check network every 30 seconds
    const interval = setInterval(runNetworkCheck, 30000);
    return () => {
      clearInterval(interval);
      if (networkCheckRef.current) clearTimeout(networkCheckRef.current);
    };
  }, [runNetworkCheck]);

  const selectedEmployee = employees.find((e) => e.employeeId === selectedEmployeeId) ?? null;

  const canClockIn =
    selectedEmployee !== null &&
    selectedEmployee.status === 'Out' &&
    gpsState.status === 'verified' &&
    networkState.status === 'authorized';

  const canClockOut =
    selectedEmployee !== null &&
    selectedEmployee.status === 'In' &&
    gpsState.status === 'verified' &&
    networkState.status === 'authorized';

  function showToast(msg: ToastMessage) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }

  function handleClockIn() {
    if (!canClockIn) {
      setShakeClockIn(true);
      setTimeout(() => setShakeClockIn(false), 450);
      return;
    }
    setIsClockingIn(true);

    // Backend integration point: POST /api/attendance/clock-in
    // { employeeId, timestamp, coords, networkName }
    setTimeout(() => {
      const now = new Date();
      const record: AttendanceRecord = {
        id: `rec-${Date.now()}`,
        action: 'in',
        timestamp: now.toISOString(),
        coords: gpsState.coords ? { lat: gpsState.coords.lat, lng: gpsState.coords.lng } : null,
        networkName: networkState.networkName,
        distanceFromOffice: gpsState.distance,
      };

      const updated = employees.map((emp) =>
        emp.employeeId === selectedEmployeeId
          ? { ...emp, status: 'In' as const, history: [...emp.history, record] }
          : emp
      );
      setEmployees(updated);
      saveEmployeesToStorage(updated);
      setIsClockingIn(false);
      showToast({
        type: 'success',
        title: 'Clocked In',
        message: `Welcome, ${selectedEmployee!.name}! Logged at ${formatTimestamp(now.toISOString())}`,
      });
    }, 900);
  }

  function handleClockOut() {
    if (!canClockOut) {
      setShakeClockOut(true);
      setTimeout(() => setShakeClockOut(false), 450);
      return;
    }
    setIsClockingOut(true);

    // Backend integration point: POST /api/attendance/clock-out
    // { employeeId, timestamp, coords, networkName }
    setTimeout(() => {
      const now = new Date();
      const record: AttendanceRecord = {
        id: `rec-${Date.now()}`,
        action: 'out',
        timestamp: now.toISOString(),
        coords: gpsState.coords ? { lat: gpsState.coords.lat, lng: gpsState.coords.lng } : null,
        networkName: networkState.networkName,
        distanceFromOffice: gpsState.distance,
      };

      const updated = employees.map((emp) =>
        emp.employeeId === selectedEmployeeId
          ? { ...emp, status: 'Out' as const, history: [...emp.history, record] }
          : emp
      );
      setEmployees(updated);
      saveEmployeesToStorage(updated);
      setIsClockingOut(false);
      showToast({
        type: 'info',
        title: 'Clocked Out',
        message: `See you tomorrow, ${selectedEmployee!.name}! Logged at ${formatTimestamp(now.toISOString())}`,
      });
    }, 900);
  }

  const todayRecords = selectedEmployee
    ? selectedEmployee.history.filter((r) => {
        const recDate = new Date(r.timestamp);
        const today = new Date();
        return (
          recDate.getFullYear() === today.getFullYear() &&
          recDate.getMonth() === today.getMonth() &&
          recDate.getDate() === today.getDate()
        );
      })
    : [];

  const totalHoursToday = selectedEmployee
    ? computeTotalHoursToday(selectedEmployee.history)
    : '0h 0m';

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <AppHeader currentTime={currentTime} currentDate={currentDate} />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
        {/* Employee Selector */}
        <EmployeeSelector
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onSelect={setSelectedEmployeeId}
        />

        {/* Hero Status */}
        <HeroStatus employee={selectedEmployee} totalHoursToday={totalHoursToday} />

        {/* Validation Badges */}
        <ValidationBadges
          gpsState={gpsState}
          networkState={networkState}
          onRetryNetwork={runNetworkCheck}
        />

        {/* Clock Buttons */}
        <ClockButtons
          canClockIn={canClockIn}
          canClockOut={canClockOut}
          isClockingIn={isClockingIn}
          isClockingOut={isClockingOut}
          shakeClockIn={shakeClockIn}
          shakeClockOut={shakeClockOut}
          employeeStatus={selectedEmployee?.status ?? null}
          gpsStatus={gpsState.status}
          networkStatus={networkState.status}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
        />

        {/* Attendance Ledger */}
        <AttendanceLedger
          records={todayRecords}
          employeeName={selectedEmployee?.name ?? null}
          totalHoursToday={totalHoursToday}
        />
      </main>

      {/* Toast */}
      {toast && <SuccessToast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
