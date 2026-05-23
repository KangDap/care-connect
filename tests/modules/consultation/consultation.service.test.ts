import { ConsultationService } from '@/modules/consultation/consultation.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createConsultationRepository: vi.fn(),
  createManySchedules: vi.fn(),
  deleteSchedulesByUserId: vi.fn(),
  getActivePsychologists: vi.fn(),
  getSchedulesByUserId: vi.fn(),
  getScheduleAvailabilityForDate: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/modules/consultation/consultation.repositories', () => ({
  createConsultation: mocks.createConsultationRepository,
  createManySchedules: mocks.createManySchedules,
  deleteSchedulesByUserId: mocks.deleteSchedulesByUserId,
  getActivePsychologists: mocks.getActivePsychologists,
  getSchedulesByUserId: mocks.getSchedulesByUserId,
}));

vi.mock('@/modules/consultation/consultation.schedule', () => ({
  getScheduleAvailabilityForDate: mocks.getScheduleAvailabilityForDate,
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}));

describe('ConsultationService', () => {
  beforeEach(() => {
    mocks.createConsultationRepository.mockReset();
    mocks.createManySchedules.mockReset();
    mocks.deleteSchedulesByUserId.mockReset();
    mocks.getActivePsychologists.mockReset();
    mocks.getSchedulesByUserId.mockReset();
    mocks.getScheduleAvailabilityForDate.mockReset();
    mocks.getSupabaseClient.mockReset();
  });

  it('returns schedule availability from schedule module', async () => {
    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: true,
      },
    ]);

    const result =
      await ConsultationService.getScheduleAvailability('2026-06-01');

    expect(result).toEqual([
      {
        time: '09:00',
        available: true,
      },
    ]);

    expect(mocks.getScheduleAvailabilityForDate).toHaveBeenCalledWith(
      '2026-06-01',
    );
  });

  it('wraps schedule availability failures as unprocessable error', async () => {
    mocks.getScheduleAvailabilityForDate.mockRejectedValue(
      new Error('db error'),
    );

    await expect(
      ConsultationService.getScheduleAvailability('2026-06-01'),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('creates consultation with an available psychologist slot', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: true,
        availablePsychologistIds: ['psy-1'],
      },
    ]);

    mocks.createConsultationRepository.mockResolvedValue({
      id: 1,
      psychologistId: 'psy-1',
    });

    const result = await ConsultationService.createConsultation('user-1', {
      title: 'Butuh Konsultasi',
      nature: 'ANXIETY',
      description: 'Saya butuh bantuan terkait kecemasan.',
      date: '2026-06-01',
      time: '09:00',
      isAnonymous: true,
      document: null,
    });

    expect(result).toEqual({
      id: 1,
      psychologistId: 'psy-1',
    });

    expect(mocks.createConsultationRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        psychologistId: 'psy-1',
        title: 'Butuh Konsultasi',
        category: 'ANXIETY',
        status: 'SCHEDULED',
        isAnonymous: true,
        attachmentUrl: null,
      }),
    );
  });

  it('rejects consultation creation when selected slot is unavailable', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: false,
        availablePsychologistIds: [],
      },
    ]);

    await expect(
      ConsultationService.createConsultation('user-1', {
        title: 'Butuh Konsultasi',
        nature: 'ANXIETY',
        description: 'Saya butuh bantuan terkait kecemasan.',
        date: '2026-06-01',
        time: '09:00',
        isAnonymous: false,
        document: null,
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });

    expect(mocks.createConsultationRepository).not.toHaveBeenCalled();
  });

  it('rejects consultation creation when selected slot does not exist', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '10:00',
        available: true,
        availablePsychologistIds: ['psy-1'],
      },
    ]);

    await expect(
      ConsultationService.createConsultation('user-1', {
        title: 'Butuh Konsultasi',
        nature: 'ANXIETY',
        description: 'Saya butuh bantuan terkait kecemasan.',
        date: '2026-06-01',
        time: '09:00',
        isAnonymous: false,
        document: null,
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });

    expect(mocks.createConsultationRepository).not.toHaveBeenCalled();
  });

  it('uploads consultation document and stores attachment URL', async () => {
    const document = new File(['dokumen'], 'kronologi.pdf', {
      type: 'application/pdf',
    });

    const upload = vi.fn().mockResolvedValue({
      error: null,
    });

    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl: 'https://cdn.test/kronologi.pdf',
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

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: true,
        availablePsychologistIds: ['psy-1'],
      },
    ]);

    mocks.createConsultationRepository.mockResolvedValue({
      id: 1,
      attachmentUrl: 'https://cdn.test/kronologi.pdf',
    });

    const result = await ConsultationService.createConsultation('user-1', {
      title: 'Butuh Konsultasi',
      nature: 'ANXIETY',
      description: 'Saya butuh bantuan terkait kecemasan.',
      date: '2026-06-01',
      time: '09:00',
      isAnonymous: false,
      document,
    });

    expect(result).toEqual({
      id: 1,
      attachmentUrl: 'https://cdn.test/kronologi.pdf',
    });

    expect(from).toHaveBeenCalled();
    expect(upload).toHaveBeenCalled();

    expect(mocks.createConsultationRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentUrl: 'https://cdn.test/kronologi.pdf',
      }),
    );
  });

  it('throws storage error when consultation document upload fails', async () => {
    const document = new File(['dokumen'], 'kronologi.pdf', {
      type: 'application/pdf',
    });

    const upload = vi.fn().mockResolvedValue({
      error: {
        message: 'bucket error',
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

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: true,
        availablePsychologistIds: ['psy-1'],
      },
    ]);

    await expect(
      ConsultationService.createConsultation('user-1', {
        title: 'Butuh Konsultasi',
        nature: 'ANXIETY',
        description: 'Saya butuh bantuan terkait kecemasan.',
        date: '2026-06-01',
        time: '09:00',
        isAnonymous: false,
        document,
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'STORAGE_ERROR',
    });

    expect(mocks.createConsultationRepository).not.toHaveBeenCalled();
  });

  it('creates consultation without uploading document when Supabase client is null', async () => {
    const document = new File(['dokumen'], 'kronologi.pdf', {
      type: 'application/pdf',
    });

    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: true,
        availablePsychologistIds: ['psy-1'],
      },
    ]);

    mocks.createConsultationRepository.mockResolvedValue({
      id: 1,
      attachmentUrl: null,
    });

    const result = await ConsultationService.createConsultation('user-1', {
      title: 'Butuh Konsultasi',
      nature: 'ANXIETY',
      description: 'Saya butuh bantuan terkait kecemasan.',
      date: '2026-06-01',
      time: '09:00',
      isAnonymous: false,
      document,
    });

    expect(result).toEqual({
      id: 1,
      attachmentUrl: null,
    });

    expect(mocks.createConsultationRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentUrl: null,
      }),
    );
  });

  it('formats psychologists active days from schedules', async () => {
    mocks.getActivePsychologists.mockResolvedValue([
      {
        id: 'psy-1',
        name: 'Dr. Aman',
        image: null,
        schedules: [
          {
            dayOfWeek: 3,
          },
          {
            dayOfWeek: 1,
          },
          {
            dayOfWeek: 3,
          },
        ],
      },
    ]);

    const result = await ConsultationService.getPsychologists();

    expect(result).toEqual([
      {
        id: 'psy-1',
        name: 'Dr. Aman',
        image: null,
        activeDays: ['Mon', 'Wed'],
      },
    ]);
  });

  it('formats saved schedules from UTC to WIB time strings', async () => {
    mocks.getSchedulesByUserId.mockResolvedValue([
      {
        id: 1,
        userId: 'psy-1',
        dayOfWeek: 1,
        startTime: new Date(Date.UTC(1970, 0, 1, 2, 30)),
        endTime: new Date(Date.UTC(1970, 0, 1, 5, 0)),
      },
    ]);

    const result = await ConsultationService.getSchedules('psy-1');

    expect(result[0]).toMatchObject({
      startTime: '09:30',
      endTime: '12:00',
    });
  });

  it('saves valid non-overlapping schedules by replacing old schedules', async () => {
    mocks.createManySchedules.mockResolvedValue({
      count: 2,
    });

    const result = await ConsultationService.saveSchedules('psy-1', [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
      },
      {
        dayOfWeek: 1,
        startTime: '13:00',
        endTime: '15:00',
      },
    ]);

    expect(result).toEqual({
      count: 2,
    });

    expect(mocks.deleteSchedulesByUserId).toHaveBeenCalledWith('psy-1');

    expect(mocks.createManySchedules).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'psy-1',
          dayOfWeek: 1,
        }),
      ]),
    );
  });

  it('rejects schedule with start time after end time', async () => {
    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 1,
          startTime: '13:00',
          endTime: '12:00',
        },
      ]),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });

    expect(mocks.deleteSchedulesByUserId).not.toHaveBeenCalled();
  });

  it('rejects overlapping schedules on the same day', async () => {
    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
        },
        {
          dayOfWeek: 1,
          startTime: '11:00',
          endTime: '14:00',
        },
      ]),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('allows same time range on different days', async () => {
    mocks.createManySchedules.mockResolvedValue({
      count: 2,
    });

    await ConsultationService.saveSchedules('psy-1', [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
      },
      {
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '12:00',
      },
    ]);

    expect(mocks.createManySchedules).toHaveBeenCalled();
  });
});
