import {
  getConsultationsByDate,
  getPsychologistSchedulesByDay,
} from './consultation.repositories';
import type { ConsultationScheduleSlot } from './consultation.types';

// convert JS day (0-6) → prisma (1-7)
export const jsDayToPrismaDay = (jsDay: number) => (jsDay === 0 ? 7 : jsDay);

// format Date → "HH:mm"
const formatTime = (date: Date) => {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(11, 16);
};

// generate hourly slots (WIB string)
const getHourlySlots = (startTime: Date, endTime: Date) => {
  const slots: string[] = [];

  const current = new Date(startTime);

  while (current < endTime) {
    slots.push(formatTime(current));

    current.setHours(current.getHours() + 1);
  }

  return slots;
};

export const getScheduleAvailabilityForDate = async (
  date: string,
): Promise<ConsultationScheduleSlot[]> => {
  const selectedDate = new Date(date);

  if (Number.isNaN(selectedDate.getTime())) {
    throw new Error('Invalid date');
  }

  const dayOfWeek = jsDayToPrismaDay(selectedDate.getDay());

  const schedules = await getPsychologistSchedulesByDay(dayOfWeek);

  const slotsByTime = new Map<string, Set<string>>();

  schedules.forEach((schedule) => {
    const scheduleSlots = getHourlySlots(schedule.startTime, schedule.endTime);

    scheduleSlots.forEach((slot) => {
      const set = slotsByTime.get(slot) ?? new Set<string>();
      set.add(schedule.userId);
      slotsByTime.set(slot, set);
    });
  });

  if (slotsByTime.size === 0) {
    return [];
  }

  const consultations = await getConsultationsByDate(selectedDate);

  const bookingCountByTime: Record<string, number> = {};

  consultations.forEach((consultation) => {
    const time = formatTime(consultation.time);
    bookingCountByTime[time] = (bookingCountByTime[time] ?? 0) + 1;
  });

  return Array.from(slotsByTime.entries())
    .map(([time, psychIds]) => {
      const psychologistIds = Array.from(psychIds);

      const bookedCount = bookingCountByTime[time] ?? 0;

      return {
        time,
        psychologistCount: psychologistIds.length,
        bookedCount,
        available: psychologistIds.length > bookedCount,
        availablePsychologistIds: psychologistIds,
      };
    })
    .sort((a, b) => (a.time > b.time ? 1 : -1));
};
