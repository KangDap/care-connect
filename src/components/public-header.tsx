'use client';

import { Button } from '@/components/button';
import { LanguageToggle } from '@/components/language-toggle';
import { Logo } from '@/components/logo';
import { useTranslation } from '@/components/providers/i18n-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { authClient } from '@/lib/auth/auth-client';
import { ChevronLeft, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

function createPublicNavLinks(
  isLoggedIn: boolean,
  labels: Record<string, string>,
) {
  const protectedHref = (path: string) => (isLoggedIn ? path : '/login');
  const links = [
    { href: '/', activePath: '/', label: labels.home },
    {
      href: protectedHref('/publicreports'),
      activePath: '/publicreports',
      label: labels.publicReports,
    },
    {
      href: protectedHref('/report'),
      activePath: '/report',
      label: labels.report,
    },
    {
      href: protectedHref('/forums'),
      activePath: '/forums',
      label: labels.forum,
    },
  ];
  if (paymentEnabled) {
    links.push({
      href: protectedHref('/donation'),
      activePath: '/donation',
      label: labels.donate,
    });
  } else {
    links.push({
      href: '/campaign',
      activePath: '/campaign',
      label: labels.campaign,
    });
  }
  return links;
}

function isPathActive(pathname: string, path: string) {
  return !(path === '/' && pathname !== '/') && pathname.startsWith(path);
}

function getNavLinkClass(pathname: string, path: string) {
  return `transition-colors ${
    isPathActive(pathname, path)
      ? 'text-[#8ea087] font-bold border-b-2 border-[#8ea087] pb-1'
      : 'hover:text-[#8ea087]'
  }`;
}

function getAccountLink(
  isLoggedIn: boolean,
  dashboardLabel: string,
  loginLabel: string,
) {
  return {
    href: isLoggedIn ? '/dashboard' : '/login',
    label: isLoggedIn ? dashboardLabel : loginLabel,
  };
}

function getMobileMenuControl(isOpen: boolean) {
  return {
    label: isOpen ? 'Close menu' : 'Open menu',
    icon: isOpen ? <X size={18} /> : <Menu size={18} />,
  };
}

function PublicHeaderContent() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;
  const userRole = (session?.user as { role?: string })?.role;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fromDashboard = searchParams.get('from') === 'dashboard';

  const navLinks = createPublicNavLinks(isLoggedIn, {
    home: t('header.home'),
    publicReports: t('header.publicReports'),
    report: t('header.report'),
    forum: t('header.forum'),
    donate: t('header.donate'),
    campaign: t('header.campaign'),
  });
  const accountLink = getAccountLink(
    isLoggedIn,
    t('header.dashboard'),
    t('header.login'),
  );
  const mobileMenuControl = getMobileMenuControl(isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[#d0d5cb] bg-[#f7f3ed]/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-12">
      <div className="flex items-center justify-between gap-3">
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
            <nav className="hidden items-center gap-8 text-[#193c1f] font-medium xl:flex 2xl:gap-12">
              <Link href="/" className={getNavLinkClass(pathname, '/')}>
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
                  className={getNavLinkClass(pathname, '/consultation')}
                >
                  {t('header.consultation')}
                </Link>
              )}
              {navLinks.slice(1).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={getNavLinkClass(pathname, link.activePath)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageToggle compact />
              <ThemeToggle />

              <Link href={accountLink.href} className="hidden sm:block">
                <Button
                  variant="secondary"
                  className="rounded-lg px-5 py-2.5 md:px-8"
                >
                  {accountLink.label}
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="icon-button h-10 w-10 rounded-full p-0 xl:hidden"
                aria-label={mobileMenuControl.label}
              >
                {mobileMenuControl.icon}
              </Button>
            </div>
          </>
        )}
      </div>

      {!fromDashboard && isMobileMenuOpen && (
        <div className="mt-4 rounded-2xl border border-[#d0d5cb] bg-white p-3 shadow-xl xl:hidden">
          <nav className="flex flex-col gap-1 text-sm font-bold text-[#193c1f]">
            {userRole !== 'PSYCHOLOGIST' && (
              <Link
                href={isLoggedIn ? '/consultation' : '/login'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 hover:bg-[#f7f3ed]"
              >
                {t('header.consultation')}
              </Link>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 hover:bg-[#f7f3ed]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={accountLink.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-xl bg-[#193c1f] px-4 py-3 text-center text-[#f7f3ed]"
            >
              {accountLink.label}
            </Link>
          </nav>
        </div>
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
