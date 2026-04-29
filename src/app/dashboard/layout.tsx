'use client';

import { Alert } from '@/components/alert';
import { Header } from '@/components/header';
import { authClient } from '@/lib/auth/auth-client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

// ==========================================
// --- ICONS SIDEBAR (Dikelompokkan di sini) ---
// ==========================================
const DashboardIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
const ConsultationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ReportsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const DonationsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
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
  icon: React.ComponentType;
  label: string;
  href: string;
  active: boolean;
};

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => (
  <Link href={href} className="no-underline">
    <div
      className={`flex items-center gap-3 px-8 py-4 cursor-pointer transition-all duration-200 group ${active ? 'bg-[#EBE6DE] text-[#193C1F] font-bold border-r-4 border-[#193C1F]' : 'text-[#193C1F] opacity-60 hover:opacity-100 hover:bg-[#EBE6DE]/50'}`}
    >
      <div
        className={`${active ? 'text-[#193C1F]' : 'group-hover:scale-110 transition-transform'}`}
      >
        <Icon />
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
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // LOGIKA DETEKSI HALAMAN (Berdasarkan Folder)
  const isAtPsikologPage = pathname.startsWith('/dashboard/psikolog');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 w-full h-full flex bg-[#F7F3ED] overflow-hidden m-0 p-0 z-0">
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#F2EDE4] border-r border-[#D0D5CB] flex flex-col shrink-0 h-full">
        <div className="p-10 flex flex-col gap-1 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity"
          >
            <LogoCareConnect />
            <h1 className="text-[20px] font-black text-[#193C1F] tracking-tight">
              CareConnect
            </h1>
          </Link>
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1 overflow-y-auto">
          {/* Dashboard Home (Dinamis) */}
          <SidebarItem
            icon={DashboardIcon}
            label="Dashboard"
            href={isAtPsikologPage ? '/dashboard/psikolog' : '/dashboard'}
            active={
              pathname === '/dashboard' || pathname === '/dashboard/psikolog'
            }
          />

          {isAtPsikologPage ? (
            /* --- MENU PSIKOLOG --- */
            <>
              <SidebarItem
                icon={ConsultationIcon}
                label="All Consultations"
                href="/dashboard/psikolog/consultations"
                active={pathname.startsWith(
                  '/dashboard/psikolog/consultations',
                )}
              />
              <SidebarItem
                icon={DonationsIcon}
                label="Donation History"
                href="/dashboard/psikolog/donations"
                active={pathname.startsWith('/dashboard/psikolog/donations')}
              />
            </>
          ) : (
            /* --- MENU USER --- */
            <>
              <SidebarItem
                icon={ConsultationIcon}
                label="My Consultations"
                href="/dashboard/consultations"
                active={
                  pathname.startsWith('/dashboard/consultations') &&
                  !isAtPsikologPage
                }
              />
              <SidebarItem
                icon={ReportsIcon}
                label="My Reports"
                href="/dashboard/reports"
                active={pathname.startsWith('/dashboard/reports')}
              />
              <SidebarItem
                icon={DonationsIcon}
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
          <Header onLogoutClick={() => setIsLogoutAlertOpen(true)} />
        </div>

        <div className="flex-1 overflow-y-auto w-full bg-[#F7F3ED]">
          <div className="p-10 w-full min-h-full box-border">{children}</div>
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
