import React from 'react';
import { Clock, UserCheck, UserX, Timer } from 'lucide-react';
import type { Employee } from '../types/attendance';

interface HeroStatusProps {
  employee: Employee | null;
  totalHoursToday: string;
}

export default function HeroStatus({ employee, totalHoursToday }: HeroStatusProps) {
  if (!employee) {
    return (
      <div className="card-base p-5 flex flex-col items-center justify-center gap-2 min-h-[100px] text-center">
        <Clock size={28} className="text-muted-foreground" />
        <p className="font-semibold text-foreground text-base">No employee selected</p>
        <p className="text-sm text-muted-foreground">
          Choose your Employee ID above to see your status.
        </p>
      </div>
    );
  }

  const isIn = employee.status === 'In';

  return (
    <div
      className={`rounded-xl p-5 ${isIn ? 'hero-status-in' : 'hero-status-out'} animate-fade-in-up`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="section-label mb-1">
            {employee.employeeId} · {employee.department}
          </p>
          <h2 className="text-xl font-bold text-foreground truncate">{employee.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{employee.role}</p>
        </div>
        <div
          className={`flex flex-col items-center gap-1 flex-shrink-0 rounded-xl px-3 py-2 ${isIn ? 'bg-success/10 border border-success/30' : 'bg-error/10 border border-error/30'}`}
        >
          {isIn ? (
            <UserCheck size={22} className="text-success" />
          ) : (
            <UserX size={22} className="text-error" />
          )}
          <span
            className={`text-xs font-bold tracking-wide ${isIn ? 'text-success' : 'text-error'}`}
          >
            {isIn ? 'IN' : 'OUT'}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Timer size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Today&apos;s hours</span>
        </div>
        <span className="font-tabular font-bold text-sm text-foreground">{totalHoursToday}</span>
      </div>
    </div>
  );
}
