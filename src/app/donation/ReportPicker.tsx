'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { Pagination } from '@/components/pagination';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Filter,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useEffect, useMemo, useState } from 'react';

type ReportOption = {
  id: number;
  title: string;
  category: string;
  status: string;
  city: string;
  province: string;
  incidentDate: string;
  description: string;
  createdAt: string;
  coverImageUrl?: string | null;
};

type Props = {
  onSelect: (report: ReportOption) => void;
  onBack: () => void;
};

const categoryOptions = [
  { label: 'Physical Violence', value: 'PHYSICAL' },
  { label: 'Sexual Harassment', value: 'SEXUAL' },
  { label: 'Psychological / Verbal', value: 'PSYCHOLOGICAL' },
  { label: 'Other', value: 'OTHER' },
];

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Reviewed', value: 'REVIEWED' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const categoryLabel = Object.fromEntries(
  categoryOptions.map((category) => [category.value, category.label]),
);

const statusLabel = Object.fromEntries(
  statusOptions.map((status) => [status.value, status.label]),
);

const getStatusBadge = (status: string) => {
  if (status === 'RESOLVED') return 'SUCCESS';
  if (status === 'PENDING') return 'PENDING';
  if (status === 'REVIEWED') return 'UPCOMING';
  return 'DEFAULT';
};

const reportsPerPage = 6;

export function ReportPicker({ onSelect, onBack }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamValue = searchParams.get('search') || '';
  const searchParamsString = searchParams.toString();

  const [reports, setReports] = useState<ReportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParamValue);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetch('/api/publicreports')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch reports');
        return response.json();
      })
      .then((data) => setReports(data.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    startTransition(() => {
      setSearchQuery(searchParamValue);
      setCurrentPage(1);
    });
  }, [searchParamValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalizedSearch = searchQuery.trim();
      if (searchParamValue === normalizedSearch) return;

      const params = new URLSearchParams(searchParamsString);
      if (normalizedSearch) {
        params.set('search', normalizedSearch);
      } else {
        params.delete('search');
      }
      params.delete('page');

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [pathname, router, searchParamValue, searchParamsString, searchQuery]);

  const handleCategoryToggle = (category: string) => {
    setCurrentPage(1);
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((current) => current !== category)
        : [...prev, category],
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedStatus('ALL');
    setLocationFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        const matchesSearch =
          report.title.toLowerCase().includes(normalizedSearch) ||
          report.description.toLowerCase().includes(normalizedSearch);

        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.includes(report.category);

        const matchesStatus =
          selectedStatus === 'ALL' || report.status === selectedStatus;

        const normalizedLocation = locationFilter.toLowerCase();
        const matchesLocation =
          report.city.toLowerCase().includes(normalizedLocation) ||
          report.province.toLowerCase().includes(normalizedLocation);

        const reportDate = new Date(report.incidentDate).getTime();
        const start = startDate ? new Date(startDate).getTime() : -Infinity;
        const end = endDate ? new Date(endDate).getTime() : Infinity;
        const matchesDate = reportDate >= start && reportDate <= end;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesLocation &&
          matchesDate
        );
      })
      .sort((a, b) => {
        const newest =
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return sortBy === 'newest' ? newest : -newest;
      });
  }, [
    reports,
    searchQuery,
    selectedCategories,
    selectedStatus,
    locationFilter,
    startDate,
    endDate,
    sortBy,
  ]);

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage,
  );

  return (
    <div className="pb-10 text-[#193c1f]">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to donation options"
            className="p-2 sm:p-2.5 bg-white border border-[#D0D5CB] hover:bg-[#F7F3ED] rounded-xl sm:rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} className="text-[#193c1f]" />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-normal md:text-4xl">
              Choose a Report to Support
            </h2>
            <p className="mt-2 max-w-2xl font-medium text-[#8ea087]">
              Pick any public report, then continue with your donation.
            </p>
          </div>
        </div>
      </div>

      <Input
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search reports..."
        icon={<Search size={20} />}
        className="h-16 bg-white text-base shadow-sm"
      />

      <div className="mt-10 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-80">
          <Card className="sticky top-8 rounded-3xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Filter size={18} />
                Filters
              </h3>
              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
                className="px-2 py-2"
              >
                <RotateCcw size={14} />
                Reset
              </Button>
            </div>

            <div className="space-y-6">
              <Input
                label="Sort By"
                type="select"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest</option>
              </Input>

              <Input
                label="Status"
                type="select"
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Input>

              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-[#8ea087]">
                  Category
                </p>
                <div className="flex flex-col gap-2">
                  {categoryOptions.map((category) => {
                    const isSelected = selectedCategories.includes(
                      category.value,
                    );

                    return (
                      <Button
                        key={category.value}
                        type="button"
                        onClick={() => handleCategoryToggle(category.value)}
                        variant="ghost"
                        className="justify-start rounded-2xl px-2 py-2 text-left normal-case tracking-normal text-[#193c1f] hover:bg-[#f7f3ed]"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'border-[#193c1f] bg-[#193c1f] text-white'
                              : 'border-[#d0d5cb] text-transparent'
                          }`}
                        >
                          <Check size={14} />
                        </span>
                        <span className="text-sm font-bold">
                          {category.label}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Location"
                value={locationFilter}
                onChange={(event) => {
                  setLocationFilter(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="City or province..."
                icon={<MapPin size={16} />}
              />

              <div className="grid grid-cols-1 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Calendar size={16} />}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Calendar size={16} />}
                />
              </div>
            </div>
          </Card>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold">
              Showing{' '}
              <span className="text-[#8ea087]">{filteredReports.length}</span>{' '}
              of {reports.length} reports
            </p>
          </div>

          {loading ? (
            <Card className="rounded-3xl py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[#193c1f]" />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-[#8ea087]">
                Loading reports...
              </p>
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card className="rounded-3xl border-dashed py-16 text-center">
              <FileText size={42} className="mx-auto mb-4 text-[#8ea087]" />
              <h3 className="text-lg font-bold">No reports found</h3>
              <p className="mt-1 text-sm text-[#8ea087]">
                Try adjusting your filters.
              </p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {paginatedReports.map((report) => (
                  <Card
                    key={report.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(report)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect(report);
                      }
                    }}
                    className="group flex h-full cursor-pointer flex-col rounded-3xl transition-all duration-300 hover:border-[#193c1f] hover:shadow-xl"
                  >
                    <div className="flex h-full flex-col text-left">
                      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-[#f7f3ed]">
                        {report.coverImageUrl ? (
                          <Image
                            src={report.coverImageUrl}
                            alt={report.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#8ea087]">
                            <FileText size={52} />
                          </div>
                        )}
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <Badge>
                            {categoryLabel[report.category] || report.category}
                          </Badge>
                          <Badge status={getStatusBadge(report.status)}>
                            {statusLabel[report.status] || report.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8ea087]">
                          <span>#{String(report.id).padStart(4, '0')}</span>
                          <span className="h-1 w-1 rounded-full bg-[#d0d5cb]" />
                          <span className="truncate">
                            {report.city}, {report.province}
                          </span>
                        </div>

                        <h3 className="mb-3 line-clamp-2 text-xl font-black leading-tight transition-colors group-hover:text-[#8ea087]">
                          {report.title}
                        </h3>

                        <p className="mb-6 line-clamp-3 flex-1 text-sm font-medium leading-relaxed text-[#193c1f]/60">
                          {report.description}
                        </p>

                        <div className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-[#f7f3ed] px-4 py-3 text-sm font-bold transition-colors group-hover:bg-[#193c1f] group-hover:text-white">
                          Donate Now
                          <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
