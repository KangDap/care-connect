'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { authClient } from '@/lib/auth/auth-client';
import { KeyRound, Mail, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

/** Roles allowed to use the administrator form in PAuS-only mode. */
export const STAFF_ROLES = ['ADMIN', 'PSYCHOLOGIST'];

/** Signs in with email when the identifier contains "@", otherwise with username. */
export const isEmailIdentifier = (value: string) => value.includes('@');

/**
 * Username/password login for administrators and psychologists, shown under
 * the PAuS button when NEXT_PUBLIC_REGISTRATION_ENABLED=false. Their accounts
 * are not PAuS accounts, so they keep the existing Better Auth login.
 */
export function AdminLogin() {
  const router = useRouter();
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const value = identifier.trim();
      const { error: signInError } = isEmailIdentifier(value)
        ? await authClient.signIn.email({ email: value, password })
        : await authClient.signIn.username({ username: value, password });
      if (signInError) throw new Error(signInError.message);

      const { data: session } = await authClient.getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (!role || !STAFF_ROLES.includes(role)) {
        // Regular users must use PAuS in this environment.
        await authClient.signOut();
        setError(
          'This form is only for administrators and psychologists. Please sign in with PAuS.',
        );
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error && err.message === 'Email not verified') {
        setError(
          'Your email is not verified yet. Please check your inbox and verify your account first.',
        );
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email: resetEmail.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (requestError) throw new Error(requestError.message);
      setSuccess(
        'If the email is registered, a password reset link has been sent.',
      );
    } catch {
      setError('Failed to send the reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="Administrator login" className="flex flex-col gap-4">
      <div className="mx-auto h-px w-12 bg-[#d0d5cb]" />
      <p className="text-center text-sm font-medium text-[#193c1f] opacity-80">
        For Administrator:
      </p>

      {view === 'login' ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            placeholder="Username or email"
            aria-label="Username or email"
            icon={<User size={18} />}
            value={identifier}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIdentifier(e.target.value)
            }
            autoComplete="username"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            aria-label="Password"
            icon={<KeyRound size={18} />}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            autoComplete="current-password"
            required
          />
          {error && (
            <p
              className="text-red-500 text-sm text-center font-medium"
              role="alert"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            className="w-full h-12"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Login as Administrator'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setView('forgot');
              setError('');
            }}
            className="text-center text-sm font-semibold text-[#8ea087] underline hover:text-[#193c1f] bg-transparent border-none p-0 cursor-pointer"
          >
            Forgot your username or password?
          </button>
        </form>
      ) : (
        <form onSubmit={handleForgot} className="flex flex-col gap-4">
          <p className="text-center text-sm text-[#193c1f] opacity-70">
            Enter your account email. We will send a link to reset your
            password. If you forgot your username, sign in with your email
            instead.
          </p>
          <Input
            type="email"
            placeholder="name@example.com"
            aria-label="Email address"
            icon={<Mail size={18} />}
            value={resetEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setResetEmail(e.target.value)
            }
            required
          />
          {error && (
            <p
              className="text-red-500 text-sm text-center font-medium"
              role="alert"
            >
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
            variant="outline"
            className="w-full h-12"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setView('login');
              setError('');
              setSuccess('');
            }}
            className="text-center text-sm font-semibold text-[#8ea087] hover:text-[#193c1f] hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            Back to login
          </button>
        </form>
      )}
    </section>
  );
}
