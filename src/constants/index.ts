// src/constants/index.ts

// --- 1. USER PROFILE DATA (DATA BARU) ---
export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phoneNumber: string;
  avatarUrl: string;
  password: string; // Optional, hanya untuk simulasi login
}

export const INITIAL_PROFILE_DATA: UserProfile = {
  userId: 'CC-88219',
  username: 'sarahjenkins',
  email: 'sarah.j@email.com',
  displayName: 'Sarah',
  bio: 'Passionate about community health and mental wellness.',
  birthDate: '1998-05-12',
  gender: 'female',
  phoneNumber: '081234567890',
  avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
  password: 'password123', // Hanya untuk simulasi, jangan simpan password asli di frontend
};

// --- 2. CONSULTATION DATA ---
export const RECENT_CONSULTATIONS = [
  {
    id: 1,
    dr: 'Dr. Robert Chen',
    spec: 'General Practitioner',
    date: 'Oct 12, 2023',
    time: '02:00 PM',
    status: 'COMPLETED',
  },
  {
    id: 2,
    dr: 'Dr. Sarah Meyer',
    spec: 'Psychologist',
    date: 'Oct 15, 2023',
    time: '10:00 AM',
    status: 'UPCOMING',
  },
  {
    id: 3,
    dr: 'Dr. Linda James',
    spec: 'Therapist',
    date: 'Sep 28, 2023',
    time: '09:00 AM',
    status: 'COMPLETED',
  },
  {
    id: 4,
    dr: 'Dr. Michael Vogt',
    spec: 'Psychiatrist',
    date: 'Sep 20, 2023',
    time: '11:30 AM',
    status: 'COMPLETED',
  },
  {
    id: 5,
    dr: 'Dr. Emily Watson',
    spec: 'Counselor',
    date: 'Sep 15, 2023',
    time: '01:00 PM',
    status: 'COMPLETED',
  },
  {
    id: 6,
    dr: 'Dr. Robert Chen',
    spec: 'General Practitioner',
    date: 'Sep 05, 2023',
    time: '03:00 PM',
    status: 'COMPLETED',
  },
  {
    id: 7,
    dr: 'Dr. Sarah Meyer',
    spec: 'Psychologist',
    date: 'Aug 28, 2023',
    time: '10:00 AM',
    status: 'COMPLETED',
  },
  {
    id: 8,
    dr: 'Dr. Linda James',
    spec: 'Therapist',
    date: 'Aug 20, 2023',
    time: '09:00 AM',
    status: 'COMPLETED',
  },
  {
    id: 9,
    dr: 'Dr. Alan Smith',
    spec: 'Neurologist',
    date: 'Aug 12, 2023',
    time: '04:00 PM',
    status: 'COMPLETED',
  },
  {
    id: 10,
    dr: 'Dr. Sarah Meyer',
    spec: 'Psychologist',
    date: 'Aug 05, 2023',
    time: '10:00 AM',
    status: 'COMPLETED',
  },
];

// --- 3. REPORT DATA ---
export const REPORT_STATUS = [
  {
    id: '#REP-8821',
    type: 'Incident Recovery',
    status: 'PENDING REVIEW',
    date: 'Oct 12, 2023',
  },
  {
    id: '#REP-8790',
    type: 'Legal Aid Request',
    status: 'APPROVED',
    date: 'Oct 10, 2023',
  },
  {
    id: '#REP-8655',
    type: 'Therapy Feedback',
    status: 'APPROVED',
    date: 'Oct 05, 2023',
  },
  {
    id: '#REP-8540',
    type: 'Medical Reimbursement',
    status: 'APPROVED',
    date: 'Sep 30, 2023',
  },
  {
    id: '#REP-8432',
    type: 'Security Incident',
    status: 'REJECTED',
    date: 'Sep 25, 2023',
  },
  {
    id: '#REP-8321',
    type: 'Incident Recovery',
    status: 'APPROVED',
    date: 'Sep 18, 2023',
  },
  {
    id: '#REP-8210',
    type: 'Counseling Request',
    status: 'APPROVED',
    date: 'Sep 12, 2023',
  },
  {
    id: '#REP-8105',
    type: 'Legal Aid Request',
    status: 'APPROVED',
    date: 'Sep 05, 2023',
  },
  {
    id: '#REP-7990',
    type: 'Emergency Support',
    status: 'APPROVED',
    date: 'Aug 28, 2023',
  },
  {
    id: '#REP-7885',
    type: 'General Feedback',
    status: 'APPROVED',
    date: 'Aug 20, 2023',
  },
];

// --- 4. DONATION DATA ---
export const DONATION_HISTORY = [
  {
    name: 'Anonymous Donor',
    date: 'Oct 12, 2023',
    amount: '+Rp 5.000.000',
    via: 'Community Pool',
  },
  {
    name: 'NGO Support Fund',
    date: 'Oct 01, 2023',
    amount: '+Rp 12.500.000',
    via: 'Medical Aid Grant',
  },
  {
    name: 'CareConnect Grant',
    date: 'Sep 15, 2023',
    amount: '+Rp 7.500.000',
    via: 'Monthly Support',
  },
  {
    name: 'HealthCare Foundation',
    date: 'Aug 22, 2023',
    amount: '+Rp 10.000.000',
    via: 'Recovery Fund',
  },
  {
    name: 'Global Relief',
    date: 'Aug 10, 2023',
    amount: '+Rp 3.000.000',
    via: 'Social Aid',
  },
  {
    name: 'Community Support',
    date: 'Aug 01, 2023',
    amount: '+Rp 1.500.000',
    via: 'Direct Gift',
  },
];
