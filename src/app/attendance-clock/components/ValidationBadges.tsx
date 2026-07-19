'use client';

import React from 'react';
import { MapPin, Wifi, RefreshCw, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { GpsState, NetworkState } from '../types/attendance';

const officeRadius = parseFloat(process.env.NEXT_PUBLIC_OFFICE_RADIUS || '50');

interface ValidationBadgesProps {
  gpsState: GpsState;
  networkState: NetworkState;
  onRetryNetwork: () => void;
}

function GpsBadge({ gpsState }: { gpsState: GpsState }) {
  const { status, distance, error } = gpsState;

  let badgeClass = 'badge-checking';
  let icon = <Loader2 size={15} className="animate-spin-slow text-info flex-shrink-0" />;
  let label = 'Checking GPS…';
  let detail = 'Acquiring location signal';

  if (status === 'verified') {
    badgeClass = 'badge-verified';
    icon = <CheckCircle2 size={15} className="text-success flex-shrink-0" />;
    label = 'GPS: Verified';
    detail = `${distance}m from office · within ${officeRadius}m range`;
  } else if (status === 'out_of_range') {
    badgeClass = 'badge-error';
    icon = <XCircle size={15} className="text-error flex-shrink-0" />;
    label = 'GPS: Out of Range';
    detail = error ?? `${distance}m away — move closer to the office`;
  } else if (status === 'error') {
    badgeClass = 'badge-error';
    icon = <AlertCircle size={15} className="text-error flex-shrink-0" />;
    label = 'GPS: Unavailable';
    detail = error ?? 'Unable to get location';
  } else if (status === 'idle') {
    badgeClass = 'badge-checking';
    icon = <Loader2 size={15} className="animate-spin-slow text-info flex-shrink-0" />;
    label = 'GPS: Starting…';
    detail = 'Initializing location services';
  }

  return (
    <div className={`rounded-xl px-3 py-3 flex items-start gap-2.5 ${badgeClass}`}>
      <MapPin size={15} className="flex-shrink-0 mt-0.5 opacity-70" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <p className="text-xs mt-0.5 opacity-80 leading-snug">{detail}</p>
      </div>
      {status === 'verified' && (
        <span className="flex-shrink-0">
          <span className="pulse-dot pulse-dot-green" />
        </span>
      )}
    </div>
  );
}

function NetworkBadge({
  networkState,
  onRetryNetwork,
}: {
  networkState: NetworkState;
  onRetryNetwork: () => void;
}) {
  const { status, networkName, error } = networkState;

  let badgeClass = 'badge-checking';
  let icon = <Loader2 size={15} className="animate-spin-slow text-info flex-shrink-0" />;
  let label = 'Checking Network…';
  let detail = 'Verifying office network connection';

  if (status === 'authorized') {
    badgeClass = 'badge-verified';
    icon = <CheckCircle2 size={15} className="text-success flex-shrink-0" />;
    label = 'Network: Authorized';
    detail = networkName ? `Connected to ${networkName}` : 'Office network verified';
  } else if (status === 'unauthorized') {
    badgeClass = 'badge-error';
    icon = <XCircle size={15} className="text-error flex-shrink-0" />;
    label = 'Network: Unauthorized';
    detail = error ?? 'Not connected to an office network';
  } else if (status === 'error') {
    badgeClass = 'badge-error';
    icon = <AlertCircle size={15} className="text-error flex-shrink-0" />;
    label = 'Network: Error';
    detail = error ?? 'Could not verify network';
  }

  return (
    <div className={`rounded-xl px-3 py-3 flex items-start gap-2.5 ${badgeClass}`}>
      <Wifi size={15} className="flex-shrink-0 mt-0.5 opacity-70" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <p className="text-xs mt-0.5 opacity-80 leading-snug">{detail}</p>
      </div>
      {status === 'authorized' && (
        <span className="flex-shrink-0">
          <span className="pulse-dot pulse-dot-green" />
        </span>
      )}
      {(status === 'unauthorized' || status === 'error') && (
        <button
          onClick={onRetryNetwork}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          aria-label="Retry network check"
          title="Retry network check"
        >
          <RefreshCw size={13} />
        </button>
      )}
    </div>
  );
}

export default function ValidationBadges({
  gpsState,
  networkState,
  onRetryNetwork,
}: ValidationBadgesProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="section-label px-1">Validation Status</p>
      <GpsBadge gpsState={gpsState} />
      <NetworkBadge networkState={networkState} onRetryNetwork={onRetryNetwork} />
    </div>
  );
}
