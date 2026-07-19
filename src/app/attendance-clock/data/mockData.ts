import type { Employee, OfficeConfig, AllowedNetwork } from '../types/attendance';

// Backend integration point: replace with API call GET /api/office/config
export const OFFICE_CONFIG: OfficeConfig = {
  latitude: 28.645668,
  longitude: 77.201187,
  radiusMeters: 50,
  name: 'Head Office — Connaught Place, New Delhi',
};

export const ALLOWED_NETWORKS: AllowedNetwork[] = [
  { ssid: 'Aprazer', name: 'Aprazer Office Wi-Fi', ipRange: '192.168.1.0/24' },
  { ssid: 'Aprazer-5G', name: 'Aprazer 5GHz Wi-Fi', ipRange: '192.168.1.0/24' },
  { ssid: 'Corp-Secure-NET', name: 'Corporate Secure Network', ipRange: '172.16.0.0/16' },
];

// Backend integration point: replace with API call GET /api/employees
// These are seeded employees; real data would come from your HR backend
export const EMPLOYEES: Employee[] = [
  {
    employeeId: 'EMP-001',
    name: 'Priya Sharma',
    role: 'Senior Software Engineer',
    department: 'Engineering',
    status: 'Out',
    history: [],
  },
  {
    employeeId: 'EMP-002',
    name: 'Rohan Mehta',
    role: 'Product Manager',
    department: 'Product',
    status: 'Out',
    history: [],
  },
  {
    employeeId: 'EMP-003',
    name: 'Ananya Iyer',
    role: 'UX Designer',
    department: 'Design',
    status: 'Out',
    history: [],
  },
  {
    employeeId: 'EMP-004',
    name: 'Karan Bhatia',
    role: 'DevOps Engineer',
    department: 'Infrastructure',
    status: 'Out',
    history: [],
  },
  {
    employeeId: 'EMP-005',
    name: 'Neha Kapoor',
    role: 'HR Business Partner',
    department: 'Human Resources',
    status: 'Out',
    history: [],
  },
  {
    employeeId: 'EMP-006',
    name: 'Aditya Verma',
    role: 'Business Analyst',
    department: 'Operations',
    status: 'Out',
    history: [],
  },
  {
    employeeId: 'EMP-007',
    name: 'Divya Nair',
    role: 'QA Engineer',
    department: 'Engineering',
    status: 'Out',
    history: [],
  },
  {
    employeeId: 'EMP-008',
    name: 'Siddharth Gupta',
    role: 'Finance Manager',
    department: 'Finance',
    status: 'Out',
    history: [],
  },
];
