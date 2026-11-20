'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Modal } from '@/components/modal';
import { useTranslation } from '@/components/providers/i18n-provider';
import { authClient } from '@/lib/auth/auth-client';
import { registrationEnabled } from '@/lib/auth/auth-mode';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { AuthLayout } from './AuthLayout';
import { PausLogin } from './PausLogin';

// ==========================================
// 1. SUB-KOMPONEN INTERNAL (IKON-IKON)
// ==========================================

const MailIcon = () => (
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
    <path d="m22 2-10 11L2 2" />
    <path d="M22 2H2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V2z" />
  </svg>
);

const UserIcon = () => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

/**
 * /login has two modes, chosen by NEXT_PUBLIC_REGISTRATION_ENABLED
 * (see src/lib/auth/auth-mode.ts): the full CareConnect login and register
 * page, or PAuS-only login for the Unpad environment.
 */
export default function LoginPage() {
  return registrationEnabled ? <EmailLoginPage /> : <PausLoginPage />;
}

function PausLoginPage() {
  return (
    <AuthLayout>
      <PausLogin />
    </AuthLayout>
  );
}

function EmailLoginPage() {
  const router = useRouter();
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    'login' | 'register' | 'forgot_password'
  >('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (activeTab === 'register') {
        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          username,
          password,
          callbackURL: '/login?verified=1',
        });
        if (signUpError) throw new Error(signUpError.message);

        setSuccess(
          'Registration successful. Please check your email to verify your account before logging in.',
        );
        setActiveTab('login');
        setPassword('');
        return;
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) throw new Error(signInError.message);

        const { data: session } = await authClient.getSession();

        if (session?.user) {
          router.push('/');
        } else {
          // Fallback jika session tidak langsung terbaca
          router.push('/');
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Email not verified') {
          setError(
            'Your email is not verified yet. Please check your inbox and verify your account first.',
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: requestError } = await authClient.requestPasswordReset({
        email,
        redirectTo,
      });

      if (requestError) {
        throw new Error(requestError.message);
      }

      setSuccess(
        'If the email is registered, a password reset link has been sent.',
      );
      setIsResetModalOpen(true);
      setActiveTab('login');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to request password reset. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });

      if (error) throw new Error(error.message);
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      overlay={
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="Check Your Email"
        >
          <p className="text-[#193c1f] text-base mb-6 opacity-80 leading-relaxed">
            A password reset link has been sent to{' '}
            <span className="font-bold">{email || 'your email'}</span>. Please
            check your inbox and spam folder.
          </p>
          <Button
            onClick={() => setIsResetModalOpen(false)}
            variant="secondary"
            className="w-full h-12"
          >
            Got it
          </Button>
        </Modal>
      }
    >
      <div className="relative mb-8 flex h-[56px] border-b border-[#d0d5cb] sm:mb-12">
        {(['login', 'register'] as const).map((tab) => (
          <Button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setError('');
              setSuccess('');
            }}
            variant="ghost"
            className={`flex-1 justify-center py-0 text-lg normal-case tracking-normal ${
              activeTab === tab ||
              (activeTab === 'forgot_password' && tab === 'login')
                ? 'text-[#193c1f]'
                : 'text-[#8ea087] opacity-60'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
        <div
          className="absolute bottom-0 h-1 bg-[#8ea087] transition-all duration-300 rounded-t-full w-1/2"
          style={{
            left:
              activeTab === 'login' || activeTab === 'forgot_password'
                ? '0%'
                : '50%',
          }}
        />
      </div>

      <form
        className="space-y-6"
        onSubmit={
          activeTab === 'forgot_password' ? handleForgotPassword : handleSubmit
        }
      >
        {activeTab === 'forgot_password' ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-xl font-bold text-[#193c1f] mb-4">
              Reset Password
            </h2>
            <p className="text-sm text-[#193c1f] opacity-80 mb-6">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={<MailIcon />}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
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
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="py-0 text-sm normal-case tracking-normal"
              onClick={() => setActiveTab('login')}
            >
              Back to login
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in">
            {activeTab === 'register' && (
              <Input
                label="Username"
                placeholder="Enter your username"
                icon={<UserIcon />}
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={<MailIcon />}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<SmallLockIcon />}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                autoComplete={
                  activeTab === 'register' ? 'new-password' : 'current-password'
                }
                required
              />
              {activeTab === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-[#8ea087] hover:text-[#193c1f] hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors"
                    onClick={() => setActiveTab('forgot_password')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

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
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : activeTab === 'register'
                  ? 'Create Account'
                  : 'Login'}
            </Button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#d0d5cb]"></div>
              <span className="flex-shrink-0 mx-4 text-[#8ea087] text-sm">
                or
              </span>
              <div className="flex-grow border-t border-[#d0d5cb]"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 flex items-center justify-center gap-2"
              onClick={handleGoogleOAuth}
              disabled={googleLoading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.99.69-2.26 1.11-3.71 1.11-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.11c-.22-.69-.35-1.43-.35-2.11s.13-1.42.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
                  fill="#EA4335"
                />
              </svg>
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <div className="text-center text-[12px] text-[#193c1f] opacity-60 mt-4 leading-relaxed font-medium">
              {activeTab === 'login' ? (
                <>
                  {language === 'en'
                    ? "Don't have an account? "
                    : 'Belum punya akun? '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[#8ea087] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer transition-all duration-200"
                  >
                    {language === 'en' ? 'Register' : 'Daftar'}
                  </button>
                </>
              ) : (
                <>
                  {language === 'en'
                    ? 'Already have an account? '
                    : 'Sudah punya akun? '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[#8ea087] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer transition-all duration-200"
                  >
                    {language === 'en' ? 'Login' : 'Masuk'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-[12px] text-[#193c1f] opacity-60 leading-relaxed mt-4">
          By {activeTab === 'register' ? 'registering' : 'logging in'}, you
          agree to our{' '}
          <a
            href="/terms"
            className="text-[#d1b698] underline hover:text-[#c4a685]"
          >
            Terms of Service
          </a>
          {' and '}
          <a
            href="/privacy"
            className="text-[#d1b698] underline hover:text-[#c4a685]"
          >
            Privacy Policy
          </a>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
