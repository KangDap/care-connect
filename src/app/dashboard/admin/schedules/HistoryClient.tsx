'use client';

import { Calendar, User } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

// --- Dummy Data (Shared with AdminScheduleContent for demo) ---
const DUMMY_PSYCHOLOGISTS = [
  {
    id: 'psy-1',
    name: 'Dr. Anika Sari, M.Psi',
    specialization: 'Anxiety & Depression',
    activeDays: ['Mon', 'Wed'],
  },
  {
    id: 'psy-2',
    name: 'Dr. Budi Santoso, M.Psi',
    specialization: 'Trauma & PTSD',
    activeDays: ['Tue', 'Thu'],
  },
  {
    id: 'psy-3',
    name: 'Dr. Clara Dewi, M.Psi',
    specialization: 'Child & Adolescent',
    activeDays: [],
  },
  {
    id: 'psy-4',
    name: 'Dr. Dimas Pratama, M.Psi',
    specialization: 'Relationships & Family',
    activeDays: [],
  },
];

export default function HistoryClient() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#193C1F] tracking-tight">
            Psikolog Schedules
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
                <th className="px-6 py-4 w-[300px]">Psychologist</th>
                <th className="px-6 py-4 w-[200px]">Specialization</th>
                <th className="px-6 py-4 w-[250px]">Active Days</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F3ED] text-sm">
              {DUMMY_PSYCHOLOGISTS.map((psy) => (
                <tr
                  key={psy.id}
                  className="hover:bg-[#F7F3ED]/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F7F3ED] flex items-center justify-center text-[#8EA087] shrink-0 border border-[#D0D5CB]">
                        <User size={20} />
                      </div>
                      <div className="font-bold text-[#193C1F]">{psy.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#8EA087] font-medium uppercase text-[10px] tracking-wider">
                    {psy.specialization}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {psy.activeDays.length > 0 ? (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
