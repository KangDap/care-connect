'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { authClient } from '@/lib/auth/auth-client';
import {
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
// --- ICONS SIDEBAR (Dikelompokkan di sini) ---
// ==========================================
// Icons are now handled by Lucide-React components directly
const LogoCareConnect = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#193C1F" />
    <path
      d="M13.5 15.9998L15.1667 17.6665L18.5 14.3331M23.1817 10.9865C20.5468 11.1264 17.9639 10.2153 16 8.45312C14.0361 10.2153 11.4533 11.1264 8.81834 10.9865C8.60628 11.8074 8.49931 12.6519 8.5 13.4998C8.5 18.159 11.6867 22.0748 16 23.1848C20.3133 22.0748 23.5 18.1598 23.5 13.4998C23.5 12.6315 23.3892 11.7898 23.1817 10.9865L13.5 15.9998"
      stroke="#F7F3ED"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ==========================================
// --- SUB-KOMPONEN SIDEBAR ITEM ---
// ==========================================
type SidebarItemProps = {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
};

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => (
  <Link href={href} className="no-underline">
    <div
      className={`flex items-center gap-3 px-8 py-4 cursor-pointer transition-all duration-200 group ${active ? 'bg-[#EBE6DE] text-[#193c1f] font-bold border-r-4 border-[#193c1f]' : 'text-[#193c1f] opacity-60 hover:opacity-100 hover:bg-[#EBE6DE]/50'}`}
    >
      <div
        className={`${active ? 'text-[#193c1f]' : 'group-hover:scale-110 transition-transform'}`}
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 w-full h-full flex bg-[#F7F3ED] overflow-hidden m-0 p-0 z-0">
      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#193C1F]/40 backdrop-blur-sm z-[150] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:relative top-0 bottom-0 left-0 w-[280px] bg-[#F2EDE4] border-r border-[#D0D5CB] flex flex-col shrink-0 h-full z-[200] transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-10 flex flex-col gap-1 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity"
          >
            <LogoCareConnect />
            <h1 className="text-[20px] font-black text-[#193c1f] tracking-tight">
              CareConnect
            </h1>
          </Link>
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
          />

          {isAtAdminPage ? (
            /* --- MENU ADMIN --- */
            <>
              <SidebarItem
                icon={ShieldAlert}
                label="All Reports"
                href="/dashboard/admin/reports"
                active={pathname.startsWith('/dashboard/admin/reports')}
              />
              <SidebarItem
                icon={Users}
                label="All Consultations"
                href="/dashboard/admin/consultations"
                active={pathname.startsWith('/dashboard/admin/consultations')}
              />
              <SidebarItem
                icon={CreditCard}
                label="All Donations"
                href="/dashboard/admin/donations"
                active={pathname.startsWith('/dashboard/admin/donations')}
              />
              <SidebarItem
                icon={User}
                label="Users"
                href="/dashboard/admin/users"
                active={pathname.startsWith('/dashboard/admin/users')}
              />
              <SidebarItem
                icon={MessageSquare}
                label="Community Chat"
                href="/dashboard/admin/community-chat"
                active={pathname.startsWith('/dashboard/admin/community-chat')}
              />
              <SidebarItem
                icon={Calendar}
                label="Psikolog Schedules"
                href="/dashboard/admin/schedules"
                active={pathname.startsWith('/dashboard/admin/schedules')}
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
              />
              <SidebarItem
                icon={CreditCard}
                label="Donation History"
                href="/dashboard/psikolog/donations"
                active={pathname.startsWith('/dashboard/psikolog/donations')}
              />
              <SidebarItem
                icon={Calendar}
                label="My Schedule"
                href="/dashboard/psikolog/schedule"
                active={pathname.startsWith('/dashboard/psikolog/schedule')}
              />
            </>
          ) : (
            /* --- MENU USER --- */
            <>
              <SidebarItem
                icon={Users}
                label="My Consultations"
                href="/dashboard/consultations"
                active={
                  pathname.startsWith('/dashboard/consultations') &&
                  !isAtPsikologPage
                }
              />
              <SidebarItem
                icon={FileText}
                label="My Reports"
                href="/dashboard/reports"
                active={pathname.startsWith('/dashboard/reports')}
              />
              <SidebarItem
                icon={CreditCard}
                label="Donation History"
                href="/dashboard/donations"
                active={
                  pathname.startsWith('/dashboard/donations') &&
                  !isAtPsikologPage
                }
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

        <div className="flex-1 overflow-y-auto w-full bg-[#F7F3ED]">
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
