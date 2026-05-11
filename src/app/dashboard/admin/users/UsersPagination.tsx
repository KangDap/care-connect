'use client';

import { Pagination } from '@/components/pagination';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

export function UsersPagination({ totalPages }: { totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={(p) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', p.toString());
        router.push(`/dashboard/admin/users?${params.toString()}`);
      }}
    />
  );
}
