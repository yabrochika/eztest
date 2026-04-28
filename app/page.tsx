import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/projects');
  } else {
    redirect('/auth/login');
  }
}
