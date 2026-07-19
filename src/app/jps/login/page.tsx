'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPin, setAuthenticated, isAuthenticated } from '../utils/jpsUtils';
import AppLogo from '@/components/ui/AppLogo';

export default function JPSLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      router.replace('/jps/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      inputRef.current?.focus();
    }
  }, [mounted]);

  function handlePinInput(digit: string) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      setTimeout(async () => {
        const isValid = await verifyPin(next);
        if (isValid) {
          setAuthenticated(true);
          router.push('/jps/dashboard');
        } else {
          setShake(true);
          setError('Incorrect PIN. Try again.');
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 600);
        }
      }, 120);
    }
  }

  function handleDelete() {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }

  function handleClear() {
    setPin('');
    setError('');
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  if (!mounted) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center jps-header-gradient px-6">
      {/* Logo / Brand */}
      <div className="mb-10 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20 mb-4 text-[#f26322]">
          <AppLogo size={40} />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Job Punch System</h1>
      </div>

      {/* PIN Card */}
      <div className="w-full max-w-xs">
        <p className="text-white/70 text-center text-sm mb-6">Enter your 4-digit PIN</p>

        {/* PIN Dots */}
        <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? 'bg-[#f26322] border-[#f26322] scale-110'
                  : 'bg-transparent border-white/40'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-[#f26322] text-center text-sm mb-4 animate-fade-in-up">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((d, i) => {
            if (d === '') return <div key={i} />;
            if (d === 'del') {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  className="h-16 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Delete"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="18"
                      y1="9"
                      x2="12"
                      y2="15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="9"
                      x2="18"
                      y2="15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handlePinInput(d)}
                className="h-16 rounded-2xl bg-white/10 border border-white/15 text-white text-2xl font-semibold active:scale-95 active:bg-white/20 transition-all"
              >
                {d}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleClear}
          className="w-full mt-4 py-3 text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
