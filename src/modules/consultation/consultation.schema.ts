import { Errors } from '@/lib/error';
import { z } from 'zod';

// Validation functions in schema file
import type {
  ConsultationScheduleQueryInput,
  CreateConsultationInput,
} from './consultation.types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const validateDateTime = (dateStr: string, timeStr: string) => {
  const selectedDate = new Date(dateStr);
  const selectedTime = new Date(`${dateStr}T${timeStr}:00`);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDateOnly = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );

  if (selectedDateOnly < today) {
    return false;
  }

  if (selectedDateOnly.getTime() === today.getTime()) {
    const currentTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
    );
    return selectedTime > currentTime;
  }

  return true;
};

export const createConsultationSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255),
    nature: z.string().min(1, 'Category is required').max(255),
    description: z.string().min(1, 'Description is required').max(255),
    date: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
    isAnonymous: z
      .enum(['on', ''])
      .transform((val) => val === 'on')
      .optional()
      .default(false),
    document: z
      .any()
      .transform((val) => (val instanceof File && val.size > 0 ? val : null))
      .refine(
        (file) =>
          file === null ||
          (file.size <= MAX_FILE_SIZE &&
            ALLOWED_FILE_TYPES.includes(file.type)),
        'Invalid file',
      )
      .optional(),
  })
  .refine((data) => validateDateTime(data.date, data.time), {
    message: 'Date and time must be in the future',
    path: ['date'],
  });

export const consultationScheduleQuerySchema = z.object({
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
});

export class ConsultationSchema {
  static validateScheduleQuery(query: {
    date?: string;
  }): ConsultationScheduleQueryInput {
    const parseResult = consultationScheduleQuerySchema.safeParse(query);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid schedule query: ${errorMessage}`);
    }

    return parseResult.data;
  }

  static validateCreateConsultation(
    formData: FormData,
  ): CreateConsultationInput {
    const parseResult = createConsultationSchema.safeParse({
      title: formData.get('title'),
      nature: formData.get('nature'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      isAnonymous: formData.get('isAnonymous') ?? '',
      document: formData.get('document'),
    });

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw Errors.badRequest(`Invalid consultation data: ${errorMessage}`);
    }

    return parseResult.data;
  }
}
