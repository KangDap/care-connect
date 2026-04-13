'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Header } from '@/components/header';
import { Input } from '@/components/input';
// Import komponen Alert kamu
import { ArrowRight, Filter, MapPin } from 'lucide-react';
import React, { useState } from 'react';

const PublicReportsPage = () => {
  // State untuk Alert Privacy
  const [isPrivacyAlertOpen, setIsPrivacyAlertOpen] = useState(true);

  const reports = [
    {
      id: '#8291',
      category: 'Elderly Care',
      title: 'Staffing levels in...',
      desc: 'Observation of reduced nighttime staffing levels over a 7-day period....',
      location: 'Manchester',
    },
    {
      id: '#8290',
      category: 'Healthcare',
      title: 'Patient handover...',
      desc: 'Inconsistencies observed during clinical handover between shift changes....',
      location: 'London',
    },
    {
      id: '#8289',
      category: 'Child Safety',
      title: 'Playground safet...',
      desc: 'Summary of playground safety maintenance review. Identified speci...',
      location: 'Birmingham',
    },
    {
      id: '#8288',
      category: 'Healthcare',
      title: 'Patient transport...',
      desc: 'Report detailing delays in patient discharge transport services....',
      location: 'Bristol',
    },
    {
      id: '#8287',
      category: 'Elderly Care',
      title: 'Dietary complian...',
      desc: 'Compliance check on special dietary requirements. High...',
      location: 'Leeds',
    },
    {
      id: '#8286',
      category: 'Healthcare',
      title: 'Facility...',
      desc: 'Review of lobby and corridor lighting during winter hours. Reported...',
      location: 'Newcastle',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3ED]">
      {/* 1. Header (Sudah include Search Bar di dalamnya) */}
      <Header withSearch={true} withLogo={true} />

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {/* 2. Alert Privacy (Pakai komponen Alert kamu) */}
        <Alert
          isOpen={isPrivacyAlertOpen}
          onClose={() => setIsPrivacyAlertOpen(false)}
          onConfirm={() => setIsPrivacyAlertOpen(false)}
          type="primary"
          title="Privacy Information"
          description="All data is anonymized to protect reporter and care recipient privacy while ensuring public transparency."
          confirmText="I Understand"
        />

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-72 space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-[#D0D5CB] shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-black uppercase text-sm tracking-widest flex items-center gap-2 text-[#193C1F]">
                  <Filter size={18} /> Filters
                </h2>
                <button className="text-[10px] text-[#8EA087] font-black uppercase hover:underline transition-all">
                  Reset All
                </button>
              </div>

              {/* Category Filter */}
              <div className="space-y-4 mb-10">
                <p className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest">
                  Category
                </p>
                {[
                  'Elderly Care',
                  'Child Safety',
                  'Healthcare',
                  'Facility Quality',
                ].map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-[#D0D5CB] accent-[#193C1F] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[#193C1F] group-hover:text-[#8EA087] transition-colors">
                      {cat}
                    </span>
                  </label>
                ))}
              </div>

              {/* Location & Date pakai Input Kamu */}
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest mb-3">
                    Location
                  </p>
                  <Input
                    placeholder="Search location..."
                    name="location"
                    className="bg-[#F7F3ED] border-transparent"
                  />
                </div>

                <div>
                  <p className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest mb-3">
                    Date Range
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      name="start"
                      className="bg-[#F7F3ED] border-transparent"
                    />
                    <Input
                      type="date"
                      name="end"
                      className="bg-[#F7F3ED] border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Button dari Components Kamu */}
              <div className="mt-8">
                <Button className="w-full bg-[#8EA087] hover:bg-[#193C1F] text-white rounded-[18px] py-6 font-black uppercase tracking-widest transition-all">
                  Apply Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 text-left">
              <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-[#193C1F] leading-none mb-4 italic tracking-tight">
                  Public Reports
                </h1>
                <p className="text-[#8EA087] text-lg font-medium">
                  Community safety and care quality insights.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-[#D0D5CB] shadow-sm">
                <span className="text-[10px] font-black text-[#8EA087] uppercase tracking-widest">
                  Sort:
                </span>
                <select className="bg-transparent font-bold text-xs text-[#193C1F] outline-none cursor-pointer">
                  <option>Most Recent</option>
                  <option>Oldest</option>
                </select>
              </div>
            </div>

            {/* Grid Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {reports.map((report, i) => (
                <div
                  key={i}
                  className="bg-white rounded-[40px] border border-[#D0D5CB] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col group"
                >
                  {/* Thumbnail / ID Box */}
                  <div className="h-44 bg-[#F7F3ED] flex items-center justify-center relative overflow-hidden transition-colors group-hover:bg-[#EBE6DE]">
                    <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-[#8EA087] bg-white px-5 py-2.5 rounded-2xl border border-[#D0D5CB] shadow-sm">
                      ID: {report.id}
                    </span>
                  </div>

                  <div className="p-8 text-left flex flex-col flex-1">
                    <span className="text-[9px] font-black text-[#8EA087] uppercase tracking-[0.2em] mb-4 inline-block">
                      {report.category}
                    </span>
                    <h3 className="font-black text-xl text-[#193C1F] mb-3 group-hover:text-[#8EA087] transition-colors italic tracking-tight">
                      {report.title}
                    </h3>
                    <p className="text-sm text-[#193C1F]/60 font-medium leading-relaxed mb-8 flex-1 line-clamp-3">
                      {report.desc}
                    </p>

                    <div className="flex justify-between items-center pt-6 border-t border-[#F7F3ED]">
                      <span className="text-[10px] font-black text-[#8EA087] uppercase flex items-center gap-2 tracking-widest">
                        <MapPin size={14} strokeWidth={3} /> {report.location}
                      </span>
                      <button className="text-[11px] font-black uppercase flex items-center gap-1 text-[#193C1F] hover:gap-3 transition-all tracking-[0.1em]">
                        Details <ArrowRight size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicReportsPage;
