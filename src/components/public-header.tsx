'use client';

import { Button } from '@/components/button';
import { useTranslation } from '@/components/providers/i18n-provider';
import { authClient } from '@/lib/auth/auth-client';
import { ChevronLeft, Moon } from 'lucide-react';
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
      <Link
        href="/"
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <div className="w-10 h-10 bg-[#193c1f] rounded-lg flex items-center justify-center text-[#f7f3ed]">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.744c0 5.578 4.5 10.13 10.125 10.13 5.625 0 10.125-4.552 10.125-10.13 0-1.494-.273-2.925-.77-4.244a11.959 11.959 0 0 1-8.355-3.212Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </div>
        <span className="text-2xl font-bold text-[#193c1f]">CareConnect</span>
      </Link>

      {fromDashboard ? (
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-[#193c1f] hover:text-[#8ea087]"
        >
          <ChevronLeft size={20} />
          Back to Dashboard
        </Button>
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

            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 rounded-full border-[#d0d5cb] p-0 text-[#193c1f] hover:bg-[#d0d5cb]/50"
              title="Dark Mode (Coming Soon)"
            >
              <Moon className="h-4 w-4" />
            </Button>

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
