'use client';

import { Card } from '@/components/card';
import { Pagination } from '@/components/pagination';
import React, { ReactNode } from 'react';

export interface Column<T> {
  header: ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  className?: string;
  minWidth?: string; // Optional custom min-width class for horizontal scroll behavior

  // Pagination Props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  paginationInfo?: ReactNode; // e.g. "Showing 1-10 of 100"
  paginationNode?: ReactNode; // Custom pagination component
  renderExpandedRow?: (item: T) => ReactNode; // Render custom expandable content on hover/click
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available.',
  className = '',
  minWidth = 'min-w-[640px]',
  currentPage,
  totalPages,
  onPageChange,
  paginationInfo,
  paginationNode,
  renderExpandedRow,
}: TableProps<T>) {
  const [hoveredRowId, setHoveredRowId] = React.useState<
    string | number | null
  >(null);
  const [expandedRowId, setExpandedRowId] = React.useState<
    string | number | null
  >(null);

  return (
    <Card
      className={`overflow-hidden rounded-2xl md:rounded-3xl shadow-sm ${
        className.includes('rounded-t-none') ? 'md:rounded-t-none' : ''
      } ${className} p-0`}
    >
      <div className="overflow-x-auto w-full">
        <table className={`w-full text-left ${minWidth}`}>
          <thead className="bg-[#F7F3ED]/30 md:bg-[#F7F3ED]/50 text-[10px] md:text-[11px] text-[#8EA087] font-black uppercase tracking-widest border-b border-[#D0D5CB]/30">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 sm:px-6 py-3.5 md:py-4 ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          {data.length === 0 ? (
            <tbody className="bg-white">
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 sm:px-6 py-8 md:py-12 text-center text-[#8EA087] font-medium italic text-xs md:text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          ) : (
            data.map((row) => {
              const rowId = keyExtractor(row);
              const isExpanded =
                renderExpandedRow &&
                (hoveredRowId === rowId || expandedRowId === rowId);

              return (
                <tbody
                  key={rowId}
                  className="bg-white border-b border-[#F7F3ED] last:border-0"
                  onMouseEnter={() =>
                    renderExpandedRow && setHoveredRowId(rowId)
                  }
                  onMouseLeave={() =>
                    renderExpandedRow && setHoveredRowId(null)
                  }
                >
                  <tr
                    onClick={() => {
                      if (renderExpandedRow) {
                        setExpandedRowId((prev) =>
                          prev === rowId ? null : rowId,
                        );
                      }
                    }}
                    className={`text-xs md:text-sm transition-colors ${
                      isExpanded ? 'bg-[#FDFCFB]' : 'hover:bg-[#FDFCFB]/40'
                    } ${renderExpandedRow ? 'cursor-pointer group' : ''}`}
                  >
                    {columns.map((col, idx) => (
                      <td
                        key={idx}
                        className={`px-4 sm:px-6 py-4 md:py-5 ${col.className || ''}`}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                            ? (row[col.accessorKey] as ReactNode)
                            : null}
                      </td>
                    ))}
                  </tr>
                  {renderExpandedRow && (
                    <tr className="border-0">
                      <td colSpan={columns.length} className="p-0">
                        <div
                          className={`overflow-hidden transition-all duration-500 ease-in-out bg-[#FDFCFB] ${
                            isExpanded ? 'max-h-[1000px]' : 'max-h-0'
                          }`}
                        >
                          <div className="px-4 sm:px-6 pb-5 pt-1">
                            {renderExpandedRow(row)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })
          )}
        </table>
      </div>

      {(paginationNode ||
        (totalPages !== undefined && totalPages > 1 && onPageChange)) && (
        <div className="px-4 sm:px-6 py-4 md:py-5 bg-[#F7F3ED]/30 border-t border-[#F7F3ED] flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          {paginationInfo ? (
            <div className="text-[#8EA087] text-xs font-bold text-center sm:text-left">
              {paginationInfo}
            </div>
          ) : (
            <div />
          )}
          <div className="w-full sm:w-auto flex justify-center">
            {paginationNode ? (
              paginationNode
            ) : (
              <Pagination
                currentPage={currentPage!}
                totalPages={totalPages!}
                onPageChange={onPageChange!}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
