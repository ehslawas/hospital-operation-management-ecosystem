"use client";
import { useEffect, useState, type ReactNode } from 'react';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}


