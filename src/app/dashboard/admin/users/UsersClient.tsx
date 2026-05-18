'use client';

import { Table } from '@/components/table';

import { UserActions } from './UserActions';
import { UsersPagination } from './UsersPagination';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean | null;
  createdAt: Date;
};

type Props = {
  users: UserData[];
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
};

export function UsersClient({
  users,
  page,
  perPage,
  totalCount,
  totalPages,
}: Props) {
  const fmtDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Table
      data={users}
      keyExtractor={(u) => u.id}
      emptyMessage="No users found."
      paginationInfo={`Showing ${(page - 1) * perPage + 1}–${Math.min(
        page * perPage,
        totalCount,
      )} of ${totalCount}`}
      paginationNode={
        totalPages > 1 ? <UsersPagination totalPages={totalPages} /> : null
      }
      columns={[
        {
          header: 'Name',
          cell: (user) => (
            <span className="font-medium text-[#193C1F]">{user.name}</span>
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
  );
}
