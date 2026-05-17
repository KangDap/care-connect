'use client';

import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { useTranslation } from '@/components/providers/i18n-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { authClient } from '@/lib/auth/auth-client';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

function PublicHeaderContent() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;
  const userRole = (session?.user as { role?: string })?.role;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();

  const fromDashboard = searchParams.get('from') === 'dashboard';

  // Helper function to check if the path is active
  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-[#f7f3ed]/90 backdrop-blur-md py-6 px-12 flex justify-between items-center border-b border-[#d0d5cb]">
      <Logo size={40} />

      {fromDashboard ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-bold text-[#193c1f] md:inline">
            Back to Dashboard
          </span>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="icon-button back-icon-button h-11 w-11 rounded-full p-0"
            aria-label="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </Button>
        </div>
      ) : (
        <>
          <nav className="flex items-center gap-12 text-[#193c1f] font-medium hidden md:flex">
            <Link
              href="/"
              className={`transition-colors ${isActive('/') ? 'text-[#8ea087] font-bold border-b-2 border-[#8ea087] pb-1' : 'hover:text-[#8ea087]'}`}
            >
              {t('header.home')}
            </Link>
            {userRole === 'PSYCHOLOGIST' ? (
              <span
                className="text-[#193c1f] opacity-50 cursor-not-allowed transition-colors"
                title="Psychologists cannot create consultations"
              >
                Consultation
              </span>
            ) : (
              <Link
                href={isLoggedIn ? '/consultation' : '/login'}
                className={`transition-colors ${isActive('/consultation') ? 'text-[#8ea087] font-bold border-b-2 border-[#8ea087] pb-1' : 'hover:text-[#8ea087]'}`}
              >
                Consultation
              </Link>
            )}
            <Link
              href={isLoggedIn ? '/publicreports' : '/login'}
              className={`transition-colors ${isActive('/publicreports') ? 'text-[#8ea087] font-bold border-b-2 border-[#8ea087] pb-1' : 'hover:text-[#8ea087]'}`}
            >
              {t('header.publicReports')}
            </Link>
            <Link
              href={isLoggedIn ? '/report' : '/login'}
              className={`transition-colors ${isActive('/report') ? 'text-[#8ea087] font-bold border-b-2 border-[#8ea087] pb-1' : 'hover:text-[#8ea087]'}`}
            >
              Report
            </Link>
            <Link
              href={isLoggedIn ? '/forums' : '/login'}
              className={`transition-colors ${
                isActive('/forums')
                  ? 'text-[#8ea087] font-bold border-b-2 border-[#8ea087] pb-1'
                  : 'hover:text-[#8ea087]'
              }`}
            >
              Forum
            </Link>

            <Link
              href={isLoggedIn ? '/donation' : '/login'}
              className={`transition-colors ${
                isActive('/donation')
                  ? 'text-[#8ea087] font-bold border-b-2 border-[#8ea087] pb-1'
                  : 'hover:text-[#8ea087]'
              }`}
            >
              {t('header.donate')}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              variant="outline"
              className="rounded-md border-[#193c1f] px-2 py-1 text-xs text-[#193c1f] hover:bg-[#193c1f] hover:text-[#f7f3ed]"
            >
              {language === 'en' ? 'ID' : 'EN'}
            </Button>

            <ThemeToggle />

            <Link href={isLoggedIn ? '/dashboard' : '/login'}>
              <Button variant="secondary" className="rounded-lg px-8 py-2.5">
                {isLoggedIn ? t('header.dashboard') : t('header.login')}
              </Button>
            </Link>
          </div>
        </>
      )}
    </header>
  );
}

export function PublicHeader() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-[100] h-[92px] w-full bg-[#f7f3ed]/90 border-b border-[#d0d5cb]" />
      }
    >
      <PublicHeaderContent />
    </Suspense>
  );
}
