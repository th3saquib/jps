import React from 'react';
import { ClipboardList, LogIn, LogOut, MapPin, Wifi } from 'lucide-react';
import { formatTimestamp, formatTime } from '../utils/attendanceUtils';
import type { AttendanceRecord } from '../types/attendance';

interface AttendanceLedgerProps {
  records: AttendanceRecord[];
  employeeName: string | null;
  totalHoursToday: string;
}

function LedgerRow({ record, index }: { record: AttendanceRecord; index: number }) {
  const isIn = record.action === 'in';

  return (
    <div
      className={`card-base px-3 py-3 ${isIn ? 'ledger-row-in' : 'ledger-row-out'} animate-fade-in-up`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${isIn ? 'bg-success/10' : 'bg-error/10'}`}
          >
            {isIn ? (
              <LogIn size={14} className="text-success" />
            ) : (
              <LogOut size={14} className="text-error" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`font-bold text-sm ${isIn ? 'text-success' : 'text-error'}`}>
              {isIn ? 'Clock In' : 'Clock Out'}
            </span>
            <p className="font-tabular text-xs text-muted-foreground leading-tight">
              {formatTimestamp(record.timestamp)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="font-tabular font-bold text-sm text-foreground">
            {formatTime(record.timestamp)}
          </span>
          {record.distanceFromOffice !== null && record.distanceFromOffice !== undefined && (
            <span className="flex items-center gap-0.5 text-2xs text-muted-foreground">
              <MapPin size={9} />
              {record.distanceFromOffice}m
            </span>
          )}
        </div>
      </div>

      {record.networkName && (
        <div className="mt-1.5 flex items-center gap-1 text-2xs text-muted-foreground">
          <Wifi size={9} className="flex-shrink-0" />
          <span className="truncate">{record.networkName}</span>
        </div>
      )}
    </div>
  );
}

export default function AttendanceLedger({
  records,
  employeeName,
  totalHoursToday,
}: AttendanceLedgerProps) {
  const today = new Date();
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
  const dateLabel = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <ClipboardList size={14} className="text-muted-foreground" />
          <span className="section-label">Today&apos;s Attendance — {dateLabel}</span>
        </div>
        {records.length > 0 && (
          <span className="font-tabular text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {totalHoursToday}
          </span>
        )}
      </div>

      {!employeeName ? (
        <div className="card-base p-6 flex flex-col items-center justify-center gap-2 text-center">
          <ClipboardList size={28} className="text-muted-foreground opacity-50" />
          <p className="font-medium text-sm text-muted-foreground">No employee selected</p>
          <p className="text-xs text-muted-foreground opacity-70">
            Select your Employee ID to view today&apos;s attendance log.
          </p>
        </div>
      ) : records.length === 0 ? (
        <div className="card-base p-6 flex flex-col items-center justify-center gap-2 text-center">
          <ClipboardList size={28} className="text-muted-foreground opacity-50" />
          <p className="font-medium text-sm text-foreground">No records yet today</p>
          <p className="text-xs text-muted-foreground">
            {employeeName}&apos;s clock-in and clock-out events will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {records.map((record, i) => (
            <LedgerRow key={`ledger-${record.id}`} record={record} index={i} />
          ))}
          <div className="card-base px-3 py-2.5 flex items-center justify-between bg-secondary/50">
            <span className="text-xs text-muted-foreground">Total events today</span>
            <span className="font-tabular font-semibold text-sm text-foreground">
              {records.length} event{records.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
