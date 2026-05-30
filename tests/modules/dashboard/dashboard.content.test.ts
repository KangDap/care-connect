import { describe, expect, it } from 'vitest';

type ReportItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  province: string;
  city: string;
  district: string;
  incidentDate: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
  evidences: { id: number; fileName: string; fileUrl: string }[];
  user?: { name?: string; email?: string };
  donationTotal?: number;
};

type ConsultationItem = {
  id: number;
  title: string;
  category: string;
  description?: string;
  date: Date | string;
  time?: Date | string;
  status: string;
  isAnonymous: boolean;
  user?: { name?: string; email?: string } | null;
  psychologist?: { name?: string | null } | null;
};

type DonationItem = {
  id: number;
  reportId: number | null;
  userName: string;
  amount: number;
  message: string;
  paymentStatus: string;
  createdAt: string;
  report: {
    title: string;
    description: string;
  } | null;
};

type PsychologistBreakdown = {
  id: string;
  name: string;
  sessions: number;
  earnings: number;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatDateLabel = (value: Date | string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const formatPaymentMethod = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getReportStatusLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const normalizeDonationStatus = (status: string) => {
  const s = (status || '').toUpperCase();

  if (s === 'EXPIRED' || s === 'CANCELLED' || s === 'FAILED') {
    return 'FAILED';
  }

  return s;
};

const getDonationDisplayStatus = (
  status: string,
): 'PENDING' | 'PAID' | 'CANCELED' => {
  const s = status.toUpperCase();

  if (s === 'PAID') return 'PAID';
  if (s === 'PENDING') return 'PENDING';

  return 'CANCELED';
};

const mapTransactionStatusToNotice = (status: string | null) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  if (normalized === 'pending') return 'pending';
  if (normalized === 'settlement' || normalized === 'capture') return 'success';
  if (normalized === 'deny' || normalized === 'failure') return 'failed';

  return null;
};

const mapDonationStatusToNotice = (status: string | undefined) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  if (normalized === 'PAID') return 'success';
  if (normalized === 'PENDING') return 'pending';
  if (normalized === 'FAILED') return 'failed';

  return null;
};

const getReportBadgeClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-[#d1b698]/30 text-[#d1b698]';
    case 'REVIEWED':
      return 'bg-blue-100 text-blue-700';
    case 'RESOLVED':
      return 'bg-green-100 text-green-700';
    case 'REJECTED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-[#EBE6DE] text-[#193c1f]';
  }
};

const getConsultationBadgeClass = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-[#d1b698]/20 text-[#d1b698]';
    case 'ONGOING':
      return 'bg-blue-100 text-blue-700';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-[#EBE6DE] text-[#193c1f]';
  }
};

const filterUserReports = (reports: ReportItem[], query: string) => {
  const q = query.trim().toLowerCase();

  if (!q) return reports;

  return reports.filter(
    (item) =>
      String(item.id).toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q),
  );
};

const filterAdminReports = (reports: ReportItem[], query: string) => {
  const q = query.trim().toLowerCase();

  if (!q) return reports;

  return reports.filter((report) =>
    [
      report.title,
      report.description,
      report.status,
      report.category,
      report.city,
      report.province,
      report.user?.name,
      report.user?.email,
      String(report.id),
    ].some((value) => (value ?? '').toLowerCase().includes(q)),
  );
};

const filterUserConsultations = (
  consultations: ConsultationItem[],
  query: string,
) => {
  const q = query.trim().toLowerCase();

  const filtered = consultations.filter(
    (item) =>
      (item.psychologist?.name ?? '').toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q),
  );

  return [...filtered].sort((a, b) => {
    const priority: Record<string, number> = {
      ONGOING: 0,
      SCHEDULED: 1,
      COMPLETED: 2,
      CANCELLED: 3,
    };

    const priorityDiff =
      (priority[String(a.status)] ?? 99) - (priority[String(b.status)] ?? 99);

    if (priorityDiff !== 0) return priorityDiff;

    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    const timeA = new Date(a.time ?? a.date);
    const timeB = new Date(b.time ?? b.date);

    const combinedA = new Date(
      dateA.getUTCFullYear(),
      dateA.getUTCMonth(),
      dateA.getUTCDate(),
      timeA.getUTCHours(),
      timeA.getUTCMinutes(),
    ).getTime();

    const combinedB = new Date(
      dateB.getUTCFullYear(),
      dateB.getUTCMonth(),
      dateB.getUTCDate(),
      timeB.getUTCHours(),
      timeB.getUTCMinutes(),
    ).getTime();

    return combinedB - combinedA;
  });
};

const filterAdminConsultations = (
  consultations: ConsultationItem[],
  query: string,
) => {
  const q = query.trim().toLowerCase();

  if (!q) return consultations;

  return consultations.filter((consultation) =>
    [
      consultation.title,
      consultation.category,
      consultation.status,
      consultation.description,
      consultation.user?.name,
      consultation.user?.email,
      consultation.psychologist?.name,
      String(consultation.id),
    ].some((value) => (value ?? '').toLowerCase().includes(q)),
  );
};

const filterAdminDonations = (donations: DonationItem[], query: string) => {
  const q = query.trim().toLowerCase();

  if (!q) return donations;

  return donations.filter((donation) =>
    [
      donation.userName,
      normalizeDonationStatus(donation.paymentStatus),
      donation.message,
      donation.report?.title,
      donation.report?.description,
      String(donation.id),
      String(donation.amount),
    ].some((value) => (value ?? '').toLowerCase().includes(q)),
  );
};

const filterPsychologistBreakdown = (
  psychologists: PsychologistBreakdown[],
  query: string,
) => {
  const q = query.trim().toLowerCase();

  if (!q) return psychologists;

  return psychologists.filter((psychologist) =>
    [
      psychologist.name,
      String(psychologist.sessions),
      String(psychologist.earnings),
      psychologist.id,
    ].some((value) => value.toLowerCase().includes(q)),
  );
};

const paginate = <T>(items: T[], currentPage: number, itemsPerPage: number) => {
  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;

  return items.slice(firstIndex, lastIndex);
};

const getTotalPages = (itemCount: number, itemsPerPage: number) =>
  Math.ceil(itemCount / itemsPerPage);

const buildReportsHref = (
  currentParams: string,
  status: string,
  pageValue?: number,
) => {
  const params = new URLSearchParams(currentParams);

  params.set('status', status);

  if (pageValue && pageValue > 1) {
    params.set('page', String(pageValue));
  } else {
    params.delete('page');
  }

  const queryString = params.toString();

  return `/dashboard/admin/reports${queryString ? `?${queryString}` : ''}`;
};

const buildConsultationsHref = (
  currentParams: string,
  tabValue: string,
  pageValue?: number,
) => {
  const params = new URLSearchParams(currentParams);

  params.set('tab', tabValue);

  if (pageValue && pageValue > 1) {
    params.set('page', String(pageValue));
  } else {
    params.delete('page');
  }

  const queryString = params.toString();

  return `/dashboard/admin/consultations${queryString ? `?${queryString}` : ''}`;
};

const buildDonationHref = (
  currentParams: string,
  currentMonth: number,
  currentYear: number,
  currentStatus: string,
  updates: {
    month?: number;
    year?: number;
    status?: string;
    page?: number;
  },
) => {
  const params = new URLSearchParams(currentParams);

  params.set('month', String(updates.month ?? currentMonth));
  params.set('year', String(updates.year ?? currentYear));
  params.set('status', updates.status ?? currentStatus);

  if (updates.page && updates.page > 1) {
    params.set('page', String(updates.page));
  } else {
    params.delete('page');
  }

  return `/dashboard/admin/donations?${params.toString()}`;
};

const reports: ReportItem[] = [
  {
    id: 1,
    title: 'Laporan Kekerasan Verbal',
    category: 'PSYCHOLOGICAL',
    description: 'Deskripsi laporan pertama',
    province: 'Jawa Barat',
    city: 'Bandung',
    district: 'Coblong',
    incidentDate: '2026-01-01',
    status: 'PENDING',
    isAnonymous: false,
    createdAt: '2026-01-02',
    evidences: [],
    user: {
      name: 'Niki',
      email: 'niki@mail.com',
    },
    donationTotal: 50000,
  },
  {
    id: 2,
    title: 'Laporan Kekerasan Fisik',
    category: 'PHYSICAL',
    description: 'Deskripsi laporan kedua',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    district: 'Kebayoran',
    incidentDate: '2026-02-01',
    status: 'RESOLVED',
    isAnonymous: true,
    createdAt: '2026-02-02',
    evidences: [
      {
        id: 1,
        fileName: 'bukti.png',
        fileUrl: 'https://example.com/bukti.png',
      },
    ],
    user: {
      name: 'Alya',
      email: 'alya@mail.com',
    },
    donationTotal: 100000,
  },
];

const consultations: ConsultationItem[] = [
  {
    id: 1,
    title: 'Konsultasi Pertama',
    category: 'Trauma',
    description: 'Deskripsi konsultasi pertama',
    date: new Date('2026-01-01T00:00:00.000Z'),
    time: new Date('1970-01-01T09:00:00.000Z'),
    status: 'COMPLETED',
    isAnonymous: false,
    user: {
      name: 'Niki',
      email: 'niki@mail.com',
    },
    psychologist: {
      name: 'Dr. Aman',
    },
  },
  {
    id: 2,
    title: 'Konsultasi Kedua',
    category: 'Anxiety',
    description: 'Deskripsi konsultasi kedua',
    date: new Date('2026-01-02T00:00:00.000Z'),
    time: new Date('1970-01-01T10:00:00.000Z'),
    status: 'ONGOING',
    isAnonymous: true,
    user: {
      name: 'Alya',
      email: 'alya@mail.com',
    },
    psychologist: {
      name: 'Dr. Bima',
    },
  },
  {
    id: 3,
    title: 'Konsultasi Ketiga',
    category: 'Stress',
    description: 'Deskripsi konsultasi ketiga',
    date: new Date('2026-01-03T00:00:00.000Z'),
    time: new Date('1970-01-01T11:00:00.000Z'),
    status: 'SCHEDULED',
    isAnonymous: false,
    user: {
      name: 'Citra',
      email: 'citra@mail.com',
    },
    psychologist: {
      name: 'Dr. Aman',
    },
  },
];

const donations: DonationItem[] = [
  {
    id: 1,
    reportId: 1,
    userName: 'Niki',
    amount: 50000,
    message: 'Semoga membantu',
    paymentStatus: 'PAID',
    createdAt: '2026-01-01',
    report: {
      title: 'Laporan Kekerasan Verbal',
      description: 'Deskripsi report',
    },
  },
  {
    id: 2,
    reportId: 2,
    userName: 'Alya',
    amount: 75000,
    message: 'Donasi pending',
    paymentStatus: 'PENDING',
    createdAt: '2026-01-02',
    report: {
      title: 'Laporan Kekerasan Fisik',
      description: 'Deskripsi report fisik',
    },
  },
  {
    id: 3,
    reportId: null,
    userName: 'Budi',
    amount: 100000,
    message: 'Platform donation',
    paymentStatus: 'FAILED',
    createdAt: '2026-01-03',
    report: null,
  },
];

const psychologistBreakdown: PsychologistBreakdown[] = [
  {
    id: 'psy-1',
    name: 'Dr. Aman',
    sessions: 3,
    earnings: 270000,
  },
  {
    id: 'psy-2',
    name: 'Dr. Bima',
    sessions: 1,
    earnings: 90000,
  },
];

describe('Dashboard logic - formatter utilities', () => {
  it('formats rupiah with Indonesian currency format', () => {
    expect(formatRupiah(50000)).toContain('50.000');
  });

  it('formats zero rupiah correctly', () => {
    expect(formatRupiah(0)).toContain('0');
  });

  it('formats large rupiah correctly', () => {
    expect(formatRupiah(1500000)).toContain('1.500.000');
  });

  it('formats date label in Indonesian format', () => {
    expect(formatDateLabel('2026-01-01')).toContain('2026');
  });

  it('formats BANK_TRANSFER payment method', () => {
    expect(formatPaymentMethod('BANK_TRANSFER')).toBe('Bank Transfer');
  });

  it('formats CREDIT_CARD payment method', () => {
    expect(formatPaymentMethod('CREDIT_CARD')).toBe('Credit Card');
  });

  it('formats EWALLET payment method', () => {
    expect(formatPaymentMethod('EWALLET')).toBe('Ewallet');
  });

  it('formats report status label from snake case', () => {
    expect(getReportStatusLabel('IN_REVIEW')).toBe('In Review');
  });
});

describe('Dashboard logic - report status and badge mapping', () => {
  it('returns pending report badge class', () => {
    expect(getReportBadgeClass('PENDING')).toContain('text-[#d1b698]');
  });

  it('returns reviewed report badge class', () => {
    expect(getReportBadgeClass('REVIEWED')).toContain('blue');
  });

  it('returns resolved report badge class', () => {
    expect(getReportBadgeClass('RESOLVED')).toContain('green');
  });

  it('returns rejected report badge class', () => {
    expect(getReportBadgeClass('REJECTED')).toContain('red');
  });

  it('returns default report badge class for unknown status', () => {
    expect(getReportBadgeClass('UNKNOWN')).toContain('text-[#193c1f]');
  });
});

describe('Dashboard logic - consultation status and badge mapping', () => {
  it('returns scheduled consultation badge class', () => {
    expect(getConsultationBadgeClass('SCHEDULED')).toContain('text-[#d1b698]');
  });

  it('returns ongoing consultation badge class', () => {
    expect(getConsultationBadgeClass('ONGOING')).toContain('blue');
  });

  it('returns completed consultation badge class', () => {
    expect(getConsultationBadgeClass('COMPLETED')).toContain('green');
  });

  it('returns cancelled consultation badge class', () => {
    expect(getConsultationBadgeClass('CANCELLED')).toContain('red');
  });

  it('returns default consultation badge class for unknown status', () => {
    expect(getConsultationBadgeClass('UNKNOWN')).toContain('text-[#193c1f]');
  });
});

describe('Dashboard logic - donation status mapping', () => {
  it('normalizes PAID as PAID', () => {
    expect(normalizeDonationStatus('PAID')).toBe('PAID');
  });

  it('normalizes EXPIRED as FAILED', () => {
    expect(normalizeDonationStatus('EXPIRED')).toBe('FAILED');
  });

  it('normalizes CANCELLED as FAILED', () => {
    expect(normalizeDonationStatus('CANCELLED')).toBe('FAILED');
  });

  it('normalizes FAILED as FAILED', () => {
    expect(normalizeDonationStatus('FAILED')).toBe('FAILED');
  });

  it('maps paid display status', () => {
    expect(getDonationDisplayStatus('PAID')).toBe('PAID');
  });

  it('maps pending display status', () => {
    expect(getDonationDisplayStatus('PENDING')).toBe('PENDING');
  });

  it('maps failed display status to canceled label group', () => {
    expect(getDonationDisplayStatus('FAILED')).toBe('CANCELED');
  });
});

describe('Dashboard logic - payment notice mapping', () => {
  it('maps pending transaction to pending notice', () => {
    expect(mapTransactionStatusToNotice('pending')).toBe('pending');
  });

  it('maps settlement transaction to success notice', () => {
    expect(mapTransactionStatusToNotice('settlement')).toBe('success');
  });

  it('maps capture transaction to success notice', () => {
    expect(mapTransactionStatusToNotice('capture')).toBe('success');
  });

  it('maps deny transaction to failed notice', () => {
    expect(mapTransactionStatusToNotice('deny')).toBe('failed');
  });

  it('maps failure transaction to failed notice', () => {
    expect(mapTransactionStatusToNotice('failure')).toBe('failed');
  });

  it('maps unknown transaction to null notice', () => {
    expect(mapTransactionStatusToNotice('unknown')).toBeNull();
  });

  it('maps paid donation status to success notice', () => {
    expect(mapDonationStatusToNotice('PAID')).toBe('success');
  });

  it('maps pending donation status to pending notice', () => {
    expect(mapDonationStatusToNotice('PENDING')).toBe('pending');
  });

  it('maps failed donation status to failed notice', () => {
    expect(mapDonationStatusToNotice('FAILED')).toBe('failed');
  });
});

describe('Dashboard logic - user reports filtering', () => {
  it('returns all reports when query is empty', () => {
    expect(filterUserReports(reports, '')).toHaveLength(2);
  });

  it('filters user reports by title', () => {
    expect(filterUserReports(reports, 'verbal')).toHaveLength(1);
  });

  it('filters user reports by status', () => {
    expect(filterUserReports(reports, 'resolved')).toHaveLength(1);
  });

  it('filters user reports by id', () => {
    expect(filterUserReports(reports, '2')[0].id).toBe(2);
  });

  it('returns empty array when user report query does not match', () => {
    expect(filterUserReports(reports, 'tidakada')).toHaveLength(0);
  });
});

describe('Dashboard logic - admin reports filtering', () => {
  it('returns all admin reports when query is empty', () => {
    expect(filterAdminReports(reports, '')).toHaveLength(2);
  });

  it('filters admin reports by user name', () => {
    expect(filterAdminReports(reports, 'alya')).toHaveLength(1);
  });

  it('filters admin reports by user email', () => {
    expect(filterAdminReports(reports, 'niki@mail')).toHaveLength(1);
  });

  it('filters admin reports by province', () => {
    expect(filterAdminReports(reports, 'jakarta')).toHaveLength(1);
  });

  it('filters admin reports by category', () => {
    expect(filterAdminReports(reports, 'physical')).toHaveLength(1);
  });
});

describe('Dashboard logic - consultations filtering and sorting', () => {
  it('filters user consultations by psychologist name', () => {
    expect(filterUserConsultations(consultations, 'bima')).toHaveLength(1);
  });

  it('filters user consultations by title', () => {
    expect(filterUserConsultations(consultations, 'ketiga')).toHaveLength(1);
  });

  it('filters user consultations by category', () => {
    expect(filterUserConsultations(consultations, 'stress')).toHaveLength(1);
  });

  it('filters user consultations by status', () => {
    expect(filterUserConsultations(consultations, 'ongoing')).toHaveLength(1);
  });

  it('sorts user consultations by status priority', () => {
    const result = filterUserConsultations(consultations, '');

    expect(result.map((item) => item.status)).toEqual([
      'ONGOING',
      'SCHEDULED',
      'COMPLETED',
    ]);
  });

  it('filters admin consultations by patient email', () => {
    expect(filterAdminConsultations(consultations, 'citra@mail')).toHaveLength(
      1,
    );
  });

  it('filters admin consultations by patient name', () => {
    expect(filterAdminConsultations(consultations, 'niki')).toHaveLength(1);
  });

  it('filters admin consultations by psychologist name', () => {
    expect(filterAdminConsultations(consultations, 'aman')).toHaveLength(2);
  });
});

describe('Dashboard logic - donation filtering', () => {
  it('returns all donations when query is empty', () => {
    expect(filterAdminDonations(donations, '')).toHaveLength(3);
  });

  it('filters donations by donor name', () => {
    expect(filterAdminDonations(donations, 'niki')).toHaveLength(1);
  });

  it('filters donations by normalized payment status', () => {
    expect(filterAdminDonations(donations, 'failed')).toHaveLength(1);
  });

  it('filters donations by report title', () => {
    expect(filterAdminDonations(donations, 'fisik')).toHaveLength(1);
  });

  it('filters donations by amount text', () => {
    expect(filterAdminDonations(donations, '100000')).toHaveLength(1);
  });

  it('handles platform donation with null report safely', () => {
    expect(filterAdminDonations(donations, 'platform')).toHaveLength(1);
  });
});

describe('Dashboard logic - psychologist breakdown filtering', () => {
  it('returns all psychologist rows when query is empty', () => {
    expect(filterPsychologistBreakdown(psychologistBreakdown, '')).toHaveLength(
      2,
    );
  });

  it('filters psychologist breakdown by name', () => {
    expect(
      filterPsychologistBreakdown(psychologistBreakdown, 'aman'),
    ).toHaveLength(1);
  });

  it('filters psychologist breakdown by session count', () => {
    expect(
      filterPsychologistBreakdown(psychologistBreakdown, '3'),
    ).toHaveLength(1);
  });

  it('filters psychologist breakdown by earnings', () => {
    expect(
      filterPsychologistBreakdown(psychologistBreakdown, '90000'),
    ).toHaveLength(1);
  });

  it('filters psychologist breakdown by id', () => {
    expect(
      filterPsychologistBreakdown(psychologistBreakdown, 'psy-2'),
    ).toHaveLength(1);
  });
});

describe('Dashboard logic - pagination', () => {
  it('calculates total pages correctly', () => {
    expect(getTotalPages(25, 10)).toBe(3);
  });

  it('returns page 1 items', () => {
    expect(paginate([1, 2, 3, 4, 5], 1, 2)).toEqual([1, 2]);
  });

  it('returns page 2 items', () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });

  it('returns last page items', () => {
    expect(paginate([1, 2, 3, 4, 5], 3, 2)).toEqual([5]);
  });

  it('returns empty array for page outside range', () => {
    expect(paginate([1, 2, 3], 5, 2)).toEqual([]);
  });
});

describe('Dashboard logic - href builders', () => {
  it('builds report href with status filter', () => {
    expect(buildReportsHref('', 'PENDING')).toBe(
      '/dashboard/admin/reports?status=PENDING',
    );
  });

  it('builds report href with page value', () => {
    expect(buildReportsHref('search=verbal', 'RESOLVED', 2)).toBe(
      '/dashboard/admin/reports?search=verbal&status=RESOLVED&page=2',
    );
  });

  it('removes report page value when page is 1', () => {
    expect(buildReportsHref('search=verbal&page=5', 'PENDING', 1)).toBe(
      '/dashboard/admin/reports?search=verbal&status=PENDING',
    );
  });

  it('builds consultation href with tab filter', () => {
    expect(buildConsultationsHref('', 'active')).toBe(
      '/dashboard/admin/consultations?tab=active',
    );
  });

  it('builds consultation href with page value', () => {
    expect(buildConsultationsHref('search=stress', 'history', 3)).toBe(
      '/dashboard/admin/consultations?search=stress&tab=history&page=3',
    );
  });

  it('builds donation href with default current filter', () => {
    expect(buildDonationHref('', 5, 2026, 'all', {})).toBe(
      '/dashboard/admin/donations?month=5&year=2026&status=all',
    );
  });

  it('builds donation href with status update', () => {
    expect(buildDonationHref('', 5, 2026, 'all', { status: 'paid' })).toBe(
      '/dashboard/admin/donations?month=5&year=2026&status=paid',
    );
  });

  it('builds donation href with month and year update', () => {
    expect(
      buildDonationHref('', 5, 2026, 'all', {
        month: 6,
        year: 2025,
      }),
    ).toBe('/dashboard/admin/donations?month=6&year=2025&status=all');
  });

  it('builds donation href with page value', () => {
    expect(buildDonationHref('search=niki', 5, 2026, 'paid', { page: 2 })).toBe(
      '/dashboard/admin/donations?search=niki&month=5&year=2026&status=paid&page=2',
    );
  });
});

describe('Dashboard logic - summary calculations', () => {
  it('calculates total donation amount', () => {
    const total = donations.reduce((sum, item) => sum + item.amount, 0);

    expect(total).toBe(225000);
  });

  it('calculates paid donation amount only', () => {
    const totalPaid = donations
      .filter((item) => normalizeDonationStatus(item.paymentStatus) === 'PAID')
      .reduce((sum, item) => sum + item.amount, 0);

    expect(totalPaid).toBe(50000);
  });

  it('calculates platform share as 10 percent', () => {
    const amount = 500000;
    const platformShare = amount * 0.1;

    expect(platformShare).toBe(50000);
  });

  it('calculates psychologist share as 90 percent', () => {
    const amount = 500000;
    const psychologistShare = amount * 0.9;

    expect(psychologistShare).toBe(450000);
  });

  it('counts active consultations', () => {
    const active = consultations.filter((item) =>
      ['SCHEDULED', 'ONGOING'].includes(item.status),
    );

    expect(active).toHaveLength(2);
  });

  it('counts consultation history', () => {
    const history = consultations.filter((item) =>
      ['COMPLETED', 'CANCELLED'].includes(item.status),
    );

    expect(history).toHaveLength(1);
  });
});
