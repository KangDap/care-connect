import { prisma } from '@/lib/prisma';

import { CommunityClient } from './CommunityClient';

export default async function AdminCommunityChatPage() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      chats: { take: 1, orderBy: { timestamp: 'desc' } },
    },
  });

  return <CommunityClient channels={channels} />;
}
