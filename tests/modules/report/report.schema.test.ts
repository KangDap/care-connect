import { ApiError } from '@/lib/error';
import { ReportSchema } from '@/modules/report/report.schema';
import { describe, expect, it } from 'vitest';

const makeValidReportFormData = (
  overrides: Record<string, string | Blob> = {},
) => {
  const formData = new FormData();

  formData.set('title', 'Laporan Kekerasan Verbal');
  formData.set('category', 'PSYCHOLOGICAL');
  formData.set('incidentDate', '2026-01-10');
  formData.set('province', 'Jawa Barat');
  formData.set('city', 'Bandung');
  formData.set('district', 'Coblong');
  formData.set('address', 'Jl. Aman No. 1');
  formData.set(
    'description',
    'Korban mengalami kekerasan verbal secara berulang dan membutuhkan bantuan profesional.',
  );
  formData.set('isAnonymous', 'on');

  Object.entries(overrides).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
};

describe('ReportSchema.validateCreateReport', () => {
  it('validates complete report form data and converts incidentDate to Date', () => {
    const result = ReportSchema.validateCreateReport(makeValidReportFormData());

    expect(result.title).toBe('Laporan Kekerasan Verbal');
    expect(result.category).toBe('PSYCHOLOGICAL');
    expect(result.incidentDate).toBeInstanceOf(Date);
    expect(result.province).toBe('Jawa Barat');
    expect(result.city).toBe('Bandung');
    expect(result.district).toBe('Coblong');
    expect(result.address).toBe('Jl. Aman No. 1');
    expect(result.isAnonymous).toBe(true);
    expect(result.evidence).toEqual([]);
  });

  it('defaults isAnonymous to false when checkbox is not submitted', () => {
    const formData = makeValidReportFormData();
    formData.delete('isAnonymous');

    const result = ReportSchema.validateCreateReport(formData);

    expect(result.isAnonymous).toBe(false);
  });

  it('accepts empty address as optional field', () => {
    const result = ReportSchema.validateCreateReport(
      makeValidReportFormData({
        address: '',
      }),
    );

    expect(result.address).toBe('');
  });

  it.each(['PHYSICAL', 'SEXUAL', 'PSYCHOLOGICAL', 'OTHER'])(
    'accepts %s as a valid report category',
    (category) => {
      const result = ReportSchema.validateCreateReport(
        makeValidReportFormData({
          category,
        }),
      );

      expect(result.category).toBe(category);
    },
  );

  it('collects multiple valid evidence files', () => {
    const formData = makeValidReportFormData();

    formData.append(
      'evidence',
      new File(['dummy image'], 'bukti-1.png', {
        type: 'image/png',
      }),
    );

    formData.append(
      'evidence',
      new File(['dummy pdf'], 'bukti-2.pdf', {
        type: 'application/pdf',
      }),
    );

    const result = ReportSchema.validateCreateReport(formData);

    expect(result.evidence).toHaveLength(2);
    expect(result.evidence?.[0].name).toBe('bukti-1.png');
    expect(result.evidence?.[1].type).toBe('application/pdf');
  });

  it('ignores empty evidence files', () => {
    const formData = makeValidReportFormData();

    formData.append(
      'evidence',
      new File([], 'empty.png', {
        type: 'image/png',
      }),
    );

    const result = ReportSchema.validateCreateReport(formData);

    expect(result.evidence).toEqual([]);
  });

  it('rejects title shorter than 3 characters', () => {
    expect(() =>
      ReportSchema.validateCreateReport(
        makeValidReportFormData({
          title: 'ab',
        }),
      ),
    ).toThrow(ApiError);
  });

  it('rejects unsupported report category', () => {
    expect(() =>
      ReportSchema.validateCreateReport(
        makeValidReportFormData({
          category: 'BULLYING',
        }),
      ),
    ).toThrow(/Invalid report category/);
  });

  it('rejects invalid incident date format', () => {
    expect(() =>
      ReportSchema.validateCreateReport(
        makeValidReportFormData({
          incidentDate: 'not-a-date',
        }),
      ),
    ).toThrow(/Invalid date format/);
  });

  it('rejects incident date in the future', () => {
    expect(() =>
      ReportSchema.validateCreateReport(
        makeValidReportFormData({
          incidentDate: '2999-12-31',
        }),
      ),
    ).toThrow(/Incident date must be in the past/);
  });

  it('rejects incident date older than 5 years', () => {
    expect(() =>
      ReportSchema.validateCreateReport(
        makeValidReportFormData({
          incidentDate: '2010-01-01',
        }),
      ),
    ).toThrow(/within the last 5 years/);
  });

  it('rejects empty province, city, and district', () => {
    const formData = makeValidReportFormData();

    formData.set('province', '');
    formData.set('city', '');
    formData.set('district', '');

    expect(() => ReportSchema.validateCreateReport(formData)).toThrow(
      /Province is required.*City is required.*District is required/,
    );
  });

  it('rejects missing province, city, and district when fields are not submitted', () => {
    const formData = makeValidReportFormData();

    formData.delete('province');
    formData.delete('city');
    formData.delete('district');

    expect(() => ReportSchema.validateCreateReport(formData)).toThrow(
      /Report validation failed/,
    );
  });

  it('rejects description shorter than 20 characters', () => {
    expect(() =>
      ReportSchema.validateCreateReport(
        makeValidReportFormData({
          description: 'Terlalu pendek',
        }),
      ),
    ).toThrow(/Description must be at least 20 characters/);
  });

  it('rejects evidence file larger than 10MB', () => {
    const formData = makeValidReportFormData();

    const bigFile = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      'besar.png',
      {
        type: 'image/png',
      },
    );

    formData.append('evidence', bigFile);

    expect(() => ReportSchema.validateCreateReport(formData)).toThrow(
      /Each file must be at most 10MB/,
    );
  });

  it('rejects unsupported evidence file type', () => {
    const formData = makeValidReportFormData();

    formData.append(
      'evidence',
      new File(['x'], 'script.exe', {
        type: 'application/x-msdownload',
      }),
    );

    expect(() => ReportSchema.validateCreateReport(formData)).toThrow(
      /PDF, JPG, or PNG/,
    );
  });
});
