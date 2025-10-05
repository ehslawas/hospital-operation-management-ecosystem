'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconArrowRight, IconArrowLeft, IconEye } from '@/components/ui/Icons';
import InterFacilityPage from '../page';

export default function ReviewQueuePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/40">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Pending Review</h1>
            <p className="text-slate-600 mt-1">Transfers and receives awaiting initial review</p>
          </div>
          <Link href="/borrowing" className="text-slate-600 hover:text-slate-800">Back</Link>
        </div>
      </div>
    </div>
  );
}


