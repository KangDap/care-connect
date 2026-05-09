'use client';

import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

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

interface PsychologistSchedule {
  psychologistId: string;
  schedule: DaySchedule[];
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_PSYCHOLOGISTS = [
  {
    id: 'psy-1',
    name: 'Dr. Anika Sari, M.Psi',
    specialization: 'Anxiety & Depression',
    image: null,
  },
  {
    id: 'psy-2',
    name: 'Dr. Budi Santoso, M.Psi',
    specialization: 'Trauma & PTSD',
    image: null,
  },
  {
    id: 'psy-3',
    name: 'Dr. Clara Dewi, M.Psi',
    specialization: 'Child & Adolescent',
    image: null,
  },
  {
    id: 'psy-4',
    name: 'Dr. Dimas Pratama, M.Psi',
    specialization: 'Relationships & Family',
    image: null,
  },
];

const DAYS: Day[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_SHORT: Record<Day, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const INITIAL_SCHEDULES: Record<string, PsychologistSchedule> = {
  'psy-1': {
    psychologistId: 'psy-1',
    schedule: [
      { day: 'Monday', slots: [{ id: 's1', start: '09:00', end: '12:00' }] },
      { day: 'Wednesday', slots: [{ id: 's2', start: '13:00', end: '17:00' }] },
    ],
  },
  'psy-2': {
    psychologistId: 'psy-2',
    schedule: [
      { day: 'Tuesday', slots: [{ id: 's3', start: '08:00', end: '11:00' }] },
      { day: 'Thursday', slots: [{ id: 's4', start: '14:00', end: '18:00' }] },
    ],
  },
  'psy-3': { psychologistId: 'psy-3', schedule: [] },
  'psy-4': { psychologistId: 'psy-4', schedule: [] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).substring(2, 9);

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminSchedulePage() {
  const [selectedPsyId, setSelectedPsyId] = useState<string>(
    DUMMY_PSYCHOLOGISTS[0].id,
  );
  const [schedules, setSchedules] =
    useState<Record<string, PsychologistSchedule>>(INITIAL_SCHEDULES);
  const [activeDays, setActiveDays] = useState<Record<string, Set<Day>>>(() => {
    const init: Record<string, Set<Day>> = {};
    for (const psy of DUMMY_PSYCHOLOGISTS) {
      init[psy.id] = new Set(
        (INITIAL_SCHEDULES[psy.id]?.schedule ?? []).map((d) => d.day),
      );
    }
    return init;
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedPsy = DUMMY_PSYCHOLOGISTS.find((p) => p.id === selectedPsyId)!;
  const currentSchedule = schedules[selectedPsyId]?.schedule ?? [];
  const currentActiveDays = activeDays[selectedPsyId] ?? new Set<Day>();

  // Toggle whether a day is active
  const toggleDay = (day: Day) => {
    const newActive = new Set(currentActiveDays);
    if (newActive.has(day)) {
      newActive.delete(day);
      setSchedules((prev) => ({
        ...prev,
        [selectedPsyId]: {
          ...prev[selectedPsyId],
          schedule: (prev[selectedPsyId]?.schedule ?? []).filter(
            (d) => d.day !== day,
          ),
        },
      }));
    } else {
      newActive.add(day);
      const alreadyExists = currentSchedule.some((d) => d.day === day);
      if (!alreadyExists) {
        setSchedules((prev) => ({
          ...prev,
          [selectedPsyId]: {
            psychologistId: selectedPsyId,
            schedule: [
              ...(prev[selectedPsyId]?.schedule ?? []),
              { day, slots: [{ id: uid(), start: '09:00', end: '17:00' }] },
            ],
          },
        }));
      }
    }
    setActiveDays((prev) => ({ ...prev, [selectedPsyId]: newActive }));
  };

  // Add a time slot to a day
  const addSlot = (day: Day) => {
    setSchedules((prev) => {
      const existing = prev[selectedPsyId]?.schedule ?? [];
      return {
        ...prev,
        [selectedPsyId]: {
          psychologistId: selectedPsyId,
          schedule: existing.map((d) =>
            d.day === day
              ? {
                  ...d,
                  slots: [
                    ...d.slots,
                    { id: uid(), start: '09:00', end: '17:00' },
                  ],
                }
              : d,
          ),
        },
      };
    });
  };

  // Remove a time slot
  const removeSlot = (day: Day, slotId: string) => {
    setSchedules((prev) => {
      const existing = prev[selectedPsyId]?.schedule ?? [];
      return {
        ...prev,
        [selectedPsyId]: {
          psychologistId: selectedPsyId,
          schedule: existing.map((d) =>
            d.day === day
              ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
              : d,
          ),
        },
      };
    });
  };

  // Update slot time
  const updateSlot = (
    day: Day,
    slotId: string,
    field: 'start' | 'end',
    value: string,
  ) => {
    setSchedules((prev) => {
      const existing = prev[selectedPsyId]?.schedule ?? [];
      return {
        ...prev,
        [selectedPsyId]: {
          psychologistId: selectedPsyId,
          schedule: existing.map((d) =>
            d.day === day
              ? {
                  ...d,
                  slots: d.slots.map((s) =>
                    s.id === slotId ? { ...s, [field]: value } : s,
                  ),
                }
              : d,
          ),
        },
      };
    });
  };

  const handleSave = () => {
    // NOTE: Backend API not yet implemented. When ready, POST to /api/admin/schedules.
    console.log('[DUMMY SAVE] Schedule data:', schedules[selectedPsyId]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const daySchedule = (day: Day) => currentSchedule.find((d) => d.day === day);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#193C1F] tracking-tight">
            Psychologist Schedules
          </h1>
          <p className="text-sm text-[#8EA087] mt-1 font-medium">
            Set available consultation days and time slots for each
            psychologist.
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
            saveSuccess
              ? 'bg-green-500 text-white scale-95'
              : 'bg-[#193C1F] text-white hover:bg-[#2d5c36]'
          }`}
        >
          {saveSuccess ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : (
            <>
              <Calendar size={16} /> Save Schedule
            </>
          )}
        </button>
      </div>

      {/* Psychologist Selector */}
      <div className="bg-white rounded-3xl border border-[#D0D5CB] p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8EA087] mb-4">
          Select Psychologist
        </p>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-[#F7F3ED] border border-[#D0D5CB] rounded-2xl hover:border-[#8EA087] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D0D5CB] flex items-center justify-center text-[#8EA087] shrink-0">
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#193C1F]">
                  {selectedPsy.name}
                </p>
                <p className="text-[10px] text-[#8EA087] font-medium">
                  {selectedPsy.specialization}
                </p>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-[#8EA087] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D0D5CB] rounded-2xl shadow-xl z-20 overflow-hidden">
              {DUMMY_PSYCHOLOGISTS.map((psy) => (
                <button
                  key={psy.id}
                  onClick={() => {
                    setSelectedPsyId(psy.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-[#F7F3ED] transition-colors text-left ${
                    psy.id === selectedPsyId ? 'bg-[#F7F3ED]' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#D0D5CB] flex items-center justify-center text-[#8EA087] shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#193C1F]">
                      {psy.name}
                    </p>
                    <p className="text-[10px] text-[#8EA087]">
                      {psy.specialization}
                    </p>
                  </div>
                  {psy.id === selectedPsyId && (
                    <Check size={16} className="ml-auto text-[#8EA087]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Day Picker */}
      <div className="bg-white rounded-3xl border border-[#D0D5CB] p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8EA087] mb-4">
          Available Days
        </p>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => {
            const isActive = currentActiveDays.has(day);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all duration-150 ${
                  isActive
                    ? 'bg-[#193C1F] text-white border-[#193C1F] shadow-sm'
                    : 'bg-white text-[#193C1F] border-[#D0D5CB] hover:border-[#8EA087]'
                }`}
              >
                {isActive ? (
                  <Check size={14} />
                ) : (
                  <Plus size={14} className="opacity-40" />
                )}
                {DAY_SHORT[day]}
              </button>
            );
          })}
        </div>
        {currentActiveDays.size === 0 && (
          <p className="text-xs text-[#8EA087] mt-4 italic">
            No days selected. Click a day to add availability.
          </p>
        )}
      </div>

      {/* Time Slot Editor per Day */}
      {DAYS.filter((day) => currentActiveDays.has(day)).map((day) => {
        const ds = daySchedule(day);
        const slots = ds?.slots ?? [];
        return (
          <div
            key={day}
            className="bg-white rounded-3xl border border-[#D0D5CB] p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#193C1F] flex items-center justify-center">
                  <Clock size={16} className="text-white" />
                </div>
                <h3 className="font-black text-[#193C1F]">{day}</h3>
              </div>
              <button
                onClick={() => addSlot(day)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#8EA087] border border-[#D0D5CB] hover:border-[#8EA087] hover:bg-[#F7F3ED] px-3 py-1.5 rounded-xl transition-all"
              >
                <Plus size={13} /> Add Slot
              </button>
            </div>

            <div className="space-y-3">
              {slots.length === 0 ? (
                <p className="text-xs text-[#8EA087] italic">
                  No time slots yet. Click &quot;Add Slot&quot;.
                </p>
              ) : (
                slots.map((slot, idx) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-4 bg-[#F7F3ED] rounded-2xl px-5 py-3 group"
                  >
                    <span className="text-[11px] font-black text-[#8EA087] uppercase tracking-wider w-6 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#8EA087]">
                          From
                        </label>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            updateSlot(day, slot.id, 'start', e.target.value)
                          }
                          className="bg-white border border-[#D0D5CB] rounded-xl px-3 py-2 text-sm font-bold text-[#193C1F] focus:outline-none focus:border-[#8EA087] transition-colors"
                        />
                      </div>
                      <span className="text-[#D0D5CB] font-black mt-4">→</span>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#8EA087]">
                          To
                        </label>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            updateSlot(day, slot.id, 'end', e.target.value)
                          }
                          className="bg-white border border-[#D0D5CB] rounded-xl px-3 py-2 text-sm font-bold text-[#193C1F] focus:outline-none focus:border-[#8EA087] transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeSlot(day, slot.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Remove slot"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {currentActiveDays.size === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#D0D5CB] p-12 flex flex-col items-center justify-center text-center">
          <Calendar size={40} className="text-[#D0D5CB] mb-4" />
          <p className="font-bold text-[#193C1F] opacity-40">
            No schedule configured
          </p>
          <p className="text-xs text-[#8EA087] mt-1">
            Select days above to start setting consultation hours.
          </p>
        </div>
      )}

      {/* Backend Note Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <X size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-700">
            Frontend Only — Backend Pending
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Data is currently stored in local state only. Once the backend API{' '}
            <code className="bg-amber-100 px-1 rounded">
              POST /api/admin/schedules
            </code>{' '}
            is ready, connect the <strong>Save Schedule</strong> button to
            persist this data.
          </p>
        </div>
      </div>
    </div>
  );
}
