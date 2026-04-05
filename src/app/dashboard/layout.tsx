"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { INITIAL_PROFILE_DATA } from "@/constants";

// --- CUSTOM SVG ICONS (Tetap Sama) ---
const LogoCareConnect = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#193C1F"/>
    <path d="M13.5 15.9998L15.1667 17.6665L18.5 14.3331M23.1817 10.9865C20.5468 11.1264 17.9639 10.2153 16 8.45312C14.0361 10.2153 11.4533 11.1264 8.81834 10.9865C8.60628 11.8074 8.49931 12.6519 8.5 13.4998C8.5 18.159 11.6867 22.0748 16 23.1848C20.3133 22.0748 23.5 18.1598 23.5 13.4998C23.5 12.6315 23.3892 11.7898 23.1817 10.9865L13.5 15.9998" stroke="#F7F3ED" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const ConsultationIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const ReportsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>;
const DonationsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8EA087" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#193C1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const SidebarItem = ({ icon: Icon, label, href, active }: any) => (
  <Link href={href} className="no-underline">
    <div className={`flex items-center gap-3 px-6 py-3.5 cursor-pointer transition-all duration-200 group ${active ? "bg-[#EBE6DE] text-[#193C1F] font-bold border-r-4 border-[#193C1F]" : "text-[#193C1F] opacity-60 hover:opacity-100 hover:bg-[#EBE6DE]/50"}`}>
      <div className={`${active ? "text-[#193C1F]" : "group-hover:scale-110 transition-transform"}`}>
        <Icon />
      </div>
      <span className="text-[14px] tracking-wide">{label}</span>
    </div>
  </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`${pathname}?search=${searchQuery}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F7F3ED] font-sans selection:bg-[#8EA087]/30">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#F2EDE4] border-r border-[#D0D5CB] flex flex-col sticky top-0 h-screen z-50">
        <div className="p-10 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <LogoCareConnect />
            <h1 className="text-[20px] font-black text-[#193C1F] tracking-tight">CareConnect</h1>
          </div>
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1">
          <SidebarItem icon={DashboardIcon} label="Dashboard" href="/dashboard" active={pathname === "/dashboard"} />
          <SidebarItem icon={ConsultationIcon} label="My Consultations" href="/dashboard/consultations" active={pathname.startsWith("/dashboard/consultations")} />
          <SidebarItem icon={ReportsIcon} label="My Reports" href="/dashboard/reports" active={pathname.startsWith("/dashboard/reports")} />
          <SidebarItem icon={DonationsIcon} label="Donation History" href="/dashboard/donations" active={pathname.startsWith("/dashboard/donations")} />
        </nav>

        <div className="p-8">
          <div className="bg-[#EBE6DE] p-5 rounded-[20px] text-center border border-[#D0D5CB]/50">
            <p className="text-[11px] font-black text-[#193C1F] tracking-widest mb-3 uppercase">Need Help?</p>
            <button className="w-full py-3.5 bg-[#193C1F] hover:bg-[#2d5a35] text-[#F7F3ED] rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-lg">
              Emergency 24/7
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-[90px] border-b border-[#D0D5CB] flex items-center justify-between px-12 bg-[#F7F3ED]/80 backdrop-blur-md sticky top-0 z-40">
          
          {/* SEARCH BAR */}
          <form onSubmit={handleSearch} className="relative flex-grow max-w-[700px]">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-70"><SearchIcon /></span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, doctors, or reports..." 
              className="w-full h-[52px] bg-[#EBE6DE] border border-transparent focus:border-[#8EA087] focus:bg-white rounded-2xl pl-14 pr-6 outline-none text-[15px] text-[#193C1F] shadow-sm transition-all" 
            />
          </form>

          <div className="flex items-center gap-6 ml-10">
            <button className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-[#D0D5CB] hover:bg-[#EBE6DE] transition-all shadow-sm">
              <BellIcon />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#D1B698] rounded-full border-2 border-white animate-pulse"></span>
            </button>

            {/* PROFILE SECTION - TERKONEKSI CONSTANTS */}
            <div className="relative" ref={dropdownRef}>
              <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-4 pl-6 border-l border-[#D0D5CB] cursor-pointer group select-none">
                <div className="text-right hidden md:block">
                  <p className="text-[15px] font-bold text-[#193C1F]">{INITIAL_PROFILE_DATA.displayName}</p>
                  <p className="text-[11px] text-[#8EA087] font-bold uppercase text-right">ID: {INITIAL_PROFILE_DATA.userId}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-md transition-all ${isProfileOpen ? 'border-[#8EA087] ring-4 ring-[#8EA087]/10' : 'border-white group-hover:border-[#8EA087]'}`}>
                  <img src={INITIAL_PROFILE_DATA.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white border border-[#D0D5CB] rounded-[24px] shadow-2xl py-3 z-50 animate-in fade-in zoom-in duration-200">   
                  <button onClick={() => { router.push("/profile"); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-6 py-3 text-[14px] text-[#193C1F] hover:bg-[#F7F3ED] transition-colors"><UserIcon /> My Profile</button>
                  <div className="h-px bg-[#F7F3ED] my-2 mx-4" />
                  <button onClick={() => { setIsLogoutModalOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-6 py-4 text-[14px] text-red-500 font-bold hover:bg-red-50 transition-colors"><LogoutIcon /> Log Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      {/* MODAL LOGOUT (Tetap Sama) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#193C1F]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-[24px] font-black text-[#193C1F] mb-3">Are you sure you want to log out?</h3>
              <p className="text-[#8EA087] text-[15px] leading-relaxed mb-10">Your session on <span className="font-bold text-[#193C1F]">CareConnect</span> will end.</p>
              <div className="grid grid-cols-2 gap-4 w-full">
                <button onClick={() => setIsLogoutModalOpen(false)} className="py-4 bg-[#F7F3ED] text-[#193C1F] font-bold rounded-2xl hover:bg-[#EBE6DE] transition-all">Cancel</button>
                <button onClick={() => router.push("/login")} className="py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-95">Yes, Log Out</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}