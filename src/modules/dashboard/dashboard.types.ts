import type { ConsultationModel } from '@/generated/prisma/models/Consultation';
import type { UserModel } from '@/generated/prisma/models/User';

export type DashboardConsultationUser = Pick<
  UserModel,
  'id' | 'name' | 'image'
>;

export type DashboardConsultation = ConsultationModel & {
  user: DashboardConsultationUser;
};

export type PsychologistDashboardStats = {
  pendingConsultationCount: number;
  totalConsultationCount: number;
  completedConsultationCount: number;
  monthlyEarnings: number;
  recentConsultations: DashboardConsultation[];
  completedConsultations: DashboardConsultation[];
};

export type AdminDashboardStatusChart = {
  status: string;
  count: number;
};

export type AdminDashboardDonationChartPoint = {
  date: string;
  total: number;
  count: number;
};

export type AdminDashboardDonationTotals = {
  allTime: number;
  today: number;
  month: number;
};

export type AdminDashboardRecentDonation = {
  id: number;
  amount: number;
  paymentMethod: string;
  timestamp: string;
  donationType: string;
  user: {
    name: string;
    email: string;
  };
  report: {
    title: string;
  } | null;
};

export type AdminDashboardData = {
  totalReports: number;
  pendingReports: number;
  reportsChartData: AdminDashboardStatusChart[];
  totalConsultations: number;
  activeConsultations: number;
  consultChartData: AdminDashboardStatusChart[];
  totalDonationsCount: number;
  donationTotals: AdminDashboardDonationTotals;
  totalChats: number;
  donationChartData: AdminDashboardDonationChartPoint[];
  recentDonations: AdminDashboardRecentDonation[];
};
