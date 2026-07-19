import type { AttendanceRecord } from '../types/attendance';

/**
 * Haversine formula — computes great-circle distance between two
 * lat/lng coordinates in meters.
 * Backend integration point: this can also be validated server-side
 * to prevent spoofed coordinates.
 */
export function computeHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats an ISO timestamp to "07:34 AM" style (12h).
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Formats an ISO timestamp to "19 Jul 2026, 07:34 AM" style.
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
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
  const d = date.getDate();
  const mon = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${mon} ${y}, ${formatTime(isoString)}`;
}

/**
 * Returns the date key for today (YYYY-MM-DD) for localStorage keying.
 */
export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes total hours worked today from a history array.
 * Pairs clock-in with the next clock-out, sums durations.
 */
export function computeTotalHoursToday(history: AttendanceRecord[]): string {
  const today = new Date();

  const todayRecords = history.filter((r) => {
    const d = new Date(r.timestamp);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  let totalMs = 0;
  let lastClockIn: Date | null = null;

  for (const record of todayRecords) {
    if (record.action === 'in') {
      lastClockIn = new Date(record.timestamp);
    } else if (record.action === 'out' && lastClockIn !== null) {
      totalMs += new Date(record.timestamp).getTime() - lastClockIn.getTime();
      lastClockIn = null;
    }
  }

  // If currently clocked in, count up to now
  if (lastClockIn !== null) {
    totalMs += Date.now() - lastClockIn.getTime();
  }

  const totalMinutes = Math.floor(totalMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}
