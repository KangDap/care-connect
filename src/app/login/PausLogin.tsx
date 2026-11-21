'use client';

import { Button } from '@/components/button';
import { authClient } from '@/lib/auth/auth-client';
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
      const result = await authClient.signIn.social({
        provider: PAUS_PROVIDER_ID,
        // Redirect back to the page the user was on (or root if unknown)
        callbackURL: `${window.location.origin}${window.location.pathname}`,
      });
      if (result?.error) {
        throw new Error(result.error.message || 'PAuS unavailable');
      }
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      console.error('PAuS Sign-In Error:', err);
      const message =
        err instanceof Error && err.message !== 'PAuS unavailable'
          ? err.message
          : 'PAuS sign-in is not available right now. Please try again later or contact the administrator.';
      setError(message);
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

      <p
        suppressHydrationWarning
        className="text-center text-[12px] text-[#193c1f] opacity-60 leading-relaxed"
      >
        <span>By logging in, you agree to our </span>
        <a
          href="/terms"
          className="text-[#d1b698] underline hover:text-[#c4a685]"
        >
          Terms of Service
        </a>
        <span> and </span>
        <a
          href="/privacy"
          className="text-[#d1b698] underline hover:text-[#c4a685]"
        >
          Privacy Policy
        </a>
        <span>.</span>
      </p>
    </div>
  );
}
