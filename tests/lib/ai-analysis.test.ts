import {
  analyzeAllReports,
  analyzeReports,
  analyzeSpecificReports,
} from '@/lib/api/ai-analysis';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAnalyzeResponse = {
  status: 'ok',
  processed_count: 2,
  transaction_count: 2,
  frequent_itemsets_count: 3,
  rules_count: 1,
  duration_ms: 120.5,
  api_payload: {
    global: {
      frequent_itemsets: [
        {
          itemsets: ['bullying'],
          support: 0.5,
        },
      ],
      association_rules: [
        {
          antecedents: ['bullying'],
          consequents: ['school_peer'],
          support: 0.5,
          confidence: 0.8,
          lift: 1.2,
        },
      ],
    },
    by_category: {
      PSYCHOLOGICAL: {
        frequent_itemsets: [
          {
            itemsets: ['verbal_abuse'],
            support: 0.4,
          },
        ],
        association_rules: [],
      },
    },
  },
  warnings: ['Some reports have empty descriptions'],
};

describe('AI Analysis API Client - analyzeReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn();
  });

  it('successfully calls AI analysis endpoint with empty request body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    const result = await analyzeReports();

    expect(result).toEqual(mockAnalyzeResponse);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/ai/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );
  });

  it('successfully calls AI analysis endpoint with specific reports', async () => {
    const request = {
      reports: [
        {
          report_id: 1,
          title: 'Laporan Kekerasan Verbal',
          description:
            'Korban mengalami kekerasan verbal secara berulang di lingkungan sekolah.',
          category: 'PSYCHOLOGICAL',
          province: 'Jawa Barat',
          city: 'Bandung',
          district: 'Coblong',
          incident_date: '2026-01-01',
        },
        {
          report_id: 2,
          title: 'Laporan Kekerasan Fisik',
          description:
            'Korban mengalami kekerasan fisik dan membutuhkan pendampingan.',
          category: 'PHYSICAL',
          province: 'DKI Jakarta',
          city: 'Jakarta Selatan',
          district: 'Kebayoran',
          incident_date: '2026-01-02',
        },
      ],
      text_columns: ['title', 'description'],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    const result = await analyzeReports(request);

    expect(result).toEqual(mockAnalyzeResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/ai/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    );
  });

  it('throws AIAnalysisError when response status is not ok and server returns error message', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: 'Admin role required to access AI analysis',
      }),
    } as Response);

    await expect(analyzeReports()).rejects.toEqual({
      status: 403,
      message: 'Admin role required to access AI analysis',
    });
  });

  it('throws default analysis failed message when response is not ok without error message', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
      }),
    } as Response);

    await expect(analyzeReports()).rejects.toEqual({
      status: 500,
      message: 'Analysis failed',
    });
  });

  it('throws invalid response error when server returns success false', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    await expect(analyzeReports()).rejects.toEqual({
      status: 200,
      message: 'Invalid response from server',
    });
  });

  it('throws invalid response error when server returns success true but data is missing', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    await expect(analyzeReports()).rejects.toEqual({
      status: 200,
      message: 'Invalid response from server',
    });
  });

  it('wraps native Error from fetch into AIAnalysisError with status 500', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error('Network connection failed'),
    );

    await expect(analyzeReports()).rejects.toEqual({
      status: 500,
      message: 'Network connection failed',
    });
  });

  it('wraps unknown thrown value into AIAnalysisError with unknown error message', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce('unexpected error');

    await expect(analyzeReports()).rejects.toEqual({
      status: 500,
      message: 'Unknown error',
    });
  });

  it('keeps original AIAnalysisError shape when thrown inside try block', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: 'Authentication required',
      }),
    } as Response);

    await expect(analyzeReports()).rejects.toEqual({
      status: 401,
      message: 'Authentication required',
    });
  });

  it('passes custom text columns to AI endpoint', async () => {
    const request = {
      reports: [
        {
          report_id: 'RPT-001',
          title: 'Judul laporan',
          description: 'Deskripsi laporan',
          category: 'OTHER',
        },
      ],
      text_columns: ['description'],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    await analyzeReports(request);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/ai/analyze',
      expect.objectContaining({
        body: JSON.stringify(request),
      }),
    );
  });
});

describe('AI Analysis API Client - analyzeAllReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn();
  });

  it('calls analyzeReports with empty object to trigger auto-fetch from backend', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    const result = await analyzeAllReports();

    expect(result).toEqual(mockAnalyzeResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/ai/analyze',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
  });

  it('propagates error from analyzeReports when analyzeAllReports fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: 'AI Service returned 500',
      }),
    } as Response);

    await expect(analyzeAllReports()).rejects.toEqual({
      status: 500,
      message: 'AI Service returned 500',
    });
  });
});

describe('AI Analysis API Client - analyzeSpecificReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn();
  });

  it('calls analyzeReports with reports and default text columns', async () => {
    const reports = [
      {
        report_id: 1,
        title: 'Laporan Kekerasan Verbal',
        description:
          'Korban mengalami kekerasan verbal secara berulang di sekolah.',
        category: 'PSYCHOLOGICAL',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    const result = await analyzeSpecificReports(reports);

    expect(result).toEqual(mockAnalyzeResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/ai/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reports,
          text_columns: ['title', 'description'],
        }),
      },
    );
  });

  it('calls analyzeReports with reports and custom text columns', async () => {
    const reports = [
      {
        report_id: 'RPT-001',
        title: 'Judul laporan',
        description: 'Deskripsi laporan',
        category: 'OTHER',
        province: 'Jawa Barat',
        city: 'Bandung',
        district: 'Coblong',
        incident_date: '2026-01-01',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    await analyzeSpecificReports(reports, ['description']);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/ai/analyze',
      expect.objectContaining({
        body: JSON.stringify({
          reports,
          text_columns: ['description'],
        }),
      }),
    );
  });

  it('supports empty reports array for analyzeSpecificReports', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockAnalyzeResponse,
      }),
    } as Response);

    const result = await analyzeSpecificReports([]);

    expect(result).toEqual(mockAnalyzeResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/ai/analyze',
      expect.objectContaining({
        body: JSON.stringify({
          reports: [],
          text_columns: ['title', 'description'],
        }),
      }),
    );
  });

  it('propagates invalid response error from analyzeReports', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: undefined,
      }),
    } as Response);

    await expect(
      analyzeSpecificReports([
        {
          report_id: 1,
          title: 'Judul',
          description: 'Deskripsi',
        },
      ]),
    ).rejects.toEqual({
      status: 200,
      message: 'Invalid response from server',
    });
  });
});
