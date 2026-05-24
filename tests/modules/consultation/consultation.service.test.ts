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

const makeValidConsultationFormData = (
  overrides: Record<string, string | Blob> = {},
) => {
  const formData = new FormData();

  formData.set('title', 'Konsultasi Kecemasan');
  formData.set('nature', 'ANXIETY');
  formData.set(
    'description',
    'Saya membutuhkan bantuan profesional karena merasa cemas secara berlebihan.',
  );
  formData.set('date', '2026-06-01');
  formData.set('time', '09:00');
  formData.set('isAnonymous', 'true');

  Object.entries(overrides).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
};

describe('ConsultationService validation wrapper', () => {
  beforeEach(() => {
    mocks.createConsultationRepository.mockReset();
    mocks.createManySchedules.mockReset();
    mocks.deleteSchedulesByUserId.mockReset();
    mocks.getActivePsychologists.mockReset();
    mocks.getSchedulesByUserId.mockReset();
    mocks.getScheduleAvailabilityForDate.mockReset();
    mocks.getSupabaseClient.mockReset();
  });

  it('validates schedule query through ConsultationSchema', () => {
    const result = ConsultationService.validateScheduleQuery({
      date: '2026-06-01',
    });

    expect(result).toEqual({
      date: '2026-06-01',
    });
  });

  it('throws error for invalid schedule query', () => {
    expect(() =>
      ConsultationService.validateScheduleQuery({
        date: 'invalid-date',
      }),
    ).toThrow();
  });

  it('validates create consultation form data through ConsultationSchema', () => {
    const result = ConsultationService.validateCreateConsultation(
      makeValidConsultationFormData(),
    );

    expect(result.title).toBe('Konsultasi Kecemasan');
    expect(result.nature).toBe('ANXIETY');
    expect(result.date).toBe('2026-06-01');
    expect(result.time).toBe('09:00');
    expect(result.isAnonymous).toBe(true);
  });

  it('throws error for invalid create consultation form data', () => {
    const formData = makeValidConsultationFormData({
      title: '',
    });

    expect(() =>
      ConsultationService.validateCreateConsultation(formData),
    ).toThrow();
  });
});

describe('ConsultationService.getScheduleAvailability', () => {
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
});

describe('ConsultationService.createConsultation', () => {
  beforeEach(() => {
    mocks.createConsultationRepository.mockReset();
    mocks.createManySchedules.mockReset();
    mocks.deleteSchedulesByUserId.mockReset();
    mocks.getActivePsychologists.mockReset();
    mocks.getSchedulesByUserId.mockReset();
    mocks.getScheduleAvailabilityForDate.mockReset();
    mocks.getSupabaseClient.mockReset();
    vi.spyOn(Math, 'random').mockReturnValue(0);
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

  it('chooses psychologist based on random index from availablePsychologistIds', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);

    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '10:00',
        available: true,
        availablePsychologistIds: ['psy-1', 'psy-2', 'psy-3', 'psy-4'],
      },
    ]);

    mocks.createConsultationRepository.mockResolvedValue({
      id: 2,
      psychologistId: 'psy-4',
    });

    await ConsultationService.createConsultation('user-1', {
      title: 'Butuh Konsultasi',
      nature: 'STRESS',
      description: 'Saya butuh bantuan terkait tekanan akademik.',
      date: '2026-06-01',
      time: '10:00',
      isAnonymous: false,
      document: null,
    });

    expect(mocks.createConsultationRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        psychologistId: 'psy-4',
      }),
    );
  });

  it('converts selected WIB time to UTC before saving consultation', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:30',
        available: true,
        availablePsychologistIds: ['psy-1'],
      },
    ]);

    mocks.createConsultationRepository.mockResolvedValue({
      id: 3,
    });

    await ConsultationService.createConsultation('user-1', {
      title: 'Butuh Konsultasi',
      nature: 'ANXIETY',
      description: 'Saya butuh bantuan terkait kecemasan.',
      date: '2026-06-01',
      time: '09:30',
      isAnonymous: false,
      document: null,
    });

    const payload = mocks.createConsultationRepository.mock.calls[0][0];

    expect(payload.time).toBeInstanceOf(Date);
    expect(payload.time.getUTCHours()).toBe(2);
    expect(payload.time.getUTCMinutes()).toBe(30);
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

  it('rejects consultation creation when selected slot has no available psychologist ids', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: true,
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

    expect(from).toHaveBeenCalledWith('consultation-files');
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

  it('wraps unknown create consultation repository error as unprocessable error', async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    mocks.getScheduleAvailabilityForDate.mockResolvedValue([
      {
        time: '09:00',
        available: true,
        availablePsychologistIds: ['psy-1'],
      },
    ]);

    mocks.createConsultationRepository.mockRejectedValue(
      new Error('database down'),
    );

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
  });
});

describe('ConsultationService.getPsychologists', () => {
  beforeEach(() => {
    mocks.createConsultationRepository.mockReset();
    mocks.createManySchedules.mockReset();
    mocks.deleteSchedulesByUserId.mockReset();
    mocks.getActivePsychologists.mockReset();
    mocks.getSchedulesByUserId.mockReset();
    mocks.getScheduleAvailabilityForDate.mockReset();
    mocks.getSupabaseClient.mockReset();
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

  it('formats all psychologist schedule days correctly', async () => {
    mocks.getActivePsychologists.mockResolvedValue([
      {
        id: 'psy-1',
        name: 'Dr. Full Week',
        image: 'avatar.png',
        schedules: [
          { dayOfWeek: 7 },
          { dayOfWeek: 6 },
          { dayOfWeek: 5 },
          { dayOfWeek: 4 },
          { dayOfWeek: 3 },
          { dayOfWeek: 2 },
          { dayOfWeek: 1 },
        ],
      },
    ]);

    const result = await ConsultationService.getPsychologists();

    expect(result[0]).toEqual({
      id: 'psy-1',
      name: 'Dr. Full Week',
      image: 'avatar.png',
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    });
  });

  it('returns empty activeDays when psychologist has no schedules', async () => {
    mocks.getActivePsychologists.mockResolvedValue([
      {
        id: 'psy-1',
        name: 'Dr. Empty',
        image: null,
        schedules: [],
      },
    ]);

    const result = await ConsultationService.getPsychologists();

    expect(result[0].activeDays).toEqual([]);
  });

  it('wraps getPsychologists repository errors as unprocessable error', async () => {
    mocks.getActivePsychologists.mockRejectedValue(new Error('db error'));

    await expect(ConsultationService.getPsychologists()).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });
});

describe('ConsultationService.getSchedules', () => {
  beforeEach(() => {
    mocks.createConsultationRepository.mockReset();
    mocks.createManySchedules.mockReset();
    mocks.deleteSchedulesByUserId.mockReset();
    mocks.getActivePsychologists.mockReset();
    mocks.getSchedulesByUserId.mockReset();
    mocks.getScheduleAvailabilityForDate.mockReset();
    mocks.getSupabaseClient.mockReset();
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

  it('formats saved schedules with midnight wraparound correctly', async () => {
    mocks.getSchedulesByUserId.mockResolvedValue([
      {
        id: 1,
        userId: 'psy-1',
        dayOfWeek: 1,
        startTime: new Date(Date.UTC(1970, 0, 1, 17, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 18, 15)),
      },
    ]);

    const result = await ConsultationService.getSchedules('psy-1');

    expect(result[0]).toMatchObject({
      startTime: '00:00',
      endTime: '01:15',
    });
  });

  it('returns empty schedules array when repository returns empty array', async () => {
    mocks.getSchedulesByUserId.mockResolvedValue([]);

    const result = await ConsultationService.getSchedules('psy-1');

    expect(result).toEqual([]);
  });

  it('wraps getSchedules repository errors as unprocessable error', async () => {
    mocks.getSchedulesByUserId.mockRejectedValue(new Error('db error'));

    await expect(
      ConsultationService.getSchedules('psy-1'),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });
});

describe('ConsultationService.saveSchedules', () => {
  beforeEach(() => {
    mocks.createConsultationRepository.mockReset();
    mocks.createManySchedules.mockReset();
    mocks.deleteSchedulesByUserId.mockReset();
    mocks.getActivePsychologists.mockReset();
    mocks.getSchedulesByUserId.mockReset();
    mocks.getScheduleAvailabilityForDate.mockReset();
    mocks.getSupabaseClient.mockReset();
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

  it('converts saved schedule time from WIB to UTC before saving', async () => {
    mocks.createManySchedules.mockResolvedValue({
      count: 1,
    });

    await ConsultationService.saveSchedules('psy-1', [
      {
        dayOfWeek: 2,
        startTime: '09:30',
        endTime: '12:15',
      },
    ]);

    const dataToSave = mocks.createManySchedules.mock.calls[0][0];

    expect(dataToSave[0].startTime.getUTCHours()).toBe(2);
    expect(dataToSave[0].startTime.getUTCMinutes()).toBe(30);
    expect(dataToSave[0].endTime.getUTCHours()).toBe(5);
    expect(dataToSave[0].endTime.getUTCMinutes()).toBe(15);
  });

  it('allows end time 00:00 and stores it as effective 24:00 conversion', async () => {
    mocks.createManySchedules.mockResolvedValue({
      count: 1,
    });

    await ConsultationService.saveSchedules('psy-1', [
      {
        dayOfWeek: 5,
        startTime: '22:00',
        endTime: '00:00',
      },
    ]);

    const dataToSave = mocks.createManySchedules.mock.calls[0][0];

    expect(dataToSave[0].startTime.getUTCHours()).toBe(15);
    expect(dataToSave[0].endTime.getUTCHours()).toBe(17);
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

  it('rejects schedule with start time equal to end time', async () => {
    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 1,
          startTime: '12:00',
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

  it('rejects overlapping schedule when first end time is 00:00', async () => {
    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 1,
          startTime: '20:00',
          endTime: '00:00',
        },
        {
          dayOfWeek: 1,
          startTime: '22:00',
          endTime: '23:00',
        },
      ]),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('rejects overlapping schedule when second end time is 00:00', async () => {
    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 1,
          startTime: '21:00',
          endTime: '23:00',
        },
        {
          dayOfWeek: 1,
          startTime: '22:00',
          endTime: '00:00',
        },
      ]),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('allows adjacent schedules on the same day', async () => {
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
        dayOfWeek: 1,
        startTime: '12:00',
        endTime: '14:00',
      },
    ]);

    expect(mocks.createManySchedules).toHaveBeenCalled();
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

  it('wraps repository error from deleteSchedulesByUserId as unprocessable error', async () => {
    mocks.deleteSchedulesByUserId.mockRejectedValue(new Error('delete failed'));

    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
        },
      ]),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('wraps repository error from createManySchedules as unprocessable error', async () => {
    mocks.deleteSchedulesByUserId.mockResolvedValue(undefined);
    mocks.createManySchedules.mockRejectedValue(new Error('create failed'));

    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
        },
      ]),
    ).rejects.toMatchObject({
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('throws validation error when raw slot input is invalid', async () => {
    await expect(
      ConsultationService.saveSchedules('psy-1', [
        {
          dayOfWeek: 8,
          startTime: '09:00',
          endTime: '12:00',
        },
      ]),
    ).rejects.toMatchObject({
      status: 400,
    });

    expect(mocks.deleteSchedulesByUserId).not.toHaveBeenCalled();
    expect(mocks.createManySchedules).not.toHaveBeenCalled();
  });
});
