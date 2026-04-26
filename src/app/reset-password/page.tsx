'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Logo } from '@/components/logo';
import { authClient } from '@/lib/auth/auth-client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

const SmallLockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const tokenError = searchParams.get('error');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tokenMessage = useMemo(() => {
    if (!tokenError) return '';

    if (
      tokenError.toUpperCase() === 'INVALID_TOKEN' ||
      tokenError.toLowerCase() === 'invalid_token'
    ) {
      return 'Reset password link is invalid or expired. Please request a new link.';
    }

    return 'Unable to validate reset password link. Please request a new one.';
  }, [tokenError]);

  const isTokenValid = Boolean(token) && !tokenError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!token) {
      setError(
        'Missing reset token. Please request a new reset password link.',
      );
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        token,
        newPassword,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess('Password updated successfully. Redirecting to login...');

      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password. Please request a new link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3ED] flex flex-col">
      <header className="h-[80px] bg-[#F7F3ED] border-b border-[#D0D5CB] flex items-center justify-between px-6 lg:px-12">
        <Logo />
        <Link
          href="/login"
          className="text-sm font-bold text-[#193C1F] hover:underline"
        >
          Back to login
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[460px] rounded-[24px] bg-white border border-[#D0D5CB] p-8 lg:p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-[#193C1F] mb-2">
            Set New Password
          </h1>
          <p className="text-sm text-[#193C1F]/70 mb-8">
            Enter your new password to finish resetting your account access.
          </p>

          {tokenMessage && (
            <p className="text-red-500 text-sm text-center font-medium mb-6">
              {tokenMessage}
            </p>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              icon={<SmallLockIcon />}
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              autoComplete="new-password"
              required
              disabled={!isTokenValid || loading}
              minLength={8}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat your password"
              icon={<SmallLockIcon />}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              autoComplete="new-password"
              required
              disabled={!isTokenValid || loading}
              minLength={8}
            />

            {error && (
              <p className="text-red-500 text-sm text-center font-medium">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-600 text-sm text-center font-medium">
                {success}
              </p>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="w-full h-14"
              disabled={!isTokenValid || loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>

            {!isTokenValid && (
              <Link
                href="/login"
                className="block text-center text-sm font-bold text-[#8EA087] hover:text-[#193C1F] transition-colors"
              >
                Request new reset link from login page
              </Link>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
