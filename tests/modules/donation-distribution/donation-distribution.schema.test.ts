import { ApiError } from '@/lib/error';
import { DonationDistributionSchema } from '@/modules/donation-distribution/donation-distribution.schema';
import { describe, expect, it } from 'vitest';

describe('DonationDistributionSchema.validateCreateDistribution', () => {
  it('validates valid REPORT distribution input', () => {
    const input = {
      targetType: 'REPORT',
      reportId: 5,
      amount: 1500000,
      recipient: 'Panti Asuhan Kasih',
      notes: 'Bantuan santunan medis',
      distributedAt: '2026-10-10T10:00:00Z',
    };

    const result = DonationDistributionSchema.validateCreateDistribution(input);

    expect(result).toEqual({
      targetType: 'REPORT',
      reportId: 5,
      amount: 1500000,
      recipient: 'Panti Asuhan Kasih',
      notes: 'Bantuan santunan medis',
      distributedAt: '2026-10-10T10:00:00Z',
    });
  });

  it('validates valid PLATFORM distribution input without reportId', () => {
    const input = {
      targetType: 'PLATFORM',
      amount: 5000000,
      recipient: 'Operasional Server & Cloud',
      notes: 'Pembayaran hosting',
    };

    const result = DonationDistributionSchema.validateCreateDistribution(input);

    expect(result).toMatchObject({
      targetType: 'PLATFORM',
      amount: 5000000,
      recipient: 'Operasional Server & Cloud',
      notes: 'Pembayaran hosting',
    });
  });

  it('throws ApiError when targetType is REPORT but reportId is missing', () => {
    const input = {
      targetType: 'REPORT',
      amount: 100000,
      recipient: 'Korban A',
    };

    expect(() =>
      DonationDistributionSchema.validateCreateDistribution(input),
    ).toThrow(ApiError);
  });

  it('throws ApiError when amount is non-positive or missing', () => {
    const input = {
      targetType: 'PLATFORM',
      amount: 0,
      recipient: 'Server',
    };

    expect(() =>
      DonationDistributionSchema.validateCreateDistribution(input),
    ).toThrow(ApiError);

    expect(() =>
      DonationDistributionSchema.validateCreateDistribution({
        ...input,
        amount: -50000,
      }),
    ).toThrow(ApiError);
  });

  it('throws ApiError when recipient is empty', () => {
    const input = {
      targetType: 'PLATFORM',
      amount: 100000,
      recipient: '',
    };

    expect(() =>
      DonationDistributionSchema.validateCreateDistribution(input),
    ).toThrow(ApiError);
  });

  it('throws ApiError when targetType is invalid', () => {
    const input = {
      targetType: 'INVALID',
      amount: 100000,
      recipient: 'Test',
    };

    expect(() =>
      DonationDistributionSchema.validateCreateDistribution(input),
    ).toThrow(ApiError);
  });
});

describe('DonationDistributionSchema.validateQuery', () => {
  it('parses default query parameters', () => {
    const result = DonationDistributionSchema.validateQuery({});

    expect(result).toEqual({
      targetType: 'ALL',
      page: 1,
      limit: 10,
    });
  });

  it('parses URLSearchParams with filters correctly', () => {
    const params = new URLSearchParams({
      targetType: 'REPORT',
      reportId: '12',
      search: 'Panti',
      page: '2',
      limit: '20',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    const result = DonationDistributionSchema.validateQuery(params);

    expect(result).toEqual({
      targetType: 'REPORT',
      reportId: 12,
      search: 'Panti',
      page: 2,
      limit: 20,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });

  it('throws ApiError on invalid pagination input', () => {
    expect(() => DonationDistributionSchema.validateQuery({ page: 0 })).toThrow(
      ApiError,
    );

    expect(() =>
      DonationDistributionSchema.validateQuery({ limit: 150 }),
    ).toThrow(ApiError);
  });
});
