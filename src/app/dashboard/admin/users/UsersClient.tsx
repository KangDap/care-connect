'use client';

import { Table } from '@/components/table';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

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
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();

  const fmtDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.role,
        user.banned ? 'non-active banned inactive' : 'active',
        user.id,
      ].some((value) => value.toLowerCase().includes(searchQuery)),
    );
  }, [searchQuery, users]);

  return (
    <Table
      data={filteredUsers}
      keyExtractor={(u) => u.id}
      minWidth="min-w-[780px]"
      emptyMessage="No users found."
      paginationInfo={
        searchQuery
          ? `Showing ${filteredUsers.length} of ${users.length} users on this page`
          : `Showing ${(page - 1) * perPage + 1}–${Math.min(
              page * perPage,
              totalCount,
            )} of ${totalCount}`
      }
      paginationNode={
        totalPages > 1 ? <UsersPagination totalPages={totalPages} /> : null
      }
      columns={[
        {
          header: 'Name',
          className: 'whitespace-nowrap',
          cell: (user) => (
            <span className="font-medium text-[#193C1F]">{user.name}</span>
          ),
        },
        {
          header: 'Email',
          className: 'max-w-[260px] truncate text-gray-600',
          cell: (user) => user.email,
        },
        {
          header: 'Role',
          className: 'whitespace-nowrap font-bold text-gray-600',
          cell: (user) => user.role,
        },
        {
          header: 'Joined',
          className: 'whitespace-nowrap text-gray-600',
          cell: (user) => fmtDate(user.createdAt),
        },
        {
          header: 'Status',
          className: 'whitespace-nowrap',
          cell: (user) =>
            user.banned ? (
              <span className="inline-flex min-w-[86px] items-center justify-center whitespace-nowrap rounded-full border border-red-200 bg-red-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
                Inactive
              </span>
            ) : (
              <span className="inline-flex min-w-[86px] items-center justify-center whitespace-nowrap rounded-full border border-green-200 bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700">
                Active
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
