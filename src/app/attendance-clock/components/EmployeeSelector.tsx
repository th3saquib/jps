'use client';

import React from 'react';
import { Users } from 'lucide-react';
import type { Employee } from '../types/attendance';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelect: (id: string) => void;
}

export default function EmployeeSelector({
  employees,
  selectedEmployeeId,
  onSelect,
}: EmployeeSelectorProps) {
  return (
    <div className="card-base p-4">
      <label htmlFor="employee-select" className="section-label block mb-2">
        Select Employee
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Users size={18} />
        </div>
        <select
          id="employee-select"
          className="select-field pl-10"
          value={selectedEmployeeId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">— Choose your Employee ID —</option>
          {employees.map((emp) => (
            <option key={`emp-${emp.employeeId}`} value={emp.employeeId}>
              {emp.employeeId} — {emp.name} ({emp.department})
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {!selectedEmployeeId && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span>Select your ID to enable clock-in and clock-out.</span>
        </p>
      )}
    </div>
  );
}
