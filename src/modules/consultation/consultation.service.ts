import type { ConsultationModel } from '@/generated/prisma/models/Consultation';
import { ApiError, Errors } from '@/lib/error';
import { getSupabaseClient } from '@/lib/supabase';

import { createConsultation as createConsultationRepository } from './consultation.repositories';
import { getScheduleAvailabilityForDate } from './consultation.schedule';
import { ConsultationSchema } from './consultation.schema';
import type {
  ConsultationScheduleSlot,
  CreateConsultationInput,
} from './consultation.types';

export class ConsultationService {
  static validateScheduleQuery(query: { date?: string }) {
    return ConsultationSchema.validateScheduleQuery(query);
  }

  static validateCreateConsultation(formData: FormData) {
    return ConsultationSchema.validateCreateConsultation(formData);
  }

  static async getScheduleAvailability(
    date: string,
  ): Promise<ConsultationScheduleSlot[]> {
    try {
      const slots = await getScheduleAvailabilityForDate(date);
      return slots;
    } catch (error) {
      console.error('CONSULTATION SCHEDULE SERVICE ERROR:', error);
      throw Errors.unprocessable('Failed to get schedule availability');
    }
  }

  static async createConsultation(
    userId: string,
    validatedData: CreateConsultationInput,
  ): Promise<ConsultationModel> {
    try {
      const { title, nature, description, date, time, isAnonymous, document } =
        validatedData;
      let attachmentUrl = null;
      const supabase = getSupabaseClient();

      if (document && supabase) {
        const fileExt = document.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const fileData = await document.arrayBuffer();

        const { error } = await supabase.storage
          .from('consultation-files')
          .upload(fileName, fileData, {
            contentType: document.type,
          });

        if (error) {
          console.error('File upload error:', error);
          throw Errors.storage('File upload failed');
        }

        const { data: publicUrl } = supabase.storage
          .from('consultation-files')
          .getPublicUrl(fileName);

        attachmentUrl = publicUrl.publicUrl;
      }

      // Get available psychologists for the selected time slot
      const slots = await this.getScheduleAvailability(date);
      const selectedSlot = slots.find((slot) => slot.time === time);

      if (
        !selectedSlot ||
        !selectedSlot.available ||
        selectedSlot.availablePsychologistIds.length === 0
      ) {
        throw Errors.unprocessable('Selected time slot is no longer available');
      }

      // Randomly assign a psychologist from available ones
      const randomIndex = Math.floor(
        Math.random() * selectedSlot.availablePsychologistIds.length,
      );
      const assignedPsychologistId =
        selectedSlot.availablePsychologistIds[randomIndex];

      // Parse time string as WIB and convert to UTC for storage
      const WIB_OFFSET = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
      const [hours, minutes] = time.split(':').map(Number);
      const wibDate = new Date(
        `1970-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`,
      );
      const timeInUTC = new Date(wibDate.getTime() - WIB_OFFSET);

      const consultation = await createConsultationRepository({
        userId,
        psychologistId: assignedPsychologistId,
        title,
        category: nature,
        description,
        date: new Date(date),
        time: timeInUTC,
        isAnonymous,
        status: 'SCHEDULED',
        attachmentUrl,
      });

      return consultation;
    } catch (error) {
      console.error('CONSULTATION CREATE SERVICE ERROR:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw Errors.unprocessable('Failed to create consultation');
    }
  }
}
