import type { DonationType } from '@/generated/prisma/enums';

export type DistributionTargetType = DonationType;

export interface DonationDistributionRecord {
  id: number;
  targetType: DistributionTargetType;
  reportId: number | null;
  amount: number;
  recipient: string;
  notes: string | null;
  distributedAt: string;
  createdById: string;
  createdAt: string;
  report?: {
    id: number;
    title: string;
    category: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface DonationDistributionSummary {
  totalPlatformDonations: number;
  totalReportDonations: number;
  totalDonations: number;
  totalDistributed: number;
  totalDistributedPlatform: number;
  totalDistributedReports: number;
  remainingPlatformBalance: number;
  remainingReportBalance: number;
  totalRemainingBalance: number;
  payoutPool: number;
  operationalPool: number;
}

export interface DonationDistributionGroup {
  id: string;
  targetType: DistributionTargetType;
  name: string;
  reportId?: number | null;
  reportTitle?: string | null;
  reportCategory?: string | null;
  incidentDate?: string | null;
  totalCollected: number;
  totalDistributed: number;
  remainingBalance: number;
  distributionCount: number;
  donationCount: number;
}

export interface DistributionGroupDonationItem {
  id: number;
  amount: number;
  timestamp: string;
  donorName: string;
  donorEmail?: string | null;
  paymentStatus: string;
  paymentMethod: string;
}

export interface DonationDistributionGroupDetail {
  group: DonationDistributionGroup;
  distributions: DonationDistributionRecord[];
  donations: DistributionGroupDonationItem[];
}

export interface CreateDistributionInput {
  targetType: DistributionTargetType;
  reportId?: number | null;
  amount: number;
  recipient: string;
  distributedAt?: string | Date | null;
  notes?: string | null;
}

export interface DistributionFilterQuery {
  targetType?: 'ALL' | DistributionTargetType;
  reportId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PsychologistPayoutItem {
  id: string;
  name: string;
  email: string;
  completedSessions: number;
  sessionRatio: number;
  payoutAmount: number;
}

export interface PsychologistPayoutSummary {
  currentMonth: {
    period: string;
    totalPlatformPool: number;
    payoutPool: number;
    operationalPool: number;
    totalCompletedSessions: number;
    psychologistCount: number;
    psychologists: PsychologistPayoutItem[];
  };
  history: {
    id: number;
    period: string;
    platformPool: number;
    payoutPool: number;
    totalCompletedSessions: number;
  }[];
}
