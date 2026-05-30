'use client';

import { AlertCircle, Calendar, Clock, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface ScheduleApiResponse {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAY_ORDER: Day[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const REV_DAY_MAP: Record<number, Day> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PsychologistScheduleView() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<Day | null>(null);

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
        new Date(),
      ) as Day,
    );
  }, []);

  useEffect(() => {
    const fetchMySchedule = async () => {
      try {
        const res = await fetch('/api/dashboard/psikolog/schedule');
        const data = await res.json();

        if (data.success) {
          // Group API data by day
          const grouped: Record<string, TimeSlot[]> = {};
          data.data.forEach((s: ScheduleApiResponse) => {
            const dayName = REV_DAY_MAP[s.dayOfWeek];
            if (!dayName) return;
            if (!grouped[dayName]) grouped[dayName] = [];
            grouped[dayName].push({
              id: s.id,
              start: s.startTime,
              end: s.endTime,
            });
          });

          // Convert to DaySchedule array
          const scheduleList: DaySchedule[] = Object.entries(grouped).map(
            ([day, slots]) => ({
              day: day as Day,
              slots,
            }),
          );

          setSchedule(scheduleList);
        } else {
          setError(data.error?.message || 'Failed to fetch schedule');
        }
      } catch (err) {
        console.error('Fetch schedule error:', err);
        setError('An unexpected error occurred while loading your schedule.');
      } finally {
        setLoading(false);
      }
    };

    fetchMySchedule();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-[#193c1f]" size={40} />
        <p className="text-[#8ea087] font-medium animate-pulse">
          Loading your schedule...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center max-w-2xl mx-auto">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-red-900 font-bold text-lg mb-2">
          An Error Occurred
        </h3>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  const orderedSchedule = DAY_ORDER.filter((day) =>
    schedule.some((d) => d.day === day),
  ).map((day) => schedule.find((d) => d.day === day)!);

  const totalSlots = schedule.reduce((acc, d) => {
    const slotsInDay = d.slots.reduce((a, s) => {
      const [sh] = s.start.split(':').map(Number);
      const [eh] = s.end.split(':').map(Number);
      return a + (eh - sh);
    }, 0);
    return acc + slotsInDay;
  }, 0);

  const totalHours = schedule.reduce((acc, d) => {
    const h = d.slots.reduce((a, s) => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return a + (eh + em / 60 - (sh + sm / 60));
    }, 0);
    return acc + h;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#193c1f] tracking-tight">
            My Consultation Schedule
          </h2>
          <p className="text-sm text-[#8ea087] mt-1 font-medium">
            Your availability schedule configured by Admin.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8ea087]">
            Today
          </p>
          <p className="text-sm font-bold text-[#193c1f]">{today ?? '-'}</p>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-[#d0d5cb] rounded-xl px-2 py-2 flex items-center gap-2 shadow-sm">
          <Calendar size={14} className="text-[#8ea087] shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#8ea087] truncate">
              Active Days
            </p>
            <p className="text-base font-black text-[#193c1f]">
              {schedule.length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-[#d0d5cb] rounded-xl px-2 py-2 flex items-center gap-2 shadow-sm">
          <Clock size={14} className="text-[#8ea087] shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#8ea087] truncate">
              Total Slots
            </p>
            <p className="text-base font-black text-[#193c1f]">{totalSlots}</p>
          </div>
        </div>
        <div className="bg-white border border-[#d0d5cb] rounded-xl px-2 py-2 flex items-center gap-2 shadow-sm">
          <Clock size={14} className="text-[#8ea087] shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#8ea087] truncate">
              Hours/Week
            </p>
            <p className="text-base font-black text-[#193c1f]">
              {Math.round(totalHours * 10) / 10}h
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Cards */}
      {schedule.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#d0d5cb] p-12 text-center">
          <Calendar size={40} className="text-[#d0d5cb] mx-auto mb-4" />
          <p className="font-bold text-[#193c1f] opacity-40">
            No schedule has been configured yet
          </p>
          <p className="text-xs text-[#8ea087] mt-1">
            Admin will configure your availability schedule. Please check again
            later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orderedSchedule.map((daySchedule) => {
            const isToday = today ? daySchedule.day === today : false;
            return (
              <div
                key={daySchedule.day}
                className={`rounded-3xl border p-6 shadow-sm transition-all ${
                  isToday
                    ? 'bg-[#193c1f] border-[#193c1f] text-white shadow-lg shadow-[#193c1f]/20'
                    : 'bg-white border-[#d0d5cb] hover:border-[#8ea087]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isToday ? 'bg-white/20' : 'bg-[#193c1f]'
                      }`}
                    >
                      <Calendar size={16} className="text-white" />
                    </div>
                    <h3
                      className={`font-black text-base ${isToday ? 'text-white' : 'text-[#193c1f]'}`}
                    >
                      {daySchedule.day}
                    </h3>
                  </div>
                  {isToday && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full">
                      Today
                    </span>
                  )}
                  {!isToday && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#f7f3ed] text-[#8ea087] px-3 py-1 rounded-full">
                      {daySchedule.slots.reduce((a, s) => {
                        const [sh] = s.start.split(':').map(Number);
                        const [eh] = s.end.split(':').map(Number);
                        return a + (eh - sh);
                      }, 0)}{' '}
                      slots
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {daySchedule.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                        isToday ? 'bg-white/10' : 'bg-[#f7f3ed]'
                      }`}
                    >
                      <Clock
                        size={14}
                        className={isToday ? 'text-white/70' : 'text-[#8ea087]'}
                      />
                      <span
                        className={`text-sm font-bold ${isToday ? 'text-white' : 'text-[#193c1f]'}`}
                      >
                        {formatTime(slot.start)} – {formatTime(slot.end)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
