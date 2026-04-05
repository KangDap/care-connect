"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; 
// Pastikan INITIAL_PROFILE_DATA sudah ada di constants.ts
import { 
  RECENT_CONSULTATIONS, 
  REPORT_STATUS, 
  DONATION_HISTORY, 
  INITIAL_PROFILE_DATA 
} from "../../constants"; 

// --- ICONS ---
const ConsultationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#193C1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
const ReportsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#193C1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>
  </svg>
);
const DonationsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#193C1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

export default function DashboardPage() {
  // 1. AMBIL DATA USER DARI CONSTANT
  // Kita pakai state supaya kalau nanti ada fitur edit, tampilannya ikut berubah
  const [userData] = useState(INITIAL_PROFILE_DATA);

  // 2. AMBIL QUERY DARI URL
  const searchParams = useSearchParams();
  const searchBarQuery = searchParams.get("search")?.toLowerCase() || "";

  // 3. LOGIKA FILTER DATA
  const filteredConsultations = RECENT_CONSULTATIONS.filter((item) =>
    item.dr.toLowerCase().includes(searchBarQuery)
  );

  const filteredReports = REPORT_STATUS.filter((item) =>
    item.id.toLowerCase().includes(searchBarQuery) || 
    item.type.toLowerCase().includes(searchBarQuery)
  );

  // 4. HITUNG TOTAL DONASI
  const totalDonationAmount = DONATION_HISTORY.reduce((acc, curr) => {
    const cleanAmount = parseFloat(curr.amount.replace(/[Rp.+$ ,]/g, ""));
    return acc + (isNaN(cleanAmount) ? 0 : cleanAmount);
  }, 0);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-12 space-y-10 animate-fade-in">
      
      {/* WELCOME SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[36px] font-black text-[#193C1F] tracking-tight leading-tight">
            Welcome back, {userData.displayName}
          </h2>
          <p className="text-[#8EA087] text-[16px] font-medium mt-1">
            {searchBarQuery 
              ? `Showing results for "${searchBarQuery}"` 
              : `Everything looks good. You have ${REPORT_STATUS.filter(r => r.status === 'PENDING REVIEW').length} pending reports this week.`}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/consultation">
            <button className="px-7 py-3.5 bg-[#8EA087] hover:bg-[#193C1F] text-white rounded-2xl font-bold text-[14px] transition-all shadow-lg active:scale-95">
              + New Consultation
            </button>
          </Link>
          <Link href="/report">
            <button className="px-7 py-3.5 bg-white border-2 border-[#D0D5CB] text-[#193C1F] rounded-2xl font-bold text-[14px] transition-all active:scale-95">
              + New Report
            </button>
          </Link>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="flex gap-8">
        {[
          { label: "Total Consultations", val: RECENT_CONSULTATIONS.length.toString().padStart(2, '0'), icon: <ConsultationIcon /> },
          { label: "Reports Filed", val: REPORT_STATUS.length.toString().padStart(2, '0'), icon: <ReportsIcon /> },
          { label: "Donations Received", val: formatRupiah(totalDonationAmount), icon: <DonationsIcon /> }
        ].map((item, i) => (
          <div key={i} className="bg-[#F7F3ED] p-8 rounded-[28px] border border-[#D0D5CB] flex items-center gap-6 flex-1 shadow-sm">
            <div className="w-14 h-14 bg-[#EBE6DE] rounded-2xl flex items-center justify-center">{item.icon}</div>
            <div>
              <p className="text-[10px] uppercase font-black text-[#8EA087] tracking-widest">{item.label}</p>
              <p className={`${item.label === "Donations Received" ? "text-[24px]" : "text-[32px]"} font-bold text-[#193C1F] leading-none`}>
                {item.val}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TABLES SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* RECENT CONSULTATIONS */}
        <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#F7F3ED] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193C1F]">Recent Consultations</h3>
            <Link href="/dashboard/consultations">
              <button className="text-[11px] font-black text-[#8EA087] tracking-[0.2em] uppercase hover:text-[#193C1F] transition-colors">View All</button>
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Doctor</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193C1F]">
              {filteredConsultations.slice(0, 3).map((row, i) => (
                <tr key={i} className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB] transition-colors">
                  <td className="px-8 py-5 font-bold">{row.dr}</td>
                  <td className="px-8 py-5 opacity-70">{row.date}</td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${row.status === 'UPCOMING' ? 'bg-[#D1B698]/20 text-[#D1B698]' : 'bg-[#EBE6DE]'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredConsultations.length === 0 && <p className="p-10 text-center text-[#8EA087]">No consultations found.</p>}
        </div>

        {/* REPORT STATUS */}
        <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#F7F3ED] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193C1F]">Report Status</h3>
            <Link href="/dashboard/reports">
              <button className="text-[11px] font-black text-[#8EA087] tracking-[0.2em] uppercase hover:text-[#193C1F] transition-colors">View All</button>
            </Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Report ID</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-[#193C1F]">
              {filteredReports.slice(0, 3).map((row, i) => (
                <tr key={i} className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB] transition-colors">
                  <td className="px-8 py-5 font-bold">{row.id}</td>
                  <td className="px-8 py-5 opacity-70">{row.type}</td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${row.status === 'PENDING REVIEW' ? 'bg-[#D1B698]/30 text-[#D1B698]' : 'bg-[#EBE6DE]'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && <p className="p-10 text-center text-[#8EA087]">No reports found.</p>}
        </div>

      </div>
    </div>
  );
}