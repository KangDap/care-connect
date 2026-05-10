'use client';

import { PublicHeader } from '@/components/public-header';
import { ArrowLeft, Calendar, MapPin, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ReportDetail = {
  id: number;
  title: string;
  category: string;
  province: string;
  city: string;
  district: string;
  status: string;
  incidentDate: string;
  description: string;
  evidences: {
    id: number;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
  }[];
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  REVIEWED: 'bg-blue-100 text-blue-700 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-600 border-red-200',
};

const CATEGORY_LABEL: Record<string, string> = {
  PHYSICAL: 'Physical Abuse',
  SEXUAL: 'Sexual Abuse',
  PSYCHOLOGICAL: 'Psychological Abuse',
  OTHER: 'Other',
};

export default function PublicReportDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/report/${params.id}`)
      .then((r) => r.json())
      .then((result) => {
        if (result?.success && result?.data) {
          setReport(result.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f3ed] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#193c1f] mb-4" />
          <p className="text-[#8ea087] font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#f7f3ed] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">
            Report not found or unavailable.
          </p>
          <Link
            href="/publicreports"
            className="text-[#8ea087] font-bold hover:underline"
          >
            ← Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = report.evidences.find((e) =>
    e.mimeType.startsWith('image/'),
  );
  const images = report.evidences.filter((e) =>
    e.mimeType.startsWith('image/'),
  );
  const docs = report.evidences.filter((e) => !e.mimeType.startsWith('image/'));

  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(d));

  const fmtSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          href="/publicreports"
          className="inline-flex items-center gap-2 text-[#8ea087] hover:text-[#193c1f] font-bold text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Public Reports
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image */}
            {coverImage && (
              <div
                className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(coverImage.fileUrl)}
              >
                <Image
                  src={coverImage.fileUrl}
                  alt={report.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 70vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#193c1f]/60 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-widest text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                  ID: {String(report.id).padStart(5, '0')}
                </span>
              </div>
            )}

            {!coverImage && (
              <div className="w-full h-40 rounded-3xl bg-gradient-to-br from-[#EBE6DE] to-[#d0d5cb] flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8ea087] bg-white px-4 py-2 rounded-xl border border-[#d0d5cb]">
                  ID: {String(report.id).padStart(5, '0')} · No Image
                </span>
              </div>
            )}

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${STATUS_BADGE[report.status] || 'bg-gray-100 text-gray-600'}`}
              >
                {report.status}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#f7f3ed] border border-[#d0d5cb] text-[#193c1f] flex items-center gap-1">
                <Tag size={10} />
                {CATEGORY_LABEL[report.category] || report.category}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#f7f3ed] border border-[#d0d5cb] text-[#8ea087] flex items-center gap-1">
                <Calendar size={10} />
                {fmtDate(report.incidentDate)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#f7f3ed] border border-[#d0d5cb] text-[#8ea087] flex items-center gap-1">
                <MapPin size={10} />
                {report.city}, {report.province}
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#193c1f] italic tracking-tight leading-tight mb-4">
                {report.title}
              </h1>
              <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#8ea087] mb-3">
                  Incident Description
                </h3>
                <p className="text-[#193c1f]/80 leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            </div>

            {/* Image Gallery */}
            {images.length > 1 && (
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#8ea087] mb-3">
                  Evidence ({images.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-28 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-[#d0d5cb]"
                      onClick={() => setSelectedImage(img.fileUrl)}
                    >
                      <Image
                        src={img.fileUrl}
                        alt={img.fileName}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {docs.length > 0 && (
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#8ea087] mb-3">
                  Documents
                </h3>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white border border-[#d0d5cb] rounded-xl p-3 hover:border-[#193c1f] transition-colors"
                    >
                      <div className="w-8 h-8 bg-[#f7f3ed] rounded-lg flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-[#8ea087]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#193c1f] truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] text-[#8ea087]">
                          {fmtSize(doc.fileSize)}
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-[#8ea087] shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className="space-y-6">
            {/* Location Card */}
            <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#8ea087] mb-4">
                Location
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#193c1f]">
                  <MapPin size={14} className="text-[#8ea087]" />
                  <p className="font-bold">{report.city}</p>
                </div>
                <p className="text-sm text-[#193c1f]/70 ml-5">
                  {report.district}, {report.province}
                </p>
              </div>
            </div>

            {/* Donate CTA */}
            {report.status !== 'REJECTED' && (
              <div className="bg-[#193c1f] rounded-2xl p-6 text-white">
                <h3 className="font-black text-lg mb-2">Support This Case</h3>
                <p className="text-[#8ea087] text-sm mb-4 leading-relaxed">
                  Your donation goes directly to supporting the victim of this
                  reported case.
                </p>
                <button
                  onClick={() => router.push(`/donation/report/${report.id}`)}
                  className="w-full bg-[#8ea087] hover:bg-[#8ea087]/80 text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Donate Now
                </button>
                <p className="text-center text-[10px] text-[#8ea087] mt-2">
                  0% transaction fee
                </p>
              </div>
            )}

            {/* Report Info */}
            <div className="bg-white border border-[#d0d5cb] rounded-2xl p-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#8ea087] mb-4">
                Report Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8ea087]">Report ID</span>
                  <span className="font-bold text-[#193c1f]">
                    #{String(report.id).padStart(5, '0')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8ea087]">Status</span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[report.status]}`}
                  >
                    {report.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8ea087]">Category</span>
                  <span className="font-bold text-[#193c1f] text-right max-w-[60%]">
                    {CATEGORY_LABEL[report.category] || report.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8ea087]">Incident Date</span>
                  <span className="font-bold text-[#193c1f]">
                    {fmtDate(report.incidentDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8ea087]">Evidence</span>
                  <span className="font-bold text-[#193c1f]">
                    {report.evidences.length} file(s)
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              className="absolute -top-10 right-0 text-white font-bold hover:opacity-70 transition-opacity"
              onClick={() => setSelectedImage(null)}
            >
              ✕ Close
            </button>
            <div className="relative w-full h-[80vh] rounded-2xl overflow-hidden">
              <Image
                src={selectedImage}
                alt="Evidence"
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
