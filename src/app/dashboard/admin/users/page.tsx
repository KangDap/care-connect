import { Table } from '@/components/table';
import { prisma } from '@/lib/prisma';

import { UserActions } from './UserActions';
import { UsersPagination } from './UsersPagination';

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

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);

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

      <Table
        data={users}
        keyExtractor={(u) => u.id}
        emptyMessage="No users found."
        paginationInfo={`Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, totalCount)} of ${totalCount}`}
        paginationNode={
          totalPages > 1 ? <UsersPagination totalPages={totalPages} /> : null
        }
        columns={[
          {
            header: 'Name',
            cell: (user) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F3ED] border border-[#D0D5CB] flex items-center justify-center shrink-0">
                  <div className="text-[10px] font-bold text-[#193C1F]">
                    {user.name.charAt(0)}
                  </div>
                </div>
                <span className="font-medium text-[#193C1F]">{user.name}</span>
              </div>
            ),
          },
          {
            header: 'Email',
            className: 'text-gray-600',
            cell: (user) => user.email,
          },
          {
            header: 'Role',
            className: 'text-gray-600 font-bold',
            cell: (user) => user.role,
          },
          {
            header: 'Joined',
            className: 'text-gray-600',
            cell: (user) => fmtDate(user.createdAt),
          },
          {
            header: 'Status',
            cell: (user) =>
              user.banned ? (
                <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                  NON-ACTIVE
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                  ACTIVE
                </span>
              ),
          },
          {
            header: 'Actions',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (user) => (
              <UserActions
                id={user.id}
                role={user.role}
                banned={user.banned}
                name={user.name}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
