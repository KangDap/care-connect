import type { ReportModel } from '@/generated/prisma/models/Report';
import { ApiError, Errors } from '@/lib/error';
import { getSupabaseClient } from '@/lib/supabase';

import {
  addReportEvidences,
  createReport as createReportRepository,
} from './report.repositories';
import { ReportSchema } from './report.schema';
import type { CreateReportInput, ReportEvidenceInput } from './report.type';

export class ReportService {
  static validateCreateReport(formData: FormData): CreateReportInput {
    return ReportSchema.validateCreateReport(formData);
  }

  static async createReport(
    userId: string,
    validatedData: CreateReportInput,
  ): Promise<ReportModel> {
    try {
      const {
        title,
        category,
        incidentDate,
        province,
        city,
        district,
        address,
        description,
        isAnonymous,
        evidence,
      } = validatedData;

      const uploadedEvidences: ReportEvidenceInput[] = [];
      const supabase = getSupabaseClient();

      if (evidence && evidence.length > 0 && supabase) {
        for (const file of evidence) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const fileData = await file.arrayBuffer();

            const { error: uploadError } = await supabase.storage
              .from('reports-evidence')
              .upload(fileName, fileData, {
                contentType: file.type,
              });

            if (uploadError) {
              console.error('Evidence upload error:', uploadError);
              throw Errors.storage('Failed to upload report evidence');
            }

            const { data: publicUrl } = supabase.storage
              .from('reports-evidence')
              .getPublicUrl(fileName);

            uploadedEvidences.push({
              fileName: file.name,
              fileUrl: publicUrl.publicUrl,
              mimeType: file.type,
              fileSize: file.size,
            });
          } catch (fileError) {
            console.error('Individual file upload error:', fileError);
            if (fileError instanceof ApiError) {
              throw fileError;
            }
            throw Errors.storage(
              'Failed to upload one of the report evidence files',
            );
          }
        }
      }

      const report = await createReportRepository({
        userId,
        title,
        category,
        incidentDate,
        province,
        city,
        district,
        address: address || undefined,
        description,
        isAnonymous,
        status: 'PENDING',
        isPublic: true,
      });

      if (uploadedEvidences.length > 0) {
        await addReportEvidences(report.id, uploadedEvidences);
      }

      return report;
    } catch (error) {
      console.error('REPORT CREATE SERVICE ERROR:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw Errors.unprocessable('Failed to create report');
    }
  }
}
