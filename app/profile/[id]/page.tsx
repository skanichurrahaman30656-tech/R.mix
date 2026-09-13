import MainDashboardClient from '@/components/MainDashboardClient';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Creator Profile | R.mix`,
    description: 'View creator profile and posts on R.mix.',
    alternates: {
      canonical: `https://r-mix.vercel.app/profile/${id}`,
    },
  };
}

export default async function ProfileDetailPage({ params }: Props) {
  const { id } = await params;
  return <MainDashboardClient initialViewMode="profile" initialProfileUserId={id} />;
}
