'use client';

import { authClient } from '@/lib/auth/auth-client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Header } from '@/components/header';
import { Alert } from '@/components/alert';

// --- ICONS SIDEBAR ---
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const ConsultationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const ReportsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
);
const DonationsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const LogoCareConnect = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#193C1F" />
    <path d="M13.5 15.9998L15.1667 17.6665L18.5 14.3331M23.1817 10.9865C20.5468 11.1264 17.9639 10.2153 16 8.45312C14.0361 10.2153 11.4533 11.1264 8.81834 10.9865C8.60628 11.8074 8.49931 12.6519 8.5 13.4998C8.5 18.159 11.6867 22.0748 16 23.1848C20.3133 22.0748 23.5 18.1598 23.5 13.4998C23.5 12.6315 23.3892 11.7898 23.1817 10.9865L13.5 15.9998" stroke="#F7F3ED" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SidebarItem = ({ icon: Icon, label, href, active }: any) => (
  <Link href={href} className="no-underline">
    <div className={`flex items-center gap-3 px-8 py-4 cursor-pointer transition-all duration-200 group ${active ? 'bg-[#EBE6DE] text-[#193C1F] font-bold border-r-4 border-[#193C1F]' : 'text-[#193C1F] opacity-60 hover:opacity-100 hover:bg-[#EBE6DE]/50'}`}>
      <div className={`${active ? 'text-[#193C1F]' : 'group-hover:scale-110 transition-transform'}`}>
        <Icon />
      </div>
      <span className="text-[14px] tracking-wide">{label}</span>
    </div>
  </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    /* 1. LAYER UTAMA: Fixed, top-0, left-0, w-full, h-full untuk bunuh gap browser */
    <div className="fixed inset-0 w-full h-full flex bg-[#F7F3ED] overflow-hidden m-0 p-0 z-0">
      
      {/* 2. SIDEBAR: Stay di kiri */}
      <aside className="w-[280px] bg-[#F2EDE4] border-r border-[#D0D5CB] flex flex-col shrink-0 h-full">
        <div className="p-10 flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-3">
            <LogoCareConnect />
            <h1 className="text-[20px] font-black text-[#193C1F] tracking-tight">CareConnect</h1>
          </div>
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1 overflow-y-auto">
          <SidebarItem icon={DashboardIcon} label="Dashboard" href="/dashboard" active={pathname === '/dashboard'} />
          <SidebarItem icon={ConsultationIcon} label="My Consultations" href="/dashboard/consultations" active={pathname.startsWith('/dashboard/consultations')} />
          <SidebarItem icon={ReportsIcon} label="My Reports" href="/dashboard/reports" active={pathname.startsWith('/dashboard/reports')} />
          <SidebarItem icon={DonationsIcon} label="Donation History" href="/dashboard/donations" active={pathname.startsWith('/dashboard/donations')} />
        </nav>

        <div className="p-8 shrink-0">
          <div className="bg-[#EBE6DE] p-5 rounded-[24px] text-center border border-[#D0D5CB]/50">
            <p className="text-[11px] font-black text-[#193C1F] tracking-widest mb-3 uppercase opacity-40">Need Help?</p>
            <button className="w-full py-4 bg-[#193C1F] hover:bg-[#2d5a35] text-[#F7F3ED] rounded-xl text-[13px] font-bold transition-all shadow-lg active:scale-95">
              Emergency 24/7
            </button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN AREA: Header + Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* HEADER: Stay di atas (Jangan ada margin m-0) */}
        <div className="shrink-0 w-full">
          <Header 
            withSearch={true} 
            withLogo={false}
            onLogoutClick={() => setIsLogoutAlertOpen(true)} 
          />
        </div>

        {/* AREA CONTENT: Satu-satunya yang boleh scroll */}
        <div className="flex-1 overflow-y-auto w-full bg-[#F7F3ED]">
          {/* p-10 ini padding ke dalam, bukan gap ke luar */}
          <div className="p-10 w-full min-h-full box-border">
            {children}
          </div>
        </div>
      </main>

      {/* MODAL LOGOUT */}
      <Alert 
        isOpen={isLogoutAlertOpen}
        onClose={() => setIsLogoutAlertOpen(false)}
        onConfirm={handleLogout}
        type="danger"
        title="End Session?"
        description="Are you sure you want to log out?"
        confirmText={isLoggingOut ? "Logging out..." : "Log Out"}
      />
    </div>
  );
}