export type EmployeeStatus = 'In' | 'Out';

export type GpsStatus = 'idle' | 'checking' | 'verified' | 'out_of_range' | 'error';
export type NetworkStatus = 'idle' | 'checking' | 'authorized' | 'unauthorized' | 'error';

export interface AttendanceRecord {
  id: string;
  action: 'in' | 'out';
  timestamp: string; // ISO 8601
  coords: { lat: number; lng: number } | null;
  networkName: string | null;
  distanceFromOffice: number | null;
}

export interface Employee {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  history: AttendanceRecord[];
}

export interface GpsState {
  status: GpsStatus;
  distance: number | null; // meters
  coords: { lat: number; lng: number; accuracy: number } | null;
  error: string | null;
}

export interface NetworkState {
  status: NetworkStatus;
  networkName: string | null;
  error: string | null;
}

export interface ToastMessage {
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
}

export interface OfficeConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  name: string;
}

export interface AllowedNetwork {
  ssid: string;
  name: string;
  ipRange?: string;
}
