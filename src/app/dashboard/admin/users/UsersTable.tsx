'use client';

import { Table } from '@/components/table';

import { UserActions } from './UserActions';
import { UsersPagination } from './UsersPagination';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean | null;
  createdAt: string;
};

type UsersTableProps = {
  users: UserRow[];
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
};

export function UsersTable({
  users,
  page,
  perPage,
  totalCount,
  totalPages,
}: UsersTableProps) {
  const fmtDate = (date: string) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));

  return (
    <Table
      data={users}
      keyExtractor={(user) => user.id}
      emptyMessage="No users found."
      paginationInfo={`Showing ${(page - 1) * perPage + 1}-${Math.min(
        page * perPage,
        totalCount,
      )} of ${totalCount}`}
      paginationNode={
        totalPages > 1 ? <UsersPagination totalPages={totalPages} /> : null
      }
      columns={[
        {
          header: 'Name',
          className: 'whitespace-nowrap',
          cell: (user) => (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D0D5CB] bg-[#F7F3ED]">
                <div className="text-[10px] font-bold text-[#193C1F]">
                  {user.name.charAt(0)}
                </div>
              </div>
              <span className="font-medium text-[#193C1F] whitespace-nowrap">
                {user.name}
              </span>
            </div>
          ),
        },
        {
          header: 'Email',
          className: 'text-gray-600 whitespace-nowrap',
          cell: (user) => user.email,
        },
        {
          header: 'Role',
          className: 'text-gray-600 font-bold whitespace-nowrap',
          cell: (user) => user.role,
        },
        {
          header: 'Joined',
          className: 'text-gray-600 whitespace-nowrap',
          cell: (user) => fmtDate(user.createdAt),
        },
        {
          header: 'Status',
          className: 'whitespace-nowrap',
          cell: (user) =>
            user.banned ? (
              <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 whitespace-nowrap">
                NON-ACTIVE
              </span>
            ) : (
              <span className="rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 whitespace-nowrap">
                ACTIVE
              </span>
            ),
        },
        {
          header: 'Actions',
          headerClassName: 'text-right',
          className: 'text-right whitespace-nowrap',
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
  );
}
