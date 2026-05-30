import { ApiError } from '@/lib/error';
import { ConsultationSchema } from '@/modules/consultation/consultation.schema';
import { describe, expect, it } from 'vitest';

const makeValidConsultationFormData = (
  overrides: Record<string, string | Blob> = {},
) => {
  const formData = new FormData();
  formData.set('title', 'Butuh Konsultasi');
  formData.set('nature', 'ANXIETY');
  formData.set(
    'description',
    'Saya membutuhkan konsultasi terkait kecemasan yang sedang dialami.',
  );
  formData.set('date', '2026-06-01');
  formData.set('time', '13:00');
  formData.set('isAnonymous', 'true');
  formData.set(
    'document',
    new File(['catatan'], 'catatan.pdf', { type: 'application/pdf' }),
  );

  Object.entries(overrides).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe('ConsultationSchema.validateScheduleQuery', () => {
  it('accepts date query in YYYY-MM-DD format', () => {
    expect(
      ConsultationSchema.validateScheduleQuery({ date: '2026-06-01' }),
    ).toEqual({
      date: '2026-06-01',
    });
  });

  it('rejects missing date query', () => {
    expect(() => ConsultationSchema.validateScheduleQuery({})).toThrow(
      ApiError,
    );
  });

  it.each(['01-06-2026', '2026/06/01', '2026-6-1', 'abc'])(
    'rejects invalid date format %s',
    (date) => {
      expect(() => ConsultationSchema.validateScheduleQuery({ date })).toThrow(
        /Format query tidak valid/,
      );
    },
  );
});

describe('ConsultationSchema.validateCreateConsultation', () => {
  it('validates complete consultation form data', () => {
    const result = ConsultationSchema.validateCreateConsultation(
      makeValidConsultationFormData(),
    );

    expect(result.title).toBe('Butuh Konsultasi');
    expect(result.nature).toBe('ANXIETY');
    expect(result.description).toContain('kecemasan');
    expect(result.date).toBe('2026-06-01');
    expect(result.time).toBe('13:00');
    expect(result.isAnonymous).toBe(true);
    expect(result.document).toBeInstanceOf(File);
  });

  it('sets isAnonymous false when checkbox value is absent', () => {
    const formData = makeValidConsultationFormData();
    formData.delete('isAnonymous');

    const result = ConsultationSchema.validateCreateConsultation(formData);

    expect(result.isAnonymous).toBe(false);
  });

  it('accepts null document when no file is attached', () => {
    const formData = makeValidConsultationFormData();
    formData.delete('document');

    const result = ConsultationSchema.validateCreateConsultation(formData);

    expect(result.document).toBeNull();
  });

  it('rejects title shorter than 5 characters', () => {
    expect(() =>
      ConsultationSchema.validateCreateConsultation(
        makeValidConsultationFormData({ title: 'Help' }),
      ),
    ).toThrow(/Data konsultasi tidak valid/);
  });

  it('rejects empty nature', () => {
    expect(() =>
      ConsultationSchema.validateCreateConsultation(
        makeValidConsultationFormData({ nature: '' }),
      ),
    ).toThrow(ApiError);
  });

  it('rejects description shorter than 10 characters', () => {
    expect(() =>
      ConsultationSchema.validateCreateConsultation(
        makeValidConsultationFormData({ description: 'pendek' }),
      ),
    ).toThrow(/Data konsultasi tidak valid/);
  });

  it.each(['2026/06/01', '01-06-2026', 'abc'])(
    'rejects invalid consultation date format %s',
    (date) => {
      expect(() =>
        ConsultationSchema.validateCreateConsultation(
          makeValidConsultationFormData({ date }),
        ),
      ).toThrow(/Data konsultasi tidak valid/);
    },
  );

  it.each(['7:00', '07.00', '0700', 'abc'])(
    'rejects invalid consultation time format %s',
    (time) => {
      expect(() =>
        ConsultationSchema.validateCreateConsultation(
          makeValidConsultationFormData({ time }),
        ),
      ).toThrow(/Data konsultasi tidak valid/);
    },
  );

  it('rejects document larger than 10MB', () => {
    const largeFile = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'besar.pdf',
      {
        type: 'application/pdf',
      },
    );

    expect(() =>
      ConsultationSchema.validateCreateConsultation(
        makeValidConsultationFormData({ document: largeFile }),
      ),
    ).toThrow(/Data konsultasi tidak valid/);
  });
});

describe('ConsultationSchema.validateSaveSchedule', () => {
  it('validates multiple schedule slots', () => {
    const result = ConsultationSchema.validateSaveSchedule({
      userId: 'psychologist-1',
      slots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 3, startTime: '13:00', endTime: '15:00' },
      ],
    });

    expect(result.slots).toHaveLength(2);
    expect(result.slots[0].dayOfWeek).toBe(1);
  });

  it('rejects empty userId', () => {
    expect(() =>
      ConsultationSchema.validateSaveSchedule({
        userId: '',
        slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
      }),
    ).toThrow(/Data jadwal tidak valid/);
  });

  it.each([0, 8])('rejects dayOfWeek outside 1-7: %s', (dayOfWeek) => {
    expect(() =>
      ConsultationSchema.validateSaveSchedule({
        userId: 'psychologist-1',
        slots: [{ dayOfWeek, startTime: '09:00', endTime: '12:00' }],
      }),
    ).toThrow(/Data jadwal tidak valid/);
  });

  it.each(['9:00', '09.00', 'abc'])(
    'rejects invalid startTime format %s',
    (startTime) => {
      expect(() =>
        ConsultationSchema.validateSaveSchedule({
          userId: 'psychologist-1',
          slots: [{ dayOfWeek: 1, startTime, endTime: '12:00' }],
        }),
      ).toThrow(/Data jadwal tidak valid/);
    },
  );
});
