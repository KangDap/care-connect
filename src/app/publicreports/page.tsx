'use client';

import { Button } from '@/components/button';
import { PublicHeader } from '@/components/public-header';
import {
  ArrowRight,
  Check,
  Filter,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

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

const PublicReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    'Physical Violence',
    'Sexual Harassment',
    'Psychological / Verbal',
    'Other',
  ];

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setLocationFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        const matchesSearch =
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description.toLowerCase().includes(searchQuery.toLowerCase());

        const categoryMapping: Record<string, string> = {
          'Physical Violence': 'PHYSICAL',
          'Sexual Harassment': 'SEXUAL',
          'Psychological / Verbal': 'PSYCHOLOGICAL',
          Other: 'OTHER',
        };
        const mappedSelectedCategories = selectedCategories.map(
          (c) => categoryMapping[c] || c,
        );

        const matchesCategory =
          mappedSelectedCategories.length === 0 ||
          mappedSelectedCategories.includes(report.category);

        const matchesLocation =
          report.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
          report.province.toLowerCase().includes(locationFilter.toLowerCase());

        const reportDate = new Date(report.incidentDate).getTime();
        const start = startDate ? new Date(startDate).getTime() : -Infinity;
        const end = endDate ? new Date(endDate).getTime() : Infinity;
        const matchesDate = reportDate >= start && reportDate <= end;

        return (
          matchesSearch && matchesCategory && matchesLocation && matchesDate
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest')
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [
    reports,
    searchQuery,
    selectedCategories,
    locationFilter,
    startDate,
    endDate,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-[#F7F3ED]">
      <PublicHeader />

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 text-left">
          <div>
            <h1 className="text-5xl md:text-6xl font-black uppercase text-[#193C1F] tracking-tighter leading-none mb-4">
              Public Reports
            </h1>
            <p className="text-[#8EA087] text-lg font-medium">
              Community safety and insights.
            </p>
          </div>
          <Link href="/report">
            <Button className="bg-[#193C1F] hover:bg-[#8EA087] text-white rounded-2xl px-8 py-4 font-bold shadow-lg uppercase tracking-widest text-sm">
              Create Report
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-10 relative w-full group">
          <span className="absolute left-6 top-1/2 -translate-y-1/2">
            <Search
              size={22}
              className="text-[#8EA087] group-focus-within:text-[#193C1F]"
            />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full h-[64px] bg-white border border-[#D0D5CB] focus:border-[#193C1F] rounded-[24px] pl-16 pr-8 outline-none text-[#193C1F] shadow-sm transition-all"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 mt-10">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-[#D0D5CB] shadow-sm sticky top-8 text-left">
              <div className="flex justify-between items-center mb-10">
                <h2 className="font-black uppercase text-sm tracking-widest flex items-center gap-2 text-[#193C1F]">
                  <Filter size={18} /> Filters
                </h2>
                <button
                  onClick={resetFilters}
                  className="text-[10px] text-[#8EA087] font-black uppercase flex items-center gap-1 hover:text-red-500"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              {/* Sort By */}
              <div className="mb-10">
                <p className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest mb-4">
                  Sort By
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#F7F3ED] rounded-xl px-4 py-3 text-sm font-bold text-[#193C1F] outline-none cursor-pointer"
                >
                  <option value="newest">Most Recent</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>

              {/* VISUAL CHECKBOXES CATEGORY */}
              <div className="space-y-4 mb-10">
                <p className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest">
                  Category
                </p>
                <div className="flex flex-col gap-3">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      {/* Custom Visual Checkbox */}
                      <div
                        className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                        ${
                          selectedCategories.includes(cat)
                            ? 'bg-[#193C1F] border-[#193C1F]'
                            : 'bg-transparent border-[#D0D5CB] group-hover:border-[#8EA087]'
                        }
                      `}
                      >
                        {selectedCategories.includes(cat) && (
                          <Check size={14} className="text-white stroke-[4]" />
                        )}
                      </div>

                      <span
                        className={`text-sm font-bold transition-colors ${selectedCategories.includes(cat) ? 'text-[#193C1F]' : 'text-[#193C1F]/60 group-hover:text-[#8EA087]'}`}
                      >
                        {cat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-10">
                <p className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest mb-4">
                  Location
                </p>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8EA087]"
                  />
                  <input
                    placeholder="City or province..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full bg-[#F7F3ED] rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none border-transparent focus:border-[#8EA087]"
                  />
                </div>
              </div>

              {/* Date Filter */}
              <div className="space-y-3">
                <p className="text-[11px] font-black text-[#8EA087] uppercase tracking-widest">
                  Date Range
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#8EA087] uppercase px-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#F7F3ED] rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  />
                  <label className="text-[10px] font-bold text-[#8EA087] uppercase px-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#F7F3ED] rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Grid Content */}
          <div className="flex-1">
            <div className="mb-6 px-4 text-left">
              <p className="text-sm font-bold text-[#193C1F]">
                Showing{' '}
                <span className="text-[#8EA087]">{filteredReports.length}</span>{' '}
                Results
              </p>
            </div>

            {isLoading ? (
              <div className="py-20 text-center bg-white rounded-[40px] border border-[#D0D5CB]">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#193C1F]"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-[#D0D5CB]">
                <p className="text-[#8EA087] italic">No reports found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {filteredReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/publicreports/${report.id}`}
                    className="group"
                  >
                    <div className="bg-white rounded-[48px] border border-[#D0D5CB] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full text-left">
                      <div className="h-56 relative overflow-hidden bg-[#EBE6DE]">
                        {report.coverImageUrl && (
                          <Image
                            src={report.coverImageUrl}
                            alt="Cover"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        )}
                        <div className="absolute top-6 left-6 z-10">
                          <span className="text-[10px] font-black uppercase text-[#193C1F] bg-white/90 px-4 py-2 rounded-full shadow-sm">
                            CASE #{report.id.toString().slice(-5).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="p-10 flex flex-col flex-1">
                        <span className="text-[10px] font-black text-[#8EA087] uppercase tracking-widest mb-4">
                          {report.category}
                        </span>
                        <h3 className="font-black text-2xl text-[#193C1F] mb-4 group-hover:text-[#8EA087] transition-colors leading-tight italic">
                          {report.title}
                        </h3>
                        <p className="text-sm text-[#193C1F]/60 font-medium leading-relaxed mb-10 line-clamp-3">
                          {report.description}
                        </p>

                        <div className="flex justify-between items-center pt-8 border-t border-[#F7F3ED] mt-auto">
                          <span className="text-[10px] font-black text-[#193C1F] uppercase flex items-center gap-2">
                            <MapPin size={14} className="text-[#8EA087]" />{' '}
                            {report.city}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-[#193C1F] group-hover:translate-x-2 transition-transform">
                            View Details <ArrowRight size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicReportsPage;
