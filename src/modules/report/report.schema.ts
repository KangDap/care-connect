import { Errors } from '@/lib/error';
import { z } from 'zod';

import type { CreateReportInput } from './report.type';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
type CreateReportFormDataEntries = Record<string, FormDataEntryValue | File[]>;

// Validasi bahwa incidentDate tidak boleh di masa depan dan tidak terlalu lama di masa lalu
const validateIncidentDate = (dateStr: string) => {
  const selectedDate = new Date(dateStr);
  const now = new Date();

  // Tidak boleh masa depan
  if (selectedDate > now) {
    return false;
  }

  // Tidak boleh lebih dari 5 tahun lalu
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  if (selectedDate < fiveYearsAgo) {
    return false;
  }

  return true;
};

const createReportSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters'),
  category: z
    .string()
    .refine(
      (val) => ['PHYSICAL', 'SEXUAL', 'PSYCHOLOGICAL', 'OTHER'].includes(val),
      'Invalid report category',
    ),
  incidentDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
    .refine(
      validateIncidentDate,
      'Incident date must be in the past and within the last 5 years',
    ),
  province: z
    .string()
    .min(1, 'Province is required')
    .max(120, 'Province must be at most 120 characters'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(120, 'City must be at most 120 characters'),
  district: z
    .string()
    .min(1, 'District is required')
    .max(120, 'District must be at most 120 characters'),
  address: z
    .string()
    .max(255, 'Address must be at most 255 characters')
    .optional(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  isAnonymous: z
    .enum(['on', ''])
    .transform((val) => val === 'on')
    .optional()
    .default(false),
  evidence: z
    .unknown()
    .transform((val) => {
      // Filter files yang valid dan bukan kosong
      if (!val || !Array.isArray(val)) return [];
      return val.filter(
        (file): file is File => file instanceof File && file.size > 0,
      );
    })
    .refine(
      (files) =>
        files.every(
          (file) =>
            file.size <= MAX_FILE_SIZE &&
            ALLOWED_FILE_TYPES.includes(file.type),
        ),
      'Each file must be at most 10MB and of type PDF, JPG, or PNG',
    )
    .optional()
    .default([]),
});

export class ReportSchema {
  static validateCreateReport(formData: FormData): CreateReportInput {
    // Extract evidence files sebelum diproses oleh Zod
    const evidenceFiles: File[] = [];
    const formDataEntries: CreateReportFormDataEntries = {};

    for (const [key, value] of formData.entries()) {
      if (key === 'evidence') {
        if (value instanceof File && value.size > 0) {
          evidenceFiles.push(value);
        }
      } else {
        formDataEntries[key] = value;
      }
    }

    // Tambahkan files ke object untuk validasi
    formDataEntries.evidence = evidenceFiles;

    const parseResult = createReportSchema.safeParse(formDataEntries);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Report validation failed: ${errorMessage}`);
    }

    return {
      ...parseResult.data,
      incidentDate: new Date(parseResult.data.incidentDate),
    } as CreateReportInput;
  }
}
