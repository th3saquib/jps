import type { PunchRecord, DailySummary, MonthSummary, JPSData } from '../types/jps';

const AUTH_KEY = 'jps_auth_v1';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const DEFAULT_PIN = '5689';

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      localStorage.setItem(AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    // Ignore storage errors in SSR environment
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/jps/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.authenticated;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Data Storage ─────────────────────────────────────────────────────────────

export async function loadData(): Promise<JPSData> {
  if (typeof window === 'undefined') return { punches: [], lastSynced: null };
  try {
    const res = await fetch('/api/jps');
    if (!res.ok) throw new Error('Failed to load data');
    return (await res.json()) as JPSData;
  } catch {
    return { punches: [], lastSynced: null };
  }
}

export function saveData(_data: JPSData): void {
  // Persisted server-side via API routes
}

export async function addPunch(action: 'in' | 'out'): Promise<PunchRecord | null> {
  try {
    const res = await fetch('/api/jps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error('Failed to add punch');
    return (await res.json()) as PunchRecord;
  } catch {
    return null;
  }
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function toDateKey(isoString: string): string {
  return isoString.slice(0, 10); // YYYY-MM-DD
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatTimeWithSeconds(isoString: string): string {
  const d = new Date(isoString);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
  return `${days[d.getDay()]}, ${day} ${months[month - 1]}`;
}

export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Computation ──────────────────────────────────────────────────────────────

export function computeDailyMinutes(punches: PunchRecord[]): number {
  let total = 0;
  let lastIn: string | null = null;

  for (const p of punches) {
    if (p.action === 'in') {
      lastIn = p.timestamp;
    } else if (p.action === 'out' && lastIn !== null) {
      const diff = new Date(p.timestamp).getTime() - new Date(lastIn).getTime();
      total += Math.floor(diff / 60000);
      lastIn = null;
    }
  }

  // If currently clocked in, add time up to now
  if (lastIn !== null) {
    const diff = Date.now() - new Date(lastIn).getTime();
    total += Math.floor(diff / 60000);
  }

  return total;
}

export function getCurrentStatus(punches: PunchRecord[]): 'in' | 'out' {
  if (punches.length === 0) return 'out';
  const last = punches[punches.length - 1];
  return last.action === 'in' ? 'in' : 'out';
}

export function getTodayPunches(allPunches: PunchRecord[]): PunchRecord[] {
  const today = getTodayKey();
  return allPunches.filter((p) => toDateKey(p.timestamp) === today);
}

export function buildDailySummary(date: string, punches: PunchRecord[]): DailySummary {
  const dayPunches = punches.filter((p) => toDateKey(p.timestamp) === date);
  const inPunches = dayPunches.filter((p) => p.action === 'in');
  const outPunches = dayPunches.filter((p) => p.action === 'out');

  const firstIn = inPunches.length > 0 ? inPunches[0].timestamp : null;
  const lastOut = outPunches.length > 0 ? outPunches[outPunches.length - 1].timestamp : null;

  return {
    date,
    totalMinutes: computeDailyMinutes(dayPunches),
    punchCount: dayPunches.length,
    firstIn,
    lastOut,
  };
}

export function buildMonthSummary(
  year: number,
  month: number,
  allPunches: PunchRecord[]
): MonthSummary {
  const prefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  const monthPunches = allPunches.filter((p) => p.timestamp.startsWith(prefix));

  // Get unique dates
  const dateSet = new Set(monthPunches.map((p) => toDateKey(p.timestamp)));
  const dates = Array.from(dateSet).sort();

  const days: DailySummary[] = dates.map((date) => buildDailySummary(date, monthPunches));
  const daysWorked = days.filter((d) => d.totalMinutes > 0).length;
  const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);

  return { year, month, daysWorked, totalMinutes, days };
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportCSV(summary: MonthSummary): void {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const rows = [
    ['Date', 'First In', 'Last Out', 'Total Hours', 'Total Minutes'],
    ...summary.days.map((d) => [
      d.date,
      d.firstIn ? formatTime(d.firstIn) : '-',
      d.lastOut ? formatTime(d.lastOut) : '-',
      (d.totalMinutes / 60).toFixed(2),
      d.totalMinutes.toString(),
    ]),
    [],
    ['Summary', '', '', '', ''],
    ['Days Worked', summary.daysWorked.toString(), '', '', ''],
    ['Total Hours', (summary.totalMinutes / 60).toFixed(2), '', '', ''],
  ];

  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Job_Punch_System_Attendance_${monthNames[summary.month]}_${summary.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(summary: MonthSummary): void {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const title = `Job Punch System Attendance — ${monthNames[summary.month]} ${summary.year}`;

  const rows = summary.days
    .map(
      (d) => `
    <tr>
      <td>${formatDate(d.date)}</td>
      <td>${d.firstIn ? formatTime(d.firstIn) : '—'}</td>
      <td>${d.lastOut ? formatTime(d.lastOut) : '—'}</td>
      <td>${formatDuration(d.totalMinutes)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 32px; color: #0A1628; }
        h1 { color: #003056; font-size: 22px; margin-bottom: 4px; }
        .subtitle { color: #6B7A94; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #003056; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
        td { padding: 9px 12px; border-bottom: 1px solid #DDE3EC; font-size: 13px; }
        tr:nth-child(even) td { background: #F4F6F9; }
        .summary { background: #EEF2F7; border-radius: 8px; padding: 16px; display: flex; gap: 32px; }
        .summary-item { }
        .summary-label { font-size: 11px; color: #6B7A94; text-transform: uppercase; letter-spacing: 0.06em; }
        .summary-value { font-size: 20px; font-weight: 700; color: #003056; }
        .accent { color: #f26322; }
        @media print { body { margin: 16px; } }
      </style>
    </head>
    <body>
      <h1>Job Punch System</h1>
      <div class="subtitle">Attendance Report · ${monthNames[summary.month]} ${summary.year}</div>
      <table>
        <thead>
          <tr><th>Date</th><th>First In</th><th>Last Out</th><th>Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Days Worked</div>
          <div class="summary-value accent">${summary.daysWorked}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Hours</div>
          <div class="summary-value">${formatDuration(summary.totalMinutes)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Avg / Day</div>
          <div class="summary-value">${summary.daysWorked > 0 ? formatDuration(Math.round(summary.totalMinutes / summary.daysWorked)) : '—'}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}
