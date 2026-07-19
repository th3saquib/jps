export type PunchAction = 'in' | 'out';

export interface PunchRecord {
  id: string;
  action: PunchAction;
  timestamp: string; // ISO string
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  punches: PunchRecord[];
  totalMinutes: number; // computed
}

export interface JPSData {
  punches: PunchRecord[];
  lastSynced: string | null;
}

export interface DailySummary {
  date: string;
  totalMinutes: number;
  punchCount: number;
  firstIn: string | null;
  lastOut: string | null;
}

export interface MonthSummary {
  year: number;
  month: number; // 0-indexed
  daysWorked: number;
  totalMinutes: number;
  days: DailySummary[];
}
