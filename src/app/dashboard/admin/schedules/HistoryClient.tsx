'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Table } from '@/components/table';
import { Calendar, Loader2, Pencil, User } from 'lucide-react';
import Image from 'next/image';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#193C1F] tracking-tight">
            Psychologist Schedules
          </h1>
          <p className="text-sm text-[#8EA087] mt-1 font-medium">
            Manage availability and consultation hours for all psychologists.
          </p>
        </div>
        <Link href="/dashboard/admin/schedules/form" className="shrink-0">
          <Button className="rounded-2xl px-5 sm:px-6 py-2.5 sm:py-3 text-sm shadow-sm">
            <Calendar size={16} /> Manage Schedule
          </Button>
        </Link>
      </div>

      {/* Table of Psychologists */}
      <Table
        data={psychologists}
        keyExtractor={(psy) => psy.id}
        emptyMessage="No psychologists found in database."
        columns={[
          {
            header: 'Psychologist',
            cell: (psy) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F7F3ED] flex items-center justify-center text-[#8EA087] shrink-0 border border-[#D0D5CB] overflow-hidden">
                  {psy.image ? (
                    <Image
                      src={psy.image}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#193C1F]">{psy.name}</div>
                </div>
              </div>
            ),
          },
          {
            header: 'Active Days',
            cell: (psy) => (
              <div className="flex flex-wrap gap-1.5">
                {psy.activeDays && psy.activeDays.length > 0 ? (
                  psy.activeDays.map((day) => (
                    <Badge
                      key={day}
                      className="rounded-lg border border-[#193C1F]/10 bg-[#193C1F]/5 px-2.5 py-0.5 text-[#193C1F] whitespace-nowrap"
                    >
                      {day}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-[#8EA087] italic">
                    No active schedule
                  </span>
                )}
              </div>
            ),
          },
          {
            header: 'Actions',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (psy) => (
              <div className="flex items-center justify-end gap-2">
                <Link href={`/dashboard/admin/schedules/form?id=${psy.id}`}>
                  <Button
                    variant="outline"
                    className="h-7 text-[10px] sm:text-xs px-2 py-0.5 min-h-0 flex items-center gap-1 border-[#d0d5cb]"
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                </Link>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
