import {
  getScheduleAvailabilityForDate,
  jsDayToPrismaDay,
} from '@/modules/consultation/consultation.schedule';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPsychologistSchedulesByDay: vi.fn(),
  getConsultationsByDate: vi.fn(),
}));

vi.mock('@/modules/consultation/consultation.repositories', () => ({
  getPsychologistSchedulesByDay: mocks.getPsychologistSchedulesByDay,
  getConsultationsByDate: mocks.getConsultationsByDate,
}));

describe('consultation.schedule helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T01:00:00.000Z'));

    mocks.getPsychologistSchedulesByDay.mockReset();
    mocks.getConsultationsByDate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [0, 7],
    [1, 1],
    [2, 2],
    [6, 6],
  ])('maps JavaScript day %s to Prisma day %s', (jsDay, prismaDay) => {
    expect(jsDayToPrismaDay(jsDay)).toBe(prismaDay);
  });

  it('returns empty array when no psychologist schedule exists', async () => {
    mocks.getPsychologistSchedulesByDay.mockResolvedValue([]);

    const result = await getScheduleAvailabilityForDate('2026-06-02');

    expect(result).toEqual([]);
    expect(mocks.getConsultationsByDate).not.toHaveBeenCalled();
  });

  it('builds hourly slots from psychologist schedules in WIB time', async () => {
    mocks.getPsychologistSchedulesByDay.mockResolvedValue([
      {
        userId: 'psy-1',
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 5, 0)),
      },
    ]);

    mocks.getConsultationsByDate.mockResolvedValue([]);

    const result = await getScheduleAvailabilityForDate('2026-06-02');

    expect(result.map((slot) => slot.time)).toEqual([
      '09:00',
      '10:00',
      '11:00',
    ]);

    expect(result[0]).toMatchObject({
      psychologistCount: 1,
      bookedCount: 0,
      available: true,
      availablePsychologistIds: ['psy-1'],
    });
  });

  it('combines psychologist ids when several psychologists have the same slot', async () => {
    mocks.getPsychologistSchedulesByDay.mockResolvedValue([
      {
        userId: 'psy-1',
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 4, 0)),
      },
      {
        userId: 'psy-2',
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 3, 0)),
      },
    ]);

    mocks.getConsultationsByDate.mockResolvedValue([]);

    const result = await getScheduleAvailabilityForDate('2026-06-02');

    expect(result[0]).toMatchObject({
      time: '09:00',
      psychologistCount: 2,
      availablePsychologistIds: ['psy-1', 'psy-2'],
    });

    expect(result[1]).toMatchObject({
      time: '10:00',
      psychologistCount: 1,
      availablePsychologistIds: ['psy-1'],
    });
  });

  it('marks slot unavailable when all psychologists are already booked', async () => {
    mocks.getPsychologistSchedulesByDay.mockResolvedValue([
      {
        userId: 'psy-1',
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 3, 0)),
      },
    ]);

    mocks.getConsultationsByDate.mockResolvedValue([
      {
        time: new Date(Date.UTC(1970, 0, 1, 2, 0)),
      },
    ]);

    const result = await getScheduleAvailabilityForDate('2026-06-02');

    expect(result[0]).toMatchObject({
      time: '09:00',
      psychologistCount: 1,
      bookedCount: 1,
      available: false,
    });
  });

  it('keeps slot available when booking count is lower than psychologist count', async () => {
    mocks.getPsychologistSchedulesByDay.mockResolvedValue([
      {
        userId: 'psy-1',
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 3, 0)),
      },
      {
        userId: 'psy-2',
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 3, 0)),
      },
    ]);

    mocks.getConsultationsByDate.mockResolvedValue([
      {
        time: new Date(Date.UTC(1970, 0, 1, 2, 0)),
      },
    ]);

    const result = await getScheduleAvailabilityForDate('2026-06-02');

    expect(result[0]).toMatchObject({
      bookedCount: 1,
      psychologistCount: 2,
      available: true,
    });
  });

  it('marks past slots today as unavailable', async () => {
    vi.setSystemTime(new Date('2026-06-01T06:30:00.000Z'));

    mocks.getPsychologistSchedulesByDay.mockResolvedValue([
      {
        userId: 'psy-1',
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 9, 0)),
      },
    ]);

    mocks.getConsultationsByDate.mockResolvedValue([]);

    const result = await getScheduleAvailabilityForDate('2026-06-01');

    expect(result.find((slot) => slot.time === '09:00')?.available).toBe(false);
    expect(result.find((slot) => slot.time === '14:00')?.available).toBe(true);
  });

  it('throws error for invalid date input', async () => {
    await expect(
      getScheduleAvailabilityForDate('invalid-date'),
    ).rejects.toThrow('Invalid date');
  });
});
