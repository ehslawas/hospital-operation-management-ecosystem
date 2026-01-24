"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLandingPathForDepartment } from '@/lib/department';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const department = decodeURIComponent(
      document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || ''
    );
    
    if (department) {
      const dest = getLandingPathForDepartment(department);
      router.replace(dest);
    } else {
      router.replace('/login');
    }
  }, [router]);
  
  return null;
}
