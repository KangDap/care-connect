import { Errors } from '@/lib/error';
import { z } from 'zod';

import { SaveScheduleDTO } from './consultation.types';

export class ConsultationSchema {
  static scheduleQuery = z.object({
    date: z
      .string()
      .min(1, 'Tanggal harus diisi')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  });

  static createConsultation = z.object({
    title: z
      .string()
      .min(1, 'Judul konsultasi harus diisi')
      .min(5, 'Judul minimal 5 karakter'),
    nature: z.string().min(1, 'Jenis konsultasi harus dipilih'),
    description: z
      .string()
      .min(1, 'Deskripsi harus diisi')
      .min(10, 'Deskripsi minimal 10 karakter'),
    date: z
      .string()
      .min(1, 'Tanggal harus diisi')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    time: z
      .string()
      .min(1, 'Waktu harus diisi')
      .regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
    isAnonymous: z.boolean().default(false),
    document: z
      .instanceof(File)
      .nullable()
      .optional()
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024,
        'Ukuran file maksimal 5MB',
      ),
  });

  static saveScheduleSchema = z.object({
    userId: z.string().min(1, 'User ID diperlukan'),
    slots: z.array(
      z.object({
        dayOfWeek: z.number().min(1).max(7),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    ),
  });

  static validateScheduleQuery(data: unknown) {
    const result = this.scheduleQuery.safeParse(data);
    if (!result.success) {
      throw Errors.badRequest(
        'Format query tidak valid',
        result.error.flatten().fieldErrors,
      );
    }
    return result.data;
  }

  static validateCreateConsultation(formData: FormData) {
    const data = {
      title: formData.get('title'),
      nature: formData.get('nature'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      isAnonymous: formData.get('isAnonymous') === 'true',
      document: formData.get('document'),
    };

    const result = this.createConsultation.safeParse(data);
    if (!result.success) {
      throw Errors.badRequest(
        'Data konsultasi tidak valid',
        result.error.flatten().fieldErrors,
      );
    }
    return result.data;
  }

  static validateSaveSchedule(data: unknown): SaveScheduleDTO {
    const result = this.saveScheduleSchema.safeParse(data);
    if (!result.success) {
      throw Errors.badRequest(
        'Data jadwal tidak valid',
        result.error.flatten().fieldErrors,
      );
    }
    return result.data as SaveScheduleDTO;
  }
}
