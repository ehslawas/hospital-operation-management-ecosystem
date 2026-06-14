'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  QrCode,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Loader2,
} from 'lucide-react';
import { getCurrentPatient } from '@/features/patient-portal/utils/auth';

export default function SharePage() {
  const router = useRouter();
  const [patient, setPatient] = useState(getCurrentPatient());

  useEffect(() => {
    if (!patient) {
      router.push('/patient-portal/login');
    }
  }, []);

  const language = patient?.portalLanguage || 'en';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/patient-portal/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {language === 'en' ? 'Back' : 'Kembali'}
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {language === 'en' ? 'Share Health Record' : 'Kongsi Rekod Kesihatan'}
              </h1>
              <p className="text-sm text-slate-600">
                {language === 'en' ? 'Generate QR code for healthcare professionals' : 'Jana QR code untuk profesional kesihatan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-none shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6">
              <QrCode className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {language === 'en' ? 'Coming Soon!' : 'Akan Datang!'}
            </h2>
            
            <p className="text-slate-600 mb-8">
              {language === 'en' 
                ? 'QR code sharing feature will be available in Phase 2. This will allow you to securely share your health information with doctors at other hospitals.'
                : 'Ciri perkongsian QR code akan tersedia dalam Fasa 2. Ini akan membolehkan anda berkongsi maklumat kesihatan anda dengan selamat kepada doktor di hospital lain.'}
            </p>

            <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold text-slate-900 mb-3">
                {language === 'en' ? 'What you can do now:' : 'Apa yang anda boleh lakukan sekarang:'}
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'View and print your health summary'
                      : 'Lihat dan cetak ringkasan kesihatan anda'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Show printed summary to doctors at other hospitals'
                      : 'Tunjukkan ringkasan yang dicetak kepada doktor di hospital lain'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Print medication list for reference'
                      : 'Cetak senarai ubat untuk rujukan'}
                  </span>
                </li>
              </ul>
            </div>

            <Link href="/patient-portal/health-summary">
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600">
                {language === 'en' ? 'View Health Summary' : 'Lihat Ringkasan Kesihatan'}
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

