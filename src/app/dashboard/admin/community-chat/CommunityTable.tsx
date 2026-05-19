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
          className: 'font-medium text-gray-600 whitespace-nowrap',
          cell: (ch) => <Badge>{ch.type}</Badge>,
        },
        {
          header: 'Created At',
          className: 'text-gray-500 text-xs md:text-sm whitespace-nowrap',
          cell: (ch) => fmtDate(ch.createdAt),
        },
        {
          header: 'Actions',
          headerClassName: 'text-right',
          className: 'text-right whitespace-nowrap',
          cell: (ch) => (
            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
              <Button
                type="button"
                onClick={() => onEdit(ch)}
                variant="outline"
                className="text-[10px] sm:text-xs px-2 py-0.5 min-h-0 h-7 whitespace-nowrap flex items-center gap-1 shrink-0"
              >
                <Pencil size={14} />
                Edit
              </Button>
              <Button
                type="button"
                onClick={() => onDelete(ch.id)}
                variant="outline"
                className="px-2 py-0.5 text-[10px] sm:text-xs h-7 min-h-0 text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 whitespace-nowrap flex items-center gap-1 shrink-0"
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
