import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

import type {
  CreateConsultationRepositoryInput,
  FindExistingConsultationInput,
  PsychologistScheduleRecord,
} from './consultation.types';

export const getPsychologistSchedulesByDay = async (
  dayOfWeek: number,
): Promise<PsychologistScheduleRecord[]> => {
  return prisma.schedule.findMany({
    where: { dayOfWeek },
    select: {
      userId: true,
      startTime: true,
      endTime: true,
    },
  });
};

export const getConsultationsByDate = async (date: Date) => {
  return prisma.consultation.findMany({
    where: { date },
    select: {
      time: true,
      psychologistId: true,
    },
  });
};

export const createConsultation = async (
  consultationData: CreateConsultationRepositoryInput,
) => {
  return prisma.consultation.create({
    data: consultationData,
  });
};

export const findExistingConsultation = async (
  data: FindExistingConsultationInput,
) => {
  return prisma.consultation.findFirst({ where: data });
};

// Schedule Management Repositories
export const getActivePsychologists = async () => {
  return prisma.user.findMany({
    where: {
      role: 'PSYCHOLOGIST',
      NOT: {
        banned: true,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
      schedules: {
        select: {
          dayOfWeek: true,
        },
      },
    },
  });
};

export const deleteSchedulesByUserId = async (userId: string) => {
  return prisma.schedule.deleteMany({
    where: { userId },
  });
};

export const createManySchedules = async (
  data: Prisma.ScheduleCreateManyInput[],
) => {
  return prisma.schedule.createMany({
    data,
  });
};

export const getSchedulesByUserId = async (userId: string) => {
  return prisma.schedule.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};
