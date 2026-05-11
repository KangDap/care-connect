import type { ConsultationModel } from '@/generated/prisma/models/Consultation';
import type { ScheduleModel } from '@/generated/prisma/models/Schedule';
import { ApiError, Errors } from '@/lib/error';
import { getSupabaseClient } from '@/lib/supabase';

import {
  createConsultation as createConsultationRepository,
  createManySchedules,
  deleteSchedulesByUserId,
  getActivePsychologists,
  getSchedulesByUserId,
} from './consultation.repositories';
import { getScheduleAvailabilityForDate } from './consultation.schedule';
import { ConsultationSchema } from './consultation.schema';
import type {
  ConsultationScheduleSlot,
  CreateConsultationInput,
  PsychologistSummary,
  TimeSlotDTO,
} from './consultation.types';

const DAY_NAME_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

      const slots = await this.getScheduleAvailability(date);
      const selectedSlot = slots.find((slot) => slot.time === time);

      if (
        !selectedSlot ||
        !selectedSlot.available ||
        selectedSlot.availablePsychologistIds.length === 0
      ) {
        throw Errors.unprocessable('Selected time slot is no longer available');
      }

      const randomIndex = Math.floor(
        Math.random() * selectedSlot.availablePsychologistIds.length,
      );
      const assignedPsychologistId =
        selectedSlot.availablePsychologistIds[randomIndex];

      const [hours, minutes] = time.split(':').map(Number);
      const timeInUTC = new Date(Date.UTC(1970, 0, 1, hours - 7, minutes));

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

  // Schedule Management Services
  static async getPsychologists(): Promise<PsychologistSummary[]> {
    try {
      const psychologists = await getActivePsychologists();

      return psychologists.map((p) => {
        const daySet = new Set<number>();
        p.schedules.forEach((s) => daySet.add(s.dayOfWeek));

        const activeDays = Array.from(daySet)
          .sort((a, b) => a - b)
          .map((dayNum) => DAY_NAME_SHORT[dayNum - 1]);

        return {
          id: p.id,
          name: p.name,
          image: p.image,
          activeDays,
        };
      });
    } catch (error) {
      console.error('GET PSYCHOLOGISTS SERVICE ERROR:', error);
      throw Errors.unprocessable('Failed to get psychologists');
    }
  }

  static async getSchedules(userId: string) {
    try {
      const schedules = await getSchedulesByUserId(userId);

      return schedules.map((s: ScheduleModel) => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);

        const startH = (start.getUTCHours() + 7) % 24;
        const startM = start.getUTCMinutes();
        const endH = (end.getUTCHours() + 7) % 24;
        const endM = end.getUTCMinutes();

        return {
          ...s,
          startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        };
      });
    } catch (error) {
      console.error('GET SCHEDULES SERVICE ERROR:', error);
      throw Errors.unprocessable('Failed to get schedules');
    }
  }

  static async saveSchedules(userId: string, rawSlots: TimeSlotDTO[]) {
    try {
      const validated = ConsultationSchema.validateSaveSchedule({
        userId,
        slots: rawSlots,
      });
      const { slots } = validated;

      // Validation for overlaps
      for (let i = 0; i < slots.length; i++) {
        const a = slots[i];

        // Treat "00:00" as "24:00" for end time validation
        const aEnd = a.endTime === '00:00' ? '24:00' : a.endTime;

        if (a.startTime >= aEnd) {
          throw Errors.badRequest(
            `Waktu mulai harus sebelum waktu selesai pada hari ke-${a.dayOfWeek}: ${a.startTime}-${a.endTime}`,
          );
        }

        for (let j = i + 1; j < slots.length; j++) {
          const b = slots[j];
          const bEnd = b.endTime === '00:00' ? '24:00' : b.endTime;

          if (a.dayOfWeek === b.dayOfWeek) {
            // Check overlap: (StartA < EndB) and (EndA_effective > StartB)
            if (a.startTime < bEnd && aEnd > b.startTime) {
              throw Errors.badRequest(
                `Waktu tumpang tindih pada hari ke-${a.dayOfWeek}: ${a.startTime}-${a.endTime} dan ${b.startTime}-${b.endTime}`,
              );
            }
          }
        }
      }

      const dataToSave = slots.map((slot: TimeSlotDTO) => {
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);

        // If end time is 00:00, it actually means the start of the NEXT day
        // But for our schema which is day-specific, we can store it as 23:59:59
        // or just let it be 00:00 and handle the date correctly.
        // To keep it simple and consistent with WIB-UTC -7:
        // 00:00 WIB is 17:00 UTC (previous day).

        const startTime = new Date(Date.UTC(1970, 0, 1, startH - 7, startM));

        // If endH is 0, we can treat it as 24 for the calculation
        const effectiveEndH = slot.endTime === '00:00' ? 24 : endH;
        const endTime = new Date(Date.UTC(1970, 0, 1, effectiveEndH - 7, endM));

        return {
          userId,
          dayOfWeek: slot.dayOfWeek,
          startTime,
          endTime,
        };
      });

      await deleteSchedulesByUserId(userId);
      return await createManySchedules(dataToSave);
    } catch (error) {
      console.error('SAVE SCHEDULES SERVICE ERROR:', error);
      if (error instanceof ApiError) throw error;
      throw Errors.unprocessable('Failed to save schedules');
    }
  }
}
