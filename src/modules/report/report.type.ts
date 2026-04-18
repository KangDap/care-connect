import type { ReportModel } from '@/generated/prisma/models/Report';
import type { ReportEvidenceModel } from '@/generated/prisma/models/ReportEvidence';

export interface CreateReportInput {
  title: string;
  category: 'PHYSICAL' | 'SEXUAL' | 'PSYCHOLOGICAL' | 'OTHER';
  incidentDate: Date;
  province: string;
  city: string;
  district: string;
  address?: string;
  description: string;
  isAnonymous: boolean;
  evidence?: File[];
}

export interface CreateReportRepositoryInput {
  userId: string;
  title: string;
  category: 'PHYSICAL' | 'SEXUAL' | 'PSYCHOLOGICAL' | 'OTHER';
  incidentDate: Date;
  province: string;
  city: string;
  district: string;
  address?: string;
  description: string;
  isAnonymous: boolean;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  isPublic?: boolean;
}

export interface ReportEvidenceInput {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export interface ReportResponse extends ReportModel {
  evidences?: ReportEvidenceModel[];
}
