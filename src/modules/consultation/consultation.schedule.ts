import {
  getConsultationsByDate,
  getPsychologistSchedulesByDay,
} from './consultation.repositories';
import type { ConsultationScheduleSlot } from './consultation.types';

export const jsDayToPrismaDay = (jsDay: number) => (jsDay === 0 ? 7 : jsDay);

const formatTime = (date: Date) => {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(11, 16);
};

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

  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const currentWibDate = wibNow.toISOString().split('T')[0];
  const currentWibTime = wibNow.toISOString().slice(11, 16);

  // Assuming `date` or `selectedDate` effectively refers to the day being queried.
  // Because new Date("YYYY-MM-DD") converts to UTC midnight, its ISO string gives back "YYYY-MM-DD"
  const requestDateString = selectedDate.toISOString().split('T')[0];
  const isToday = requestDateString === currentWibDate;

  return Array.from(slotsByTime.entries())
    .map(([time, psychIds]) => {
      const psychologistIds = Array.from(psychIds);

      const bookedCount = bookingCountByTime[time] ?? 0;

      let available = psychologistIds.length > bookedCount;

      if (isToday && time < currentWibTime) {
        available = false;
      }

      return {
        time,
        psychologistCount: psychologistIds.length,
        bookedCount,
        available,
        availablePsychologistIds: psychologistIds,
      };
    })
    .sort((a, b) => (a.time > b.time ? 1 : -1));
};
