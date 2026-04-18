import { prisma } from '@/lib/prisma';

/**
 * Creates a chat message linked directly to a consultation.
 */
export const createConsultationChat = async (
  consultationId: number,
  userId: string,
  content: string,
  isAnonymous: boolean,
  mediaUrl: string | null = null,
  replyToId: number | null = null,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any).consultationChat;

  if (!model) {
    console.error(
      "Prisma Error: 'consultationChat' model is missing from Prisma Client.",
    );
    console.error(
      'Available models:',
      Object.keys(prisma).filter((k) => !k.startsWith('_')),
    );
    throw new Error(
      "Database client synchronization error. Please run 'npx prisma generate'.",
    );
  }

  return model.create({
    data: {
      consultationId,
      userId,
      content,
      isAnonymous,
      mediaUrl,
      replyToId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        },
      },
      replyTo: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Retrieves chat history for a given consultation, ordered by creation time.
 */
export const getConsultationChatsByConsultationId = async (
  consultationId: number,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any).consultationChat;

  if (!model) {
    throw new Error(
      "Database client synchronization error. Please run 'npx prisma generate'.",
    );
  }

  return model.findMany({
    where: { consultationId },
    orderBy: { timestamp: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        },
      },
      replyTo: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Validate that user has access to this consultation.
 */
export const findConsultationParticipant = async (
  consultationId: number,
  userId: string,
) => {
  return prisma.consultation.findFirst({
    where: {
      id: consultationId,
      OR: [{ userId }, { psychologistId: userId }],
    },
  });
};
