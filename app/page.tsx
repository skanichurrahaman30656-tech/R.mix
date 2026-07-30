export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import MainDashboardClient from '@/components/MainDashboardClient';

export default function Home() {
  return <MainDashboardClient />;
}
