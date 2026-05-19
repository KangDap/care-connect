'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { Pagination } from '@/components/pagination';
import { PublicHeader } from '@/components/public-header';
import {
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
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useEffect, useMemo, useState } from 'react';

interface Report {
  id: string;
  title: string;
  category: string;
  province: string;
  city: string;
  status: string;
  incidentDate: string;
  description: string;
  createdAt: string;
  coverImageUrl: string | null;
}

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

const PublicReportsContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamValue = searchParams.get('search') || '';
  const searchParamsString = searchParams.toString();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParamValue);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/publicreports');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setReports(data.data || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
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
    <div className="min-h-screen bg-[#f7f3ed] text-[#193c1f]">
      <PublicHeader />

      <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12">
        <div className="mb-8 flex flex-col gap-6 text-left md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-4 text-4xl font-black uppercase leading-none tracking-normal text-[#193c1f] md:text-6xl">
              Public Reports
            </h1>
            <p className="max-w-2xl text-base font-medium text-[#8ea087] md:text-lg">
              Community safety reports from every moderation status.
            </p>
          </div>
          <Link href="/report">
            <Button className="w-full uppercase tracking-widest md:w-auto">
              Create Report
              <ArrowRight size={18} />
            </Button>
          </Link>
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
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                  <Filter size={18} />
                  Filters
                </h2>
                <Button
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

            {isLoading ? (
              <Card className="rounded-3xl py-16 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#193c1f]" />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-[#8ea087]">
                  Loading reports...
                </p>
              </Card>
            ) : filteredReports.length === 0 ? (
              <Card className="rounded-3xl border-dashed py-16 text-center">
                <FileText size={40} className="mx-auto mb-4 text-[#8ea087]" />
                <p className="font-bold">No reports found.</p>
                <p className="mt-1 text-sm text-[#8ea087]">
                  Try adjusting your filters.
                </p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {paginatedReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/publicreports/${report.id}`}
                      className="group block"
                    >
                      <Card className="flex h-full flex-col rounded-3xl transition-all duration-300 hover:border-[#193c1f] hover:shadow-xl">
                        <div className="relative h-56 overflow-hidden bg-[#EBE6DE]">
                          {report.coverImageUrl ? (
                            <Image
                              src={report.coverImageUrl}
                              alt={report.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#8ea087]">
                              <FileText size={52} />
                            </div>
                          )}
                          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                            <Badge>
                              {categoryLabel[report.category] ||
                                report.category}
                            </Badge>
                            <Badge status={getStatusBadge(report.status)}>
                              {statusLabel[report.status] || report.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-7">
                          <span className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#8ea087]">
                            Case #{report.id.toString().slice(-5).toUpperCase()}
                          </span>
                          <h3 className="mb-3 text-2xl font-black leading-tight transition-colors group-hover:text-[#8ea087]">
                            {report.title}
                          </h3>
                          <p className="mb-7 line-clamp-3 text-sm font-medium leading-relaxed text-[#193c1f]/60">
                            {report.description}
                          </p>

                          <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#f7f3ed] pt-5">
                            <span className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase">
                              <MapPin
                                size={14}
                                className="shrink-0 text-[#8ea087]"
                              />
                              <span className="truncate">{report.city}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-[11px] font-black uppercase transition-transform group-hover:translate-x-1">
                              View Details
                              <ArrowRight size={16} />
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
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
      </main>
    </div>
  );
};

export default function PublicReportsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f3ed] text-[#193c1f]">
          <PublicHeader />
          <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12">
            <Card className="rounded-3xl py-16 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#193c1f]" />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-[#8ea087]">
                Loading reports...
              </p>
            </Card>
          </main>
        </div>
      }
    >
      <PublicReportsContent />
    </React.Suspense>
  );
}
