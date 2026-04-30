export interface Channel {
  id: number;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  type: 'PUBLIC' | 'PRIVATE';
  createdAt: Date;
}

export interface ChannelMember {
  channelId: number;
  userId: string;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  joinedAt: Date;
}

export interface ChatMessage {
  id: number;
  channelId: number;
  userId: string;
  content: string;
  mediaUrl?: string | null;
  isAnonymous: boolean;
  replyToId?: number | null;
  timestamp: Date;
  editedAt?: Date | null;
  user: {
    id: string;
    name: string;
    image?: string | null;
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

export interface CreateChannelDTO {
  name: string;
  description?: string;
  coverUrl?: string;
  type?: 'PUBLIC' | 'PRIVATE';
}

export interface SendMessageDTO {
  channelId: number;
  content: string;
  media?: File | null;
  mediaUrl?: string | null;
  isAnonymous?: boolean;
  replyToId?: number | null;
}

export interface UpdateMemberRoleDTO {
  userId: string;
  channelId: number;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
}
