export const dynamic = 'force-dynamic';
import MainDashboardClient from '@/components/MainDashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | R.mix',
  description: 'View creator profiles, reels, photos, videos, and stats on R.mix.',
  alternates: {
    canonical: 'https://r-mix.vercel.app/profile',
  },
};

export default function ProfilePage() {
  return <MainDashboardClient initialViewMode="profile" />;
}
