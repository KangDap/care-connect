'use client';

import { Card } from '@/components/card';
import { LanguageToggle } from '@/components/language-toggle';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import React from 'react';

// Icons and decorative panel shared by both login modes. Markup moved
// unchanged from the original login page.

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

const FeatureCard = ({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) => (
  <Card className="flex h-[90px] flex-1 flex-col items-center justify-center gap-2 rounded-[12px] bg-[#f7f3ed] p-4 text-center">
    <Icon className="text-[#8ea087] text-xl" />
    <span className="text-[14px] font-bold text-[#193c1f] leading-tight">
      {text}
    </span>
  </Card>
);

/**
 * Page frame for /login: header, decorative left panel, footer. `children`
 * fills the right column; `overlay` is rendered after the frame (modals).
 */
export function AuthLayout({
  children,
  overlay,
}: Readonly<{
  children: React.ReactNode;
  overlay?: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-50 flex min-h-[72px] items-center justify-between gap-3 border-b border-[#d0d5cb] bg-[#f7f3ed] px-4 py-3 sm:px-6 lg:h-[80px] lg:px-12">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle compact />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-visible lg:flex-row lg:overflow-hidden">
        <div className="hidden lg:flex w-1/2 bg-[#ede4d8] flex flex-col items-center justify-center p-16 relative overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[#f7f3ed] opacity-60 top-[-150px] right-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#f7f3ed] opacity-40 bottom-[-200px] left-[-150px]" />

          <div className="relative z-10 flex flex-col items-center max-w-[450px]">
            <div className="w-[96px] h-[96px] bg-[#f7f3ed] rounded-full flex items-center justify-center shadow-sm mb-10 text-[#193c1f]">
              <LockIcon className="w-10 h-10" />
            </div>

            <h1 className="text-[40px] font-bold text-[#193c1f] text-center leading-tight mb-6">
              Your privacy is our priority
            </h1>

            <p className="text-lg text-[#193c1f] text-center leading-relaxed opacity-80 mb-10">
              We provide a safe and secure space for everyone. Choose to remain
              anonymous while receiving the support you need.
            </p>

            <div className="flex gap-6 w-full">
              <FeatureCard icon={ShieldIcon} text="Forum Chat Community" />
              <UserCheckIcon className="hidden" /> {/* Trigger layout only */}
              <FeatureCard icon={UserCheckIcon} text="Anonymous Options" />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-center bg-white p-4 py-8 animate-fade-in sm:p-8 lg:w-1/2 lg:p-16">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </main>

      <footer className="flex min-h-[64px] flex-col items-center justify-between gap-3 border-t border-[#d0d5cb] bg-[#f7f3ed] px-4 py-4 text-center text-[12px] text-[#193c1f] opacity-60 sm:px-6 md:flex-row md:text-left lg:px-12">
        <p>© 2026 CareConnect. Supporting resilience and safety.</p>
      </footer>

      {overlay}
    </div>
  );
}
