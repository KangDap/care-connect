import { ApiError, Errors } from '@/lib/error';

import { getPsychologistDashboardStats } from './dashboard.repositories';
import type { PsychologistDashboardStats } from './dashboard.types';

export class DashboardService {
  static async getPsychologistDashboard(
    psychologistId: string,
  ): Promise<PsychologistDashboardStats> {
    try {
      const stats = await getPsychologistDashboardStats(psychologistId);
      return stats;
    } catch (error) {
      console.error('DASHBOARD SERVICE ERROR:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw Errors.unprocessable(
        'Failed to fetch psychologist dashboard stats',
      );
    }
  }
}
