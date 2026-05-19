import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Table } from '@/components/table';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

type Channel = {
  id: number;
  name: string;
  description: string | null;
  type: 'PUBLIC' | 'PRIVATE';
  coverUrl: string | null;
  createdAt: Date;
  chats?: { id: number; timestamp: Date }[];
};

interface CommunityTableProps {
  channels: Channel[];
  onEdit: (ch: Channel) => void;
  onDelete: (id: number) => void;
}

export function CommunityTable({
  channels,
  onEdit,
  onDelete,
}: CommunityTableProps) {
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));

  return (
    <Table
      data={channels}
      keyExtractor={(ch) => ch.id}
      emptyMessage="No channels found."
      minWidth="min-w-[780px]"
      columns={[
        {
          header: 'Channel Name',
          cell: (ch) => (
            <div className="flex min-w-[260px] items-center gap-3">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D0D5CB] bg-[#F7F3ED] md:h-10 md:w-10">
                {ch.coverUrl ? (
                  <Image
                    src={ch.coverUrl}
                    alt={ch.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[#8EA087] font-black text-[10px] md:text-xs">
                    #{ch.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <div className="font-bold text-[#193C1F] text-sm md:text-base">
                  #{ch.name}
                </div>
                <div className="text-[11px] md:text-xs text-gray-500 line-clamp-1 max-w-[150px] md:max-w-[200px]">
                  {ch.description}
                </div>
              </div>
            </div>
          ),
        },
        {
          header: 'Type',
          className: 'font-medium text-gray-600',
          cell: (ch) => <Badge>{ch.type}</Badge>,
        },
        {
          header: 'Created At',
          className: 'text-gray-500 text-xs md:text-sm',
          cell: (ch) => fmtDate(ch.createdAt),
        },
        {
          header: 'Actions',
          headerClassName: 'w-[196px] min-w-[196px] text-right',
          className:
            'w-[196px] min-w-[196px] text-right align-middle whitespace-nowrap',
          cell: (ch) => (
            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => onEdit(ch)}
                variant="outline"
                className="h-9 min-h-0 w-full shrink-0 whitespace-nowrap rounded-xl border-[#d0d5cb] bg-white px-2 py-0 text-[11px] font-black text-[#193c1f] shadow-none hover:bg-[#f7f3ed]"
              >
                <Pencil size={13} className="shrink-0" />
                Edit
              </Button>
              <Button
                type="button"
                onClick={() => onDelete(ch.id)}
                variant="outline"
                className="h-9 min-h-0 w-full shrink-0 whitespace-nowrap rounded-xl border-red-200 bg-red-50 px-2 py-0 text-[11px] font-black text-red-600 shadow-none hover:border-red-300 hover:bg-red-100 hover:text-red-700"
              >
                <Trash2 size={13} className="shrink-0" />
                Delete
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
