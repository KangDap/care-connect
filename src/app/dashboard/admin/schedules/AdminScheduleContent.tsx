'use client';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Day =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  day: Day;
  slots: TimeSlot[];
}

interface Psychologist {
  id: string;
  name: string;
  image: string | null;
}

interface ScheduleApiResponse {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS: Day[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_MAP: Record<Day, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

const REV_DAY_MAP: Record<number, Day> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

const DAY_SHORT: Record<Day, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).substring(2, 9);

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminSchedulePage() {
  const searchParams = useSearchParams();

  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [selectedPsyId, setSelectedPsyId] = useState<string>('');
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [activeDays, setActiveDays] = useState<Set<Day>>(new Set());

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 1. Fetch Psychologists
  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const res = await fetch('/api/dashboard/admin/schedules/psychologists');
        const data = await res.json();
        if (data.success) {
          console.log('Psychologists fetched:', data.data);
          setPsychologists(data.data);
          const initialId = searchParams.get('id') || data.data[0]?.id;
          if (initialId) setSelectedPsyId(initialId);
        } else {
          console.error('API Error fetching psychologists:', data);
        }
      } catch (err) {
        console.error('Failed to fetch psychologists:', err);
        setError('Gagal memuat daftar psikolog.');
      } finally {
        setLoading(false);
      }
    };
    fetchPsychologists();
  }, [searchParams]);

  // 2. Fetch Schedule when Psychologist changes
  useEffect(() => {
    if (!selectedPsyId) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/dashboard/admin/schedules/${selectedPsyId}`,
        );
        const data = await res.json();

        if (data.success) {
          // Group by day
          const grouped: Record<number, TimeSlot[]> = {};
          data.data.forEach((s: ScheduleApiResponse) => {
            if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = [];
            grouped[s.dayOfWeek].push({
              id: s.id.toString(),
              start: s.startTime,
              end: s.endTime,
            });
          });

          const formattedSchedule: DaySchedule[] = Object.entries(grouped).map(
            ([dayNum, slots]) => ({
              day: REV_DAY_MAP[Number(dayNum)],
              slots,
            }),
          );

          setSchedule(formattedSchedule);
          setActiveDays(new Set(formattedSchedule.map((s) => s.day)));
        }
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
        setError('Gagal memuat jadwal.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedPsyId]);

  const selectedPsy = psychologists.find((p) => p.id === selectedPsyId);

  // Toggle whether a day is active
  const toggleDay = (day: Day) => {
    const newActive = new Set(activeDays);
    if (newActive.has(day)) {
      newActive.delete(day);
      setSchedule((prev) => prev.filter((d) => d.day !== day));
    } else {
      newActive.add(day);
      setSchedule((prev) => [
        ...prev,
        { day, slots: [{ id: uid(), start: '09:00', end: '17:00' }] },
      ]);
    }
    setActiveDays(newActive);
  };

  // Add a time slot to a day
  const addSlot = (day: Day) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              slots: [...d.slots, { id: uid(), start: '09:00', end: '17:00' }],
            }
          : d,
      ),
    );
  };

  // Remove a time slot
  const removeSlot = (day: Day, slotId: string) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
          : d,
      ),
    );
  };

  // Update slot time
  const updateSlot = (
    day: Day,
    slotId: string,
    field: 'start' | 'end',
    value: string,
  ) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              slots: d.slots.map((s) =>
                s.id === slotId ? { ...s, [field]: value } : s,
              ),
            }
          : d,
      ),
    );
  };

  const handleSave = async () => {
    if (!selectedPsyId) return;

    setSaveLoading(true);
    setError(null);

    try {
      // Flatten schedule for API
      const slots = schedule.flatMap((d) =>
        d.slots.map((s) => ({
          dayOfWeek: DAY_MAP[d.day],
          startTime: s.start,
          endTime: s.end,
        })),
      );

      const res = await fetch('/api/dashboard/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedPsyId, slots }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.message || 'Gagal menyimpan jadwal.');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaveLoading(false);
    }
  };

  const daySchedule = (day: Day) => schedule.find((d) => d.day === day);

  if (loading && psychologists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-[#193c1f]" size={40} />
        <p className="text-[#8ea087] font-medium">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/schedules"
            className="p-2.5 bg-white border border-[#D0D5CB] hover:bg-[#F7F3ED] rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 group"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#193C1F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-[#193C1F] tracking-tight">
              Manage Schedule
            </h1>
            <p className="text-sm text-[#8EA087] mt-1 font-medium">
              Set available consultation days and time slots for{' '}
              {selectedPsy?.name || 'Psychologist'}.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveLoading || !selectedPsyId}
          loading={saveLoading}
          className={`rounded-2xl px-6 py-3 text-sm ${
            saveSuccess
              ? 'scale-95 bg-green-500 text-white'
              : 'bg-[#193c1f] text-white hover:bg-[#2d5c36]'
          }`}
        >
          {saveLoading ? (
            'Saving...'
          ) : saveSuccess ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : (
            <>
              <Calendar size={16} /> Save Schedule
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Psychologist Selector */}
      <Card className="rounded-3xl p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8ea087] mb-4">
          Select Psychologist
        </p>
        <div className="relative">
          <Button
            onClick={() => setDropdownOpen((v) => !v)}
            variant="outline"
            className="w-full justify-between rounded-2xl bg-[#f7f3ed] px-5 py-4 hover:border-[#8ea087]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d0d5cb] flex items-center justify-center text-[#8ea087] shrink-0 overflow-hidden">
                {selectedPsy?.image ? (
                  <Image
                    src={selectedPsy.image}
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
              <div className="text-left">
                <p className="text-sm font-bold text-[#193c1f]">
                  {selectedPsy?.name || 'Pilih Psikolog'}
                </p>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-[#8ea087] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </Button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d0d5cb] rounded-2xl shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto">
              {psychologists.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <User
                    size={32}
                    className="mx-auto text-[#d0d5cb] mb-2 opacity-20"
                  />
                  <p className="text-xs text-[#8ea087] font-medium">
                    Tidak ada psikolog aktif ditemukan
                  </p>
                </div>
              ) : (
                psychologists.map((psy) => (
                  <Button
                    key={psy.id}
                    onClick={() => {
                      setSelectedPsyId(psy.id);
                      setDropdownOpen(false);
                    }}
                    variant="ghost"
                    className={`w-full justify-start px-5 py-4 text-left normal-case tracking-normal text-[#193c1f] hover:bg-[#f7f3ed] ${
                      psy.id === selectedPsyId ? 'bg-[#f7f3ed]' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#d0d5cb] flex items-center justify-center text-[#8ea087] shrink-0 overflow-hidden">
                      {psy.image ? (
                        <Image
                          src={psy.image}
                          alt=""
                          width={36}
                          height={36}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#193c1f]">
                        {psy.name}
                      </p>
                    </div>
                    {psy.id === selectedPsyId && (
                      <Check size={16} className="ml-auto text-[#8ea087]" />
                    )}
                  </Button>
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Day Picker */}
      <Card className="rounded-3xl p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8ea087] mb-4">
          Available Days
        </p>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => {
            const isActive = activeDays.has(day);
            return (
              <Button
                key={day}
                onClick={() => toggleDay(day)}
                variant={isActive ? 'primary' : 'outline'}
                className={`rounded-xl px-5 py-2.5 text-sm ${
                  isActive
                    ? 'border-[#193c1f] shadow-sm'
                    : 'border-[#d0d5cb] text-[#193c1f] hover:border-[#8ea087]'
                }`}
              >
                {isActive ? (
                  <Check size={14} />
                ) : (
                  <Plus size={14} className="opacity-40" />
                )}
                {DAY_SHORT[day]}
              </Button>
            );
          })}
        </div>
        {activeDays.size === 0 && (
          <p className="text-xs text-[#8ea087] mt-4 italic">
            No days selected. Click a day to add availability.
          </p>
        )}
      </Card>

      {/* Time Slot Editor per Day */}
      {DAYS.filter((day) => activeDays.has(day)).map((day) => {
        const ds = daySchedule(day);
        const slots = ds?.slots ?? [];
        return (
          <Card key={day} className="rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#193c1f] flex items-center justify-center">
                  <Clock size={16} className="text-white" />
                </div>
                <h3 className="font-black text-[#193c1f]">{day}</h3>
              </div>
              <Button
                onClick={() => addSlot(day)}
                variant="outline"
                className="rounded-xl px-3 py-1.5 text-[11px] text-[#8ea087] hover:border-[#8ea087]"
              >
                <Plus size={13} /> Add Slot
              </Button>
            </div>

            <div className="space-y-3">
              {slots.length === 0 ? (
                <p className="text-xs text-[#8ea087] italic">
                  No time slots yet. Click &quot;Add Slot&quot;.
                </p>
              ) : (
                slots.map((slot, idx) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-4 bg-[#f7f3ed] rounded-2xl px-5 py-3 group"
                  >
                    <span className="text-[11px] font-black text-[#8ea087] uppercase tracking-wider w-6 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#8ea087]">
                          From
                        </label>
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            updateSlot(day, slot.id, 'start', e.target.value)
                          }
                          className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#193c1f]"
                        />
                      </div>
                      <span className="text-[#d0d5cb] font-black mt-4">→</span>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#8ea087]">
                          To
                        </label>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            updateSlot(day, slot.id, 'end', e.target.value)
                          }
                          className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#193c1f]"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => removeSlot(day, slot.id)}
                      variant="ghost"
                      className="rounded-xl p-2 text-red-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      title="Remove slot"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        );
      })}

      {/* Empty State */}
      {activeDays.size === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#d0d5cb] p-12 flex flex-col items-center justify-center text-center">
          <Calendar size={40} className="text-[#d0d5cb] mb-4" />
          <p className="font-bold text-[#193c1f] opacity-40">
            No schedule configured
          </p>
          <p className="text-xs text-[#8ea087] mt-1">
            Select days above to start setting consultation hours.
          </p>
        </div>
      )}
    </div>
  );
}
