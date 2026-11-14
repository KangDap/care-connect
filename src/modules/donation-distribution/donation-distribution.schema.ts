import { Errors } from '@/lib/error';
import { z } from 'zod';

import type {
  CreateDistributionInput,
  DistributionFilterQuery,
} from './donation-distribution.types';

export const CREATE_DISTRIBUTION_SCHEMA = z
  .object({
    targetType: z.enum(['PLATFORM', 'REPORT'], {
      message: 'targetType must be PLATFORM or REPORT',
    }),
    reportId: z.coerce.number().int().positive().optional().nullable(),
    amount: z.coerce
      .number()
      .positive('amount must be a positive number')
      .max(1_000_000_000, 'amount is too large'),
    recipient: z
      .string()
      .min(1, 'recipient is required')
      .max(255, 'recipient is too long'),
    distributedAt: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.targetType === 'REPORT' && !data.reportId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reportId'],
        message: 'reportId is required when targetType is REPORT',
      });
    }
  });

export const QUERY_DISTRIBUTION_SCHEMA = z.object({
  targetType: z.enum(['ALL', 'PLATFORM', 'REPORT']).optional().default('ALL'),
  reportId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export class DonationDistributionSchema {
  static validateCreateDistribution(payload: unknown): CreateDistributionInput {
    const parseResult = CREATE_DISTRIBUTION_SCHEMA.safeParse(payload);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid distribution data: ${errorMessage}`);
    }

    return parseResult.data;
  }

  static validateQuery(
    params: Record<string, unknown> | URLSearchParams,
  ): DistributionFilterQuery {
    const raw =
      params instanceof URLSearchParams
        ? Object.fromEntries(params.entries())
        : params;

    const parseResult = QUERY_DISTRIBUTION_SCHEMA.safeParse(raw);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid query parameters: ${errorMessage}`);
    }

    return parseResult.data;
  }
}
