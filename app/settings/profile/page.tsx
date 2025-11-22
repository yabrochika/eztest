'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main profile page
    router.push('/profile');
  }, [router]);

  return null;
}
