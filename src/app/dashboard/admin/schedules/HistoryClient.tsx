'use client';

import { Calendar, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface PsychologistSummary {
  id: string;
  name: string;
  image: string | null;
  activeDays: string[];
}

export default function HistoryClient() {
  const [psychologists, setPsychologists] = useState<PsychologistSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const res = await fetch('/api/dashboard/admin/schedules/psychologists');
        const data = await res.json();
        if (data.success) {
          setPsychologists(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch psychologists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPsychologists();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-[#193c1f]" size={40} />
        <p className="text-[#8ea087] font-medium">Memuat daftar psikolog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#193C1F] tracking-tight">
            Psychologist Schedules
          </h1>
          <p className="text-sm text-[#8EA087] mt-1 font-medium">
            Manage availability and consultation hours for all psychologists.
          </p>
        </div>
        <Link
          href="/dashboard/admin/schedules/form"
          className="flex items-center gap-2 px-6 py-3 bg-[#193C1F] text-white rounded-2xl text-sm font-bold hover:bg-[#2d5c36] transition-all shadow-sm"
        >
          <Calendar size={16} /> Manage Schedule
        </Link>
      </div>

      {/* Table of Psychologists */}
      <div className="bg-white border border-[#D0D5CB] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 w-[350px]">Psychologist</th>
                <th className="px-6 py-4">Active Days</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F3ED] text-sm">
              {psychologists.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-[#8ea087] italic"
                  >
                    No psychologists found in database.
                  </td>
                </tr>
              ) : (
                psychologists.map((psy) => (
                  <tr
                    key={psy.id}
                    className="hover:bg-[#F7F3ED]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F7F3ED] flex items-center justify-center text-[#8EA087] shrink-0 border border-[#D0D5CB] overflow-hidden">
                          {psy.image ? (
                            <img
                              src={psy.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#193C1F]">
                            {psy.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {psy.activeDays && psy.activeDays.length > 0 ? (
                          psy.activeDays.map((day) => (
                            <span
                              key={day}
                              className="px-2.5 py-0.5 bg-[#193C1F]/5 text-[#193C1F] text-[10px] font-black rounded-lg border border-[#193C1F]/10"
                            >
                              {day}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#8EA087] italic">
                            No active schedule
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/admin/schedules/form?id=${psy.id}`}
                        className="text-xs font-black text-[#193C1F] hover:underline bg-[#F7F3ED] px-4 py-2 rounded-xl border border-[#D0D5CB] transition-all hover:bg-white"
                      >
                        Edit Schedule
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
