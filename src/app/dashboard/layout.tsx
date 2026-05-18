'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { Logo } from '@/components/logo';
import { authClient } from '@/lib/auth/auth-client';
import {
  BrainCircuit,
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  ShieldAlert,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

// ==========================================
// --- SUB-KOMPONEN SIDEBAR ITEM ---
// ==========================================
type SidebarItemProps = {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
  isDark: boolean;
};

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active,
  isDark,
}: SidebarItemProps) => (
  <Link href={href} className="no-underline">
    <div
      data-active={active}
      className={`dashboard-sidebar-item flex items-center gap-3 px-8 py-4 cursor-pointer transition-all duration-200 group ${active ? 'font-bold border-r-4' : 'opacity-60 hover:opacity-100'}`}
      style={{
        backgroundColor: active
          ? isDark
            ? '#203026'
            : '#EBE6DE'
          : 'transparent',
        borderRightColor: active
          ? isDark
            ? '#b9c8b1'
            : '#193c1f'
          : 'transparent',
        color: isDark ? '#f7f3ed' : '#193c1f',
      }}
    >
      <div
        className={`dashboard-sidebar-icon ${active ? '' : 'group-hover:scale-110 transition-transform'}`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[14px] tracking-wide">{label}</span>
    </div>
  </Link>
);

// ==========================================
// --- MAIN LAYOUT ---
// ==========================================
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ||
      localStorage.getItem('careconnect-theme') === 'dark'
      ? 'dark'
      : 'light';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // LOGIKA DETEKSI HALAMAN (Berdasarkan Folder)
  const isAtPsikologPage = pathname.startsWith('/dashboard/psikolog');
  const isAtAdminPage = pathname.startsWith('/dashboard/admin');

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<'light' | 'dark'>).detail;
      setTheme(nextTheme);
    };

    window.addEventListener('careconnect-theme-change', handleThemeChange);
    return () =>
      window.removeEventListener('careconnect-theme-change', handleThemeChange);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="dashboard-shell fixed inset-0 w-full h-full flex bg-[#F7F3ED] overflow-hidden m-0 p-0 z-0">
      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#193C1F]/40 backdrop-blur-sm z-[150] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar fixed lg:relative top-0 bottom-0 left-0 w-[280px] border-r flex flex-col shrink-0 h-full z-[200] transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: theme === 'dark' ? '#131f17' : '#F2EDE4',
          borderColor: theme === 'dark' ? '#334137' : '#D0D5CB',
        }}
      >
        <div className="p-10 flex flex-col gap-1 shrink-0">
          <Logo />
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1 overflow-y-auto">
          {/* Dashboard Home (Dinamis) */}
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            href={
              isAtAdminPage
                ? '/dashboard/admin'
                : isAtPsikologPage
                  ? '/dashboard/psikolog'
                  : '/dashboard'
            }
            active={
              pathname === '/dashboard' ||
              pathname === '/dashboard/psikolog' ||
              pathname === '/dashboard/admin'
            }
            isDark={theme === 'dark'}
          />

          {isAtAdminPage ? (
            /* --- MENU ADMIN --- */
            <>
              <SidebarItem
                icon={BrainCircuit}
                label="AI Analysis"
                href="/dashboard/admin/ai"
                active={pathname.startsWith('/dashboard/admin/ai')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={ShieldAlert}
                label="All Reports"
                href="/dashboard/admin/reports"
                active={pathname.startsWith('/dashboard/admin/reports')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={Users}
                label="All Consultations"
                href="/dashboard/admin/consultations"
                active={pathname.startsWith('/dashboard/admin/consultations')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={CreditCard}
                label="All Donations"
                href="/dashboard/admin/donations"
                active={pathname.startsWith('/dashboard/admin/donations')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={User}
                label="Users"
                href="/dashboard/admin/users"
                active={pathname.startsWith('/dashboard/admin/users')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={MessageSquare}
                label="Community Chat"
                href="/dashboard/admin/community-chat"
                active={pathname.startsWith('/dashboard/admin/community-chat')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={Calendar}
                label="Psikolog Schedules"
                href="/dashboard/admin/schedules"
                active={pathname.startsWith('/dashboard/admin/schedules')}
                isDark={theme === 'dark'}
              />
            </>
          ) : isAtPsikologPage ? (
            /* --- MENU PSIKOLOG --- */
            <>
              <SidebarItem
                icon={Users}
                label="All Consultations"
                href="/dashboard/psikolog/consultations"
                active={pathname.startsWith(
                  '/dashboard/psikolog/consultations',
                )}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={CreditCard}
                label="Donation History"
                href="/dashboard/psikolog/donations"
                active={pathname.startsWith('/dashboard/psikolog/donations')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={Calendar}
                label="My Schedule"
                href="/dashboard/psikolog/schedule"
                active={pathname.startsWith('/dashboard/psikolog/schedule')}
                isDark={theme === 'dark'}
              />
            </>
          ) : (
            /* --- MENU USER --- */
            <>
              <SidebarItem
                icon={BrainCircuit}
                label="AI Analysis"
                href="/dashboard/ai"
                active={pathname.startsWith('/dashboard/ai')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={Users}
                label="My Consultations"
                href="/dashboard/consultations"
                active={
                  pathname.startsWith('/dashboard/consultations') &&
                  !isAtPsikologPage
                }
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={FileText}
                label="My Reports"
                href="/dashboard/reports"
                active={pathname.startsWith('/dashboard/reports')}
                isDark={theme === 'dark'}
              />
              <SidebarItem
                icon={CreditCard}
                label="Donation History"
                href="/dashboard/donations"
                active={
                  pathname.startsWith('/dashboard/donations') &&
                  !isAtPsikologPage
                }
                isDark={theme === 'dark'}
              />
            </>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="shrink-0 w-full">
          <Header
            onLogoutClick={() => setIsLogoutAlertOpen(true)}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        </div>

        <div className="dashboard-main-scroll flex-1 overflow-y-auto w-full bg-[#F7F3ED]">
          <div className="px-2 sm:px-4 md:px-8 py-3 sm:py-5 md:py-8 w-full min-h-full box-border">
            {children}
          </div>
        </div>
      </main>

      <Alert
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
        onConfirm={handleLogout}
        type="danger"
        title="End Session?"
        description="Are you sure you want to log out?"
        confirmText={isLoggingOut ? 'Logging out...' : 'Log Out'}
      />
    </div>
  );
}
