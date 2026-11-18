'use client';

import { Button } from '@/components/button';
import { PAUS_PROVIDER_ID } from '@/lib/auth/auth-mode';
import { ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';

import { AdminLogin } from './AdminLogin';

/**
 * Login panel for the Unpad environment (NEXT_PUBLIC_REGISTRATION_ENABLED=false):
 * "Sign in with PAuS" for the academic community, plus a username/password
 * form for administrators and psychologists (AdminLogin). No registration.
 * PAuS requires the backend to register a Better Auth genericOAuth provider
 * with ID "paus"; until then the button shows an error message.
 */
export function PausLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePausLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Better Auth genericOAuth endpoint. Called directly so the shared
      // authClient does not need an extra plugin.
      const response = await fetch('/api/auth/sign-in/oauth2', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: PAUS_PROVIDER_ID,
          callbackURL: '/',
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        url?: string;
      } | null;
      if (!response.ok || !data?.url) throw new Error('PAuS unavailable');
      // Hand over to the PAuS login page; keep the loading state meanwhile.
      window.location.href = data.url;
    } catch {
      setError(
        'PAuS sign-in is not available right now. Please try again later or contact the administrator.',
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f3ed] text-[#193c1f]">
        <ShieldCheck size={28} strokeWidth={2} />
      </div>

      <div className="space-y-3">
        <h2 className="text-[28px] font-bold leading-tight text-[#193c1f]">
          Welcome to CareConnect
        </h2>
        <p className="text-base leading-relaxed text-[#193c1f] opacity-80">
          A safe space for the Universitas Padjadjaran academic community to
          report, consult, and support each other.
        </p>
      </div>

      <p className="text-sm leading-relaxed text-[#193c1f] opacity-70">
        Sign in with your PAuS ID Universitas Padjadjaran account.
      </p>

      {error && (
        <p
          className="text-red-500 text-sm text-center font-medium"
          role="alert"
        >
          {error}
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        className="w-full h-14"
        onClick={handlePausLogin}
        disabled={loading}
      >
        {loading ? 'Redirecting to PAuS...' : 'Sign in with PAuS'}
      </Button>

      <p className="text-center text-sm font-medium text-[#8ea087]">
        Only for the Universitas Padjadjaran academic community.
      </p>

      <AdminLogin />

      <p className="text-center text-[12px] text-[#193c1f] opacity-60 leading-relaxed">
        By {'logging in'}, you agree to our{' '}
        <a href="#" className="text-[#d1b698] underline hover:text-[#c4a685]">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-[#d1b698] underline hover:text-[#c4a685]">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
