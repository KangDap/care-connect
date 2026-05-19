import { prisma } from '@/lib/prisma';

import { UsersClient } from './UsersClient';

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = Number(pageStr) || 1;
  const perPage = 10;

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-black text-[#193c1f]">
          Users Moderation
        </h1>
        <p className="text-[#8ea087] font-medium">
          Manage and moderate user accounts in the platform.
        </p>
      </div>

      <UsersClient
        users={users}
        page={page}
        perPage={perPage}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}
