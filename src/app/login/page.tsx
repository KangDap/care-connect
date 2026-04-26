'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Logo } from '@/components/logo';
import { Modal } from '@/components/modal';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

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

interface IconProps {
  className?: string;
}

const LockIcon = ({ className }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ShieldIcon = ({ className }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UserCheckIcon = ({ className }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const HelpIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.66667"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7.5 6.66667C7.5 5.28613 8.61929 4.16667 10 4.16667C11.3807 4.16667 12.5 5.28613 12.5 6.66667C12.5 8.04721 11.3807 9.16667 10 9.16667V10.8333M10 14.1667H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" />
  </svg>
);

const FeatureCard = ({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) => (
  <div className="flex-1 h-[90px] bg-[#F7F3ED] border border-[#D0D5CB] rounded-[12px] flex flex-col items-center justify-center gap-2 p-4 text-center">
    <Icon className="text-[#8EA087] text-xl" />
    <span className="text-[14px] font-bold text-[#193C1F] leading-tight">
      {text}
    </span>
  </div>
);

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'login' | 'register' | 'forgot_password'
  >('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
          callbackURL: '/dashboard',
        });
        if (signInError) throw new Error(signInError.message);
      }
      router.push('/dashboard');
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
        callbackURL: '/dashboard',
      });

      if (error) throw new Error(error.message);
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="h-[80px] bg-[#F7F3ED] border-b border-[#D0D5CB] flex items-center justify-between px-[48px] sticky top-0 z-50">
        <Logo />
        <Button variant="outline" className="h-[44px]">
          <HelpIcon />
          <span>Help Center</span>
        </Button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex w-1/2 bg-[#EDE4D8] flex flex-col items-center justify-center p-16 relative overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[#F7F3ED] opacity-60 top-[-150px] right-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#F7F3ED] opacity-40 bottom-[-200px] left-[-150px]" />

          <div className="relative z-10 flex flex-col items-center max-w-[450px]">
            <div className="w-[96px] h-[96px] bg-[#F7F3ED] rounded-full flex items-center justify-center shadow-sm mb-10 text-[#193C1F]">
              <LockIcon className="w-10 h-10" />
            </div>

            <h1 className="text-[40px] font-bold text-[#193C1F] text-center leading-tight mb-6">
              Your privacy is our priority
            </h1>

            <p className="text-lg text-[#193C1F] text-center leading-relaxed opacity-80 mb-10">
              We provide a safe, encrypted environment for everyone. Choose to
              remain anonymous while receiving the support you need.
            </p>

            <div className="flex gap-6 w-full">
              <FeatureCard icon={ShieldIcon} text="End-to-End Encrypted" />
              <UserCheckIcon className="hidden" /> {/* Trigger layout only */}
              <FeatureCard icon={UserCheckIcon} text="Anonymous Options" />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 bg-white animate-fade-in">
          <div className="w-full max-w-[400px]">
            <div className="flex border-b border-[#D0D5CB] mb-12 relative h-[56px]">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setError('');
                    setSuccess('');
                  }}
                  className={`flex-1 flex justify-center items-center font-bold text-lg transition-all ${
                    activeTab === tab ||
                    (activeTab === 'forgot_password' && tab === 'login')
                      ? 'text-[#193C1F]'
                      : 'text-[#8EA087] opacity-60'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <div
                className="absolute bottom-0 h-1 bg-[#8EA087] transition-all duration-300 rounded-t-full w-1/2"
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
                activeTab === 'forgot_password'
                  ? handleForgotPassword
                  : handleSubmit
              }
            >
              {activeTab === 'forgot_password' ? (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <h2 className="text-xl font-bold text-[#193C1F] mb-4">
                    Reset Password
                  </h2>
                  <p className="text-sm text-[#193C1F] opacity-80 mb-6">
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
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
                  <button
                    type="button"
                    className="text-sm font-bold text-[#8EA087] hover:text-[#193C1F] transition-colors"
                    onClick={() => setActiveTab('login')}
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-fade-in">
                  {activeTab === 'register' && (
                    <Input
                      label="Username"
                      placeholder="Enter your username"
                      icon={<UserIcon />}
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
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
                        activeTab === 'register'
                          ? 'new-password'
                          : 'current-password'
                      }
                      required
                    />
                    {activeTab === 'login' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs font-bold text-[#8EA087] hover:text-[#193C1F] transition-colors mt-2"
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
                    <div className="flex-grow border-t border-[#D0D5CB]"></div>
                    <span className="flex-shrink-0 mx-4 text-[#8EA087] text-sm">
                      or
                    </span>
                    <div className="flex-grow border-t border-[#D0D5CB]"></div>
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
                </div>
              )}

              <p className="text-center text-[12px] text-[#193C1F] opacity-60 leading-relaxed mt-4">
                By {activeTab === 'register' ? 'registering' : 'logging in'},
                you agree to our{' '}
                <a
                  href="#"
                  className="text-[#D1B698] underline hover:text-[#c4a685]"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#"
                  className="text-[#D1B698] underline hover:text-[#c4a685]"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </main>

      <footer className="h-[64px] bg-[#F7F3ED] border-t border-[#D0D5CB] flex items-center justify-between px-[48px] opacity-60 text-[#193C1F] text-[12px]">
        <p>© 2026 CareConnect. Supporting resilience and safety.</p>
        <nav className="flex gap-8">
          {['Privacy Guide', 'Community Standards', 'Contact'].map((link) => (
            <a key={link} href="#" className="hover:underline no-underline">
              {link}
            </a>
          ))}
        </nav>
      </footer>

      {/* Modal / Popup for Reset Password Notification */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Check Your Email"
      >
        <p className="text-[#193C1F] text-base mb-6 opacity-80 leading-relaxed">
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
    </div>
  );
}
