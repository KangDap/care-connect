import { AIService } from '@/modules/ai/ai.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getReportsByIds: vi.fn(),
  getConsultationsByIds: vi.fn(),
  getRecentReports: vi.fn(),
  getReportsByStartDate: vi.fn(),
  getConsultationsByStartDate: vi.fn(),
}));

vi.mock('@/modules/ai/ai.repositories', () => ({
  AIRepository: {
    getReportsByIds: mocks.getReportsByIds,
    getConsultationsByIds: mocks.getConsultationsByIds,
    getRecentReports: mocks.getRecentReports,
    getReportsByStartDate: mocks.getReportsByStartDate,
    getConsultationsByStartDate: mocks.getConsultationsByStartDate,
  },
}));

describe('AIService - classify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('classifies custom text input', async () => {
    const mockResponseData = {
      status: 'ok',
      processed_count: 1,
      duration_ms: 25.5,
      results: [
        {
          text: 'Saya merasa cemas dan dipukul oleh teman',
          predicted_category: 'Bullying',
          confidence: 0.85,
          probabilities: {
            Bullying: 0.85,
            Harassment: 0.1,
            Other: 0.05,
          },
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const result = await AIService.classify({
      text: 'Saya merasa cemas dan dipukul oleh teman',
    });

    expect(result).toEqual(mockResponseData);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/dashboard/admin/ai/classify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('fetches reports by ID when reportIds are provided', async () => {
    mocks.getReportsByIds.mockResolvedValueOnce([
      {
        id: 'RPT-1',
        title: 'Ancaman verbal',
        description: 'Korban diancam di sekolah',
        category: 'Bullying',
      },
    ]);

    const mockResponseData = {
      status: 'ok',
      processed_count: 1,
      duration_ms: 15.0,
      results: [
        {
          id: 'RPT-1',
          text: 'Ancaman verbal Korban diancam di sekolah',
          predicted_category: 'Bullying',
          confidence: 0.92,
          probabilities: { Bullying: 0.92 },
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const result = await AIService.classify({
      reportIds: ['RPT-1'],
    });

    expect(mocks.getReportsByIds).toHaveBeenCalledWith(['RPT-1']);
    expect(result).toEqual(mockResponseData);
  });

  it('fetches consultations by ID when consultationIds are provided', async () => {
    mocks.getConsultationsByIds.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Konsultasi Stres Kuliah',
        description: 'Stres dengan tugas dan ujian',
        category: 'Academic Stress',
      },
    ]);

    const mockResponseData = {
      status: 'ok',
      processed_count: 1,
      duration_ms: 12.0,
      results: [
        {
          id: 1,
          text: 'Konsultasi Stres Kuliah Stres dengan tugas dan ujian',
          predicted_category: 'Academic Stress',
          confidence: 0.95,
          probabilities: { 'Academic Stress': 0.95 },
        },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const result = await AIService.classify({
      consultationIds: [1],
    });

    expect(mocks.getConsultationsByIds).toHaveBeenCalledWith([1]);
    expect(result).toEqual(mockResponseData);
  });

  it('throws unprocessable error when FastApi service returns non-200', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () =>
        JSON.stringify({ detail: 'Classifier model not available' }),
    } as Response);

    await expect(AIService.classify({ text: 'Tes error' })).rejects.toThrow(
      'AI Classification failed: Classifier model not available',
    );
  });
});

describe('AIService - getStatisticalAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates separate statistics, modes, and stratified samples for reports and consultations', async () => {
    const mockReports = [
      {
        id: 1,
        title: 'Laporan Kekerasan 1',
        description: 'Deskripsi 1',
        category: 'PHYSICAL',
        createdAt: new Date('2026-09-01'),
      },
      {
        id: 2,
        title: 'Laporan Kekerasan 2',
        description: 'Deskripsi 2',
        category: 'PHYSICAL',
        createdAt: new Date('2026-09-02'),
      },
      {
        id: 3,
        title: 'Laporan Verbal 1',
        description: 'Deskripsi 3',
        category: 'PSYCHOLOGICAL',
        createdAt: new Date('2026-09-03'),
      },
    ];

    const mockConsultations = [
      {
        id: 10,
        title: 'Konsultasi Stres 1',
        description: 'Stres 1',
        category: 'ANXIETY',
        date: new Date('2026-09-01'),
      },
      {
        id: 11,
        title: 'Konsultasi Stres 2',
        description: 'Stres 2',
        category: 'ANXIETY',
        date: new Date('2026-09-02'),
      },
      {
        id: 12,
        title: 'Konsultasi Depresi 1',
        description: 'Depresi 1',
        category: 'DEPRESSION',
        date: new Date('2026-09-03'),
      },
    ];

    mocks.getReportsByStartDate.mockResolvedValueOnce(mockReports);
    mocks.getConsultationsByStartDate.mockResolvedValueOnce(mockConsultations);

    const result = await AIService.getStatisticalAnalysis({
      period: '1m',
      sampleSize: 5,
    });

    expect(result.period).toBe('1m');
    expect(result.reports.totalCount).toBe(3);
    expect(result.reports.dominantCategory).toMatchObject({
      category: 'PHYSICAL',
      count: 2,
      percentage: 66.7,
      attentionRequired: true,
    });
    expect(result.reports.mode).toEqual(result.reports.dominantCategory);
    expect(result.reports.stratifiedSample.length).toBeGreaterThan(0);

    expect(result.consultations.totalCount).toBe(3);
    expect(result.consultations.dominantCategory).toMatchObject({
      category: 'ANXIETY',
      count: 2,
      percentage: 66.7,
      attentionRequired: true,
    });
    expect(result.consultations.mode).toEqual(
      result.consultations.dominantCategory,
    );
    expect(result.consultations.stratifiedSample.length).toBeGreaterThan(0);
  });

  it('handles empty data gracefully for both reports and consultations', async () => {
    mocks.getReportsByStartDate.mockResolvedValueOnce([]);
    mocks.getConsultationsByStartDate.mockResolvedValueOnce([]);

    const result = await AIService.getStatisticalAnalysis({
      period: '1w',
      sampleSize: 10,
    });

    expect(result.reports.totalCount).toBe(0);
    expect(result.reports.dominantCategory).toBeNull();
    expect(result.reports.mode).toBeNull();
    expect(result.reports.categoryBreakdown).toEqual([]);
    expect(result.reports.stratifiedSample).toEqual([]);

    expect(result.consultations.totalCount).toBe(0);
    expect(result.consultations.dominantCategory).toBeNull();
    expect(result.consultations.mode).toBeNull();
    expect(result.consultations.categoryBreakdown).toEqual([]);
    expect(result.consultations.stratifiedSample).toEqual([]);
  });
});
