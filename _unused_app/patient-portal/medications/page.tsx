'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart,
  Pill,
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Download,
  Printer,
} from 'lucide-react';
import { getCurrentPatient, formatDate, logPortalAccess } from '@/features/patient-portal/utils/auth';
import type { PatientHealthSummary } from '@/features/patient-portal/types/Patient';

export default function MedicationsPage() {
  const router = useRouter();
  const [patient, setPatient] = useState(getCurrentPatient());
  const [healthSummary, setHealthSummary] = useState<PatientHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient) {
      router.push('/patient-portal/login');
      return;
    }

    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await fetch(`/api/patient-portal/health-summary?patientId=${patient?.id}`);
      const data = await response.json();

      if (data.success) {
        setHealthSummary(data.data);
        await logPortalAccess(patient!.id, 'view_medications');
      }
    } catch (err) {
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading medications...</p>
        </div>
      </div>
    );
  }

  const language = patient?.portalLanguage || 'en';
  const medications = healthSummary?.currentMedications || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm print:shadow-none">
        <div className="container mx-auto px-4 py-4 print:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/patient-portal/dashboard" className="print:hidden">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {language === 'en' ? 'Back' : 'Kembali'}
                </Button>
              </Link>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {language === 'en' ? 'My Medications' : 'Ubat Saya'}
                </h1>
                <p className="text-sm text-slate-600">Hospital Lawas</p>
              </div>
            </div>
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 print:hidden">
              <Printer className="h-4 w-4" />
              {language === 'en' ? 'Print' : 'Cetak'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 print:py-4 max-w-5xl">
        {/* Patient Info - Print Header */}
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-300">
          <h2 className="text-xl font-bold text-slate-900">{patient?.name}</h2>
          <div className="text-sm text-slate-600 mt-1">
            IC: {patient?.nric} | MRN: {patient?.mrn}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Printed: {new Date().toLocaleString('en-MY')}
          </div>
        </div>

        {/* Allergies Warning */}
        {patient && patient.allergies.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    ⚠️ {language === 'en' ? 'DRUG ALLERGIES' : 'ALAHAN UBAT'}
                  </h3>
                  <div className="space-y-1">
                    {patient.allergies.map((allergy, idx) => (
                      <div key={idx} className="text-base font-semibold text-red-800">
                        • {allergy}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medications List */}
        <Card className="border-none shadow-lg print:shadow-none">
          <CardContent className="p-6 print:p-4">
            <div className="mb-6 print:mb-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 print:text-xl">
                {language === 'en' ? 'Current Medications' : 'Ubat Semasa'}
              </h2>
              <p className="text-slate-600 text-sm">
                {language === 'en' 
                  ? 'Complete list of medications you are currently taking'
                  : 'Senarai lengkap ubat yang anda ambil sekarang'}
              </p>
            </div>

            {medications.length === 0 ? (
              <div className="text-center py-12 print:py-6">
                <Pill className="h-16 w-16 text-slate-300 mx-auto mb-4 print:h-12 print:w-12" />
                <p className="text-slate-600">
                  {language === 'en' ? 'No current medications' : 'Tiada ubat semasa'}
                </p>
              </div>
            ) : (
              <div className="space-y-6 print:space-y-4">
                {medications.map((med, index) => (
                  <div 
                    key={med.id} 
                    className="p-6 print:p-4 bg-slate-50 print:bg-white rounded-xl border-2 border-slate-200 print:border print:border-slate-400 print:page-break-inside-avoid"
                  >
                    {/* Medication Header */}
                    <div className="flex items-start justify-between mb-4 print:mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl print:text-xl font-bold text-blue-600">
                            {index + 1}
                          </span>
                          <h3 className="text-xl print:text-lg font-bold text-slate-900">
                            {med.medicationName}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">
                          {med.genericName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg print:text-base font-bold text-slate-900">
                          {med.strength}
                        </span>
                      </div>
                    </div>

                    {/* Medication Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4 print:gap-2 mb-4 print:mb-2">
                      <div>
                        <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                          {language === 'en' ? 'Dosage' : 'Dos'}
                        </div>
                        <div className="text-base print:text-sm font-semibold text-slate-900">
                          📝 {med.dosage}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                          {language === 'en' ? 'Frequency' : 'Kekerapan'}
                        </div>
                        <div className="text-base print:text-sm font-semibold text-slate-900">
                          🕐 {med.frequency}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                          {language === 'en' ? 'Route' : 'Cara Pengambilan'}
                        </div>
                        <div className="text-base print:text-sm font-semibold text-slate-900">
                          {med.route}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                          {language === 'en' ? 'Form' : 'Bentuk'}
                        </div>
                        <div className="text-base print:text-sm font-semibold text-slate-900">
                          {med.form}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3 print:space-y-2">
                      <div>
                        <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                          {language === 'en' ? 'Indication' : 'Tujuan'}
                        </div>
                        <div className="text-sm print:text-xs text-slate-900">
                          🎯 {med.indication}
                        </div>
                      </div>

                      {med.specialInstructions && (
                        <div>
                          <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                            {language === 'en' ? 'Special Instructions' : 'Arahan Khas'}
                          </div>
                          <div className="text-sm print:text-xs text-slate-900 bg-yellow-50 print:bg-transparent p-3 print:p-1 rounded-lg">
                            ⚠️ {med.specialInstructions}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 print:gap-2 text-xs print:text-xs text-slate-600 pt-2 print:pt-1 border-t border-slate-200">
                        <div>
                          <span className="font-medium">
                            {language === 'en' ? 'Started:' : 'Mula:'}
                          </span>{' '}
                          {formatDate(new Date(med.startDate), language)}
                        </div>
                        <div>
                          <span className="font-medium">
                            {language === 'en' ? 'Prescribed by:' : 'Ditetapkan oleh:'}
                          </span>{' '}
                          {med.prescribedBy}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-8 print:mt-4 pt-6 print:pt-4 border-t-2 border-slate-200 print:border-slate-400">
              <div className="bg-blue-50 print:bg-transparent p-4 print:p-2 rounded-lg">
                <p className="text-sm print:text-xs text-slate-700 mb-2">
                  <strong>
                    {language === 'en' ? 'Important:' : 'Penting:'}
                  </strong>
                </p>
                <ul className="text-sm print:text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>
                    {language === 'en' 
                      ? 'Take medications exactly as prescribed'
                      : 'Ambil ubat seperti yang ditetapkan'}
                  </li>
                  <li>
                    {language === 'en'
                      ? 'Do not stop or change dosage without consulting your doctor'
                      : 'Jangan berhenti atau ubah dos tanpa rujuk doktor'}
                  </li>
                  <li>
                    {language === 'en'
                      ? 'Contact hospital if you experience any side effects'
                      : 'Hubungi hospital jika alami sebarang kesan sampingan'}
                  </li>
                </ul>
              </div>

              <div className="mt-4 print:mt-2 text-center text-xs print:text-xs text-slate-500">
                <p>Hospital Lawas | {language === 'en' ? 'Phone' : 'Telefon'}: 085-283781</p>
                <p className="mt-1">
                  {language === 'en' ? 'This is a computer-generated document' : 'Ini adalah dokumen yang dijana komputer'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

