'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  isAuthenticated,
  loadData,
  buildMonthSummary,
  formatDuration,
  formatDate,
  formatTime,
  exportCSV,
  exportPDF,
} from '../utils/jpsUtils';
import type { MonthSummary } from '../types/jps';
import AppIcon from '@/components/ui/AppIcon';

const MONTH_NAMES = [
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

export default function JPSHistoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [exportMsg, setExportMsg] = useState('');

  const refreshSummary = useCallback(async (year: number, month: number) => {
    const data = await loadData();
    const s = buildMonthSummary(year, month, data.punches);
    setSummary(s);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/jps/login');
      return;
    }
    setMounted(true);
    refreshSummary(selectedYear, selectedMonth);
  }, [router, refreshSummary, selectedYear, selectedMonth]);

  function prevMonth() {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) return;
    if (selectedMonth === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  }

  function handleCSV() {
    if (!summary) return;
    exportCSV(summary);
    setExportMsg('CSV downloaded!');
    setTimeout(() => setExportMsg(''), 2500);
  }

  function handlePDF() {
    if (!summary) return;
    exportPDF(summary);
    setExportMsg('PDF opened for printing!');
    setTimeout(() => setExportMsg(''), 2500);
  }

  const now = new Date();
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  if (!mounted) return null;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="jps-header px-5 pt-safe-top pb-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/jps/dashboard')}
          className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Back"
        >
          <AppIcon name="ArrowLeftIcon" size={18} />
        </button>
        <div>
          <h1 className="text-white font-bold text-base">Attendance History</h1>
          <p className="text-white/50 text-xs">Job Punch System</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 py-5 gap-4 max-w-md mx-auto w-full">
        {/* Month Selector */}
        <div className="card-base p-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center active:scale-95 transition-transform text-[#003056]"
            aria-label="Previous month"
          >
            <AppIcon name="ChevronLeftIcon" size={18} />
          </button>
          <div className="text-center">
            <div className="font-bold text-[#003056] text-lg">{MONTH_NAMES[selectedMonth]}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{selectedYear}</div>
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 text-[#003056]"
            aria-label="Next month"
          >
            <AppIcon name="ChevronRightIcon" size={18} />
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card-base p-3 text-center">
              <div className="text-2xl font-bold text-[#003056] font-tabular">
                {summary.daysWorked}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Days</div>
            </div>
            <div className="card-base p-3 text-center">
              <div className="text-2xl font-bold text-[#f26322] font-tabular">
                {formatDuration(summary.totalMinutes)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Total</div>
            </div>
            <div className="card-base p-3 text-center">
              <div className="text-2xl font-bold text-[#003056] font-tabular">
                {summary.daysWorked > 0
                  ? formatDuration(Math.round(summary.totalMinutes / summary.daysWorked))
                  : '—'}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Avg/Day</div>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCSV}
            disabled={!summary || summary.days.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#003056] text-[#003056] font-semibold text-sm active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <AppIcon name="DocumentTextIcon" size={16} />
            Export CSV
          </button>
          <button
            onClick={handlePDF}
            disabled={!summary || summary.days.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f26322] text-white font-semibold text-sm active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <AppIcon name="DocumentArrowDownIcon" size={16} />
            Export PDF
          </button>
        </div>

        {/* Export feedback */}
        {exportMsg && (
          <div className="text-center text-sm text-[#16A34A] font-medium animate-fade-in-up">
            {exportMsg}
          </div>
        )}

        {/* Daily Records */}
        <div>
          <span className="section-label block mb-3">Daily Records</span>
          {summary && summary.days.length > 0 ? (
            <div className="space-y-2">
              {[...summary.days].reverse().map((day) => (
                <div key={day.date} className="card-base p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-[#003056] text-sm">
                        {formatDate(day.date)}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">{day.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-tabular font-bold text-[#f26322]">
                        {formatDuration(day.totalMinutes)}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {day.punchCount} punches
                      </div>
                    </div>
                  </div>
                  {(day.firstIn || day.lastOut) && (
                    <div className="flex gap-3 mt-2">
                      {day.firstIn && (
                        <div className="flex items-center gap-1.5 bg-[#F0FDF4] rounded-lg px-2.5 py-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          <span className="text-xs font-medium text-[#16A34A]">
                            In {formatTime(day.firstIn)}
                          </span>
                        </div>
                      )}
                      {day.lastOut && (
                        <div className="flex items-center gap-1.5 bg-[#FFF7F4] rounded-lg px-2.5 py-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f26322]" />
                          <span className="text-xs font-medium text-[#f26322]">
                            Out {formatTime(day.lastOut)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card-base p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center mx-auto mb-3 text-[var(--muted-foreground)]">
                <AppIcon name="CalendarIcon" size={22} />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                No records for {MONTH_NAMES[selectedMonth]} {selectedYear}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
