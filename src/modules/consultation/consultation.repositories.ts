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
