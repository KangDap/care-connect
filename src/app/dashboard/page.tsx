"use client";

import React from "react";
import Link from "next/link";
import { RECENT_CONSULTATIONS, REPORT_STATUS } from "../../constants"; 

const userData = {
  name: "Sarah Jenkins",
  stats: {
    totalConsultations: "12",
    reportsFiled: "04",
    totalDonations: "$2,450"
  }
};

// --- ICONS (Tetap sama) ---
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
  return (
    <div className="p-12 space-y-10 animate-fade-in">
      
      {/* 2. NAMA DINAMIS */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[36px] font-black text-[#193C1F] tracking-tight leading-tight">
            Welcome back, {userData.name.split(' ')[0]} {/* Ambil nama depan saja */}
          </h2>
          <p className="text-[#8EA087] text-[16px] font-medium mt-1">Everything looks good.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-7 py-3.5 bg-[#8EA087] hover:bg-[#193C1F] text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">+ New Consultation</button>
          <button className="px-7 py-3.5 bg-white border-2 border-[#D0D5CB] text-[#193C1F] hover:bg-[#F2EDE4] rounded-2xl font-bold shadow-lg transition-all active:scale-95">+ New Report</button>
        </div>
      </div>

      {/* 3. STAT CARDS DINAMIS */}
      <div className="flex gap-8">
        {[
          { label: "Total Consultations", val: userData.stats.totalConsultations, icon: <ConsultationIcon /> },
          { label: "Reports Filed", val: userData.stats.reportsFiled, icon: <ReportsIcon /> },
          { label: "Donations Received", val: userData.stats.totalDonations, icon: <DonationsIcon /> }
        ].map((item, i) => (
          <div key={i} className="bg-[#F7F3ED] p-8 rounded-[28px] border border-[#D0D5CB] flex items-center gap-6 flex-1 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-[#EBE6DE] rounded-2xl flex items-center justify-center shadow-sm">{item.icon}</div>
            <div>
              <p className="text-[10px] uppercase font-black text-[#8EA087] tracking-widest">{item.label}</p>
              <p className="text-[32px] font-bold text-[#193C1F] leading-none">{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. TABEL DINAMIS (Ngambil dari Constants) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* RECENT CONSULTATIONS */}
        <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#F7F3ED] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193C1F]">Recent Consultations</h3>
            <Link href="/dashboard/consultations"><button className="text-[11px] font-black text-[#8EA087] uppercase">View All</button></Link>
          </div>
          <table className="w-full text-left">
            <tbody className="text-[14px] text-[#193C1F]">
              {RECENT_CONSULTATIONS.slice(0, 3).map((row, i) => (
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
        </div>

        {/* REPORT STATUS */}
        <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-[#F7F3ED] flex justify-between items-center bg-[#FDFCFB]">
            <h3 className="font-bold text-[18px] text-[#193C1F]">Report Status</h3>
            <Link href="/dashboard/reports"><button className="text-[11px] font-black text-[#8EA087] uppercase">View All</button></Link>
          </div>
          <table className="w-full text-left">
            <tbody className="text-[14px] text-[#193C1F]">
              {REPORT_STATUS.slice(0, 3).map((row, i) => (
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
        </div>

      </div>
    </div>
  );
}