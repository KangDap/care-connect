export interface ConsultationChatQueryInput {
  consultationId: number;
}

export interface SendConsultationMessageInput {
  consultationId: number;
  content: string;
  isAnonymous?: boolean;
  media?: File | null;
  replyToId?: number | null;
}

export interface ConsultationChatRecord {
  id: number;
  consultationId: number;
  userId: string;
  content: string;
  mediaUrl: string | null;
  isAnonymous: boolean;
  replyToId: number | null;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
  replyTo?: {
    id: number;
    content: string;
    user: {
      name: string;
    };
  } | null;
}
