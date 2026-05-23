import { ReportService } from '@/modules/report/report.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createReportRepository: vi.fn(),
  addReportEvidences: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/modules/report/report.repositories', () => ({
  createReport: mocks.createReportRepository,
  addReportEvidences: mocks.addReportEvidences,
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

describe('ReportService.createReport', () => {
  const baseInput = {
    title: 'Laporan Kekerasan Verbal',
    category: 'PSYCHOLOGICAL',
    incidentDate: new Date('2026-01-01'),
    province: 'Jawa Barat',
    city: 'Bandung',
    district: 'Coblong',
    address: 'Jl. Aman',
    description: 'Deskripsi laporan yang sudah cukup panjang untuk validasi.',
    isAnonymous: true,
    evidence: [],
  };

  beforeEach(() => {
    mocks.createReportRepository.mockReset();
    mocks.addReportEvidences.mockReset();
    mocks.getSupabaseClient.mockReset();
  });

  it('creates report with PENDING status and public visibility', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.createReportRepository.mockResolvedValue({
      id: 1,
      title: baseInput.title,
    });

    const result = await ReportService.createReport('user-1', baseInput);

    expect(result).toEqual({
      id: 1,
      title: baseInput.title,
    });

    expect(mocks.createReportRepository).toHaveBeenCalledWith({
      userId: 'user-1',
      title: baseInput.title,
      category: baseInput.category,
      incidentDate: baseInput.incidentDate,
      province: baseInput.province,
      city: baseInput.city,
      district: baseInput.district,
      address: baseInput.address,
      description: baseInput.description,
      isAnonymous: true,
      status: 'PENDING',
      isPublic: true,
    });

    expect(mocks.addReportEvidences).not.toHaveBeenCalled();
  });

  it('converts empty address to undefined before repository create', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.createReportRepository.mockResolvedValue({
      id: 2,
    });

    await ReportService.createReport('user-1', {
      ...baseInput,
      address: '',
    });

    expect(mocks.createReportRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        address: undefined,
      }),
    );
  });

  it('creates report without evidence when evidence array is empty', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.createReportRepository.mockResolvedValue({
      id: 3,
      title: baseInput.title,
    });

    const result = await ReportService.createReport('user-1', {
      ...baseInput,
      evidence: [],
    });

    expect(result).toEqual({
      id: 3,
      title: baseInput.title,
    });

    expect(mocks.addReportEvidences).not.toHaveBeenCalled();
  });

  it('uploads evidence files and saves evidence metadata', async () => {
    const file = new File(['bukti'], 'bukti.png', {
      type: 'image/png',
    });

    const upload = vi.fn().mockResolvedValue({
      error: null,
    });

    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: 'https://cdn.test/bukti.png',
      },
    });

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    mocks.createReportRepository.mockResolvedValue({
      id: 7,
    });

    await ReportService.createReport('user-1', {
      ...baseInput,
      evidence: [file],
    });

    expect(from).toHaveBeenCalled();
    expect(upload).toHaveBeenCalled();

    expect(mocks.addReportEvidences).toHaveBeenCalledWith(7, [
      {
        fileName: 'bukti.png',
        fileUrl: 'https://cdn.test/bukti.png',
        mimeType: 'image/png',
        fileSize: file.size,
      },
    ]);
  });

  it('uploads multiple evidence files and saves all evidence metadata', async () => {
    const file1 = new File(['bukti-1'], 'bukti-1.png', {
      type: 'image/png',
    });

    const file2 = new File(['bukti-2'], 'bukti-2.pdf', {
      type: 'application/pdf',
    });

    const upload = vi.fn().mockResolvedValue({
      error: null,
    });

    const getPublicUrl = vi
      .fn()
      .mockReturnValueOnce({
        data: {
          publicUrl: 'https://cdn.test/bukti-1.png',
        },
      })
      .mockReturnValueOnce({
        data: {
          publicUrl: 'https://cdn.test/bukti-2.pdf',
        },
      });

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    mocks.createReportRepository.mockResolvedValue({
      id: 8,
    });

    await ReportService.createReport('user-1', {
      ...baseInput,
      evidence: [file1, file2],
    });

    expect(upload).toHaveBeenCalledTimes(2);

    expect(mocks.addReportEvidences).toHaveBeenCalledWith(8, [
      {
        fileName: 'bukti-1.png',
        fileUrl: 'https://cdn.test/bukti-1.png',
        mimeType: 'image/png',
        fileSize: file1.size,
      },
      {
        fileName: 'bukti-2.pdf',
        fileUrl: 'https://cdn.test/bukti-2.pdf',
        mimeType: 'application/pdf',
        fileSize: file2.size,
      },
    ]);
  });

  it('throws storage error when evidence upload fails', async () => {
    const file = new File(['bukti'], 'bukti.png', {
      type: 'image/png',
    });

    const upload = vi.fn().mockResolvedValue({
      error: {
        message: 'upload failed',
      },
    });

    const getPublicUrl = vi.fn();

    const from = vi.fn().mockReturnValue({
      upload,
      getPublicUrl,
    });

    mocks.getSupabaseClient.mockReturnValue({
      storage: {
        from,
      },
    });

    mocks.createReportRepository.mockResolvedValue({
      id: 9,
    });

    await expect(
      ReportService.createReport('user-1', {
        ...baseInput,
        evidence: [file],
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'STORAGE_ERROR',
    });

    expect(mocks.addReportEvidences).not.toHaveBeenCalled();
  });

  it('creates report but skips evidence upload when Supabase client is null', async () => {
    const file = new File(['bukti'], 'bukti.png', {
      type: 'image/png',
    });

    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.createReportRepository.mockResolvedValue({
      id: 10,
    });

    const result = await ReportService.createReport('user-1', {
      ...baseInput,
      evidence: [file],
    });

    expect(result).toEqual({
      id: 10,
    });

    expect(mocks.addReportEvidences).not.toHaveBeenCalled();
  });

  it('wraps repository errors as unprocessable error', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.createReportRepository.mockRejectedValue(new Error('database down'));

    await expect(
      ReportService.createReport('user-1', baseInput),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });
});
