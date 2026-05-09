'use client';

import { Calendar, Clock } from 'lucide-react';
import React from 'react';

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

// ─── Dummy Data (will be replaced with API call once backend is ready) ────────

const DUMMY_MY_SCHEDULE: DaySchedule[] = [
  { day: 'Monday', slots: [{ id: 's1', start: '09:00', end: '12:00' }] },
  { day: 'Wednesday', slots: [{ id: 's2', start: '13:00', end: '17:00' }] },
  {
    day: 'Friday',
    slots: [
      { id: 's3', start: '08:00', end: '11:00' },
      { id: 's4', start: '14:00', end: '16:00' },
    ],
  },
];

const DAY_ORDER: Day[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
  new Date(),
) as Day;

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PsychologistScheduleView() {
  const schedule = DUMMY_MY_SCHEDULE;
  const orderedSchedule = DAY_ORDER.filter((day) =>
    schedule.some((d) => d.day === day),
  ).map((day) => schedule.find((d) => d.day === day)!);

  const totalSlots = schedule.reduce((acc, d) => acc + d.slots.length, 0);
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
          <h2 className="text-2xl font-black text-[#193C1F] tracking-tight">
            My Consultation Schedule
          </h2>
          <p className="text-sm text-[#8EA087] mt-1 font-medium">
            Your availability as configured by the admin.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8EA087]">
            Today
          </p>
          <p className="text-sm font-bold text-[#193C1F]">{today}</p>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white border border-[#D0D5CB] rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <Calendar size={18} className="text-[#8EA087]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8EA087]">
              Active Days
            </p>
            <p className="text-lg font-black text-[#193C1F]">
              {schedule.length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-[#D0D5CB] rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <Clock size={18} className="text-[#8EA087]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8EA087]">
              Total Slots
            </p>
            <p className="text-lg font-black text-[#193C1F]">{totalSlots}</p>
          </div>
        </div>
        <div className="bg-white border border-[#D0D5CB] rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <Clock size={18} className="text-[#8EA087]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8EA087]">
              Hours/Week
            </p>
            <p className="text-lg font-black text-[#193C1F]">{totalHours}h</p>
          </div>
        </div>
      </div>

      {/* Schedule Cards */}
      {schedule.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#D0D5CB] p-12 text-center">
          <Calendar size={40} className="text-[#D0D5CB] mx-auto mb-4" />
          <p className="font-bold text-[#193C1F] opacity-40">
            No schedule has been set yet
          </p>
          <p className="text-xs text-[#8EA087] mt-1">
            The admin will configure your availability. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orderedSchedule.map((daySchedule) => {
            const isToday = daySchedule.day === today;
            return (
              <div
                key={daySchedule.day}
                className={`rounded-3xl border p-6 shadow-sm transition-all ${
                  isToday
                    ? 'bg-[#193C1F] border-[#193C1F] text-white'
                    : 'bg-white border-[#D0D5CB]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isToday ? 'bg-white/20' : 'bg-[#193C1F]'
                      }`}
                    >
                      <Calendar
                        size={16}
                        className={isToday ? 'text-white' : 'text-white'}
                      />
                    </div>
                    <h3
                      className={`font-black text-base ${isToday ? 'text-white' : 'text-[#193C1F]'}`}
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
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#F7F3ED] text-[#8EA087] px-3 py-1 rounded-full">
                      {daySchedule.slots.length} slot
                      {daySchedule.slots.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {daySchedule.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                        isToday ? 'bg-white/10' : 'bg-[#F7F3ED]'
                      }`}
                    >
                      <Clock
                        size={14}
                        className={isToday ? 'text-white/70' : 'text-[#8EA087]'}
                      />
                      <span
                        className={`text-sm font-bold ${isToday ? 'text-white' : 'text-[#193C1F]'}`}
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
