// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Emergency department uses cookie-based auth, others use localStorage
    const checkAuth = () => {
      try {
        let authenticated;
        if (pathname.startsWith('/emergency')) {
          // Cookie-based auth for emergency department
          authenticated = document.cookie.includes('user=') && 
                         document.cookie.includes('department=');
        } else {
          // Existing localStorage check for other departments
          authenticated = localStorage.getItem('isAuthenticated') === 'true' && 
                         !!localStorage.getItem('user') && 
                         !!localStorage.getItem('department');
        }
        setIsAuthenticated(authenticated);
        
        // If not authenticated and not on a public route, redirect to login
        // Allow patient portal routes (patients have separate authentication)
        if (!authenticated && 
            !pathname.startsWith('/login') && 
            !pathname.startsWith('/dev/login') && 
            !pathname.startsWith('/patient-portal')) {
          router.push('/login');
          router.refresh(); // Force refresh to prevent cached content
        }
      } catch (error) {
        // localStorage not available, assume not authenticated
        setIsAuthenticated(false);
        if (!pathname.startsWith('/login') && 
            !pathname.startsWith('/dev/login') && 
            !pathname.startsWith('/patient-portal')) {
          router.push('/login');
          router.refresh();
        }
      }
    };

    checkAuth();

    // Re-check auth when page becomes visible (e.g., when user presses back button)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    // Re-check auth on focus (when user comes back to tab)
    const handleFocus = () => {
      checkAuth();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus); // For Safari back button

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
    };
  }, [mounted, pathname, router]);

  // If on login page or patient portal, render without AppShell
  if (pathname === '/login' || pathname === '/dev/login' || pathname.startsWith('/patient-portal')) {
    return <>{children}</>;
  }

  // Always show loading during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" suppressHydrationWarning></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" suppressHydrationWarning></div>
          <p className="mt-2 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading (redirect will happen)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" suppressHydrationWarning></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // For all other pages (NOT dispensing), render with AppShell
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
