import { prisma } from '@/lib/prisma';

import type { CreateDonationRepositoryInput } from './donation.types';

export const findReportById = async (reportId: number) => {
  return prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      title: true,
    },
  });
};

export const createDonation = async (input: CreateDonationRepositoryInput) => {
  return prisma.donation.create({
    data: input,
    select: {
      id: true,
      reportId: true,
      amount: true,
      paymentMethod: true,
      paymentStatus: true,
      timestamp: true,
    },
  });
};

export const updateDonationStatus = async (
  donationId: number,
  paymentStatus: CreateDonationRepositoryInput['paymentStatus'],
) => {
  return prisma.donation.update({
    where: { id: donationId },
    data: { paymentStatus },
    select: {
      id: true,
      paymentStatus: true,
    },
  });
};

export const findDonationById = async (donationId: number) => {
  return prisma.donation.findUnique({
    where: { id: donationId },
    select: {
      id: true,
      userId: true,
      paymentStatus: true,
    },
  });
};

export const getDonationsByUserId = async (userId: string) => {
  return prisma.donation.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      reportId: true,
      amount: true,
      paymentMethod: true,
      paymentStatus: true,
      timestamp: true,
    },
  });
};
