'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Printer,
  Download,
  Heart,
  AlertTriangle,
  Pill,
  Activity,
  Droplet,
  Calendar,
  User,
  Phone,
  FileText,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { getCurrentPatient, formatDate, formatDateTime, calculateAge, logPortalAccess } from '@/features/patient-portal/utils/auth';
import type { PatientHealthSummary } from '@/features/patient-portal/types/Patient';

export default function HealthSummaryPage() {
  const router = useRouter();
  const [patient, setPatient] = useState(getCurrentPatient());
  const [healthSummary, setHealthSummary] = useState<PatientHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient) {
      router.push('/patient-portal/login');
      return;
    }

    fetchHealthSummary();
  }, []);

  const fetchHealthSummary = async () => {
    try {
      const response = await fetch(`/api/patient-portal/health-summary?patientId=${patient?.id}`);
      const data = await response.json();

      if (data.success) {
        setHealthSummary(data.data);
        await logPortalAccess(patient!.id, 'view_health_summary');
      }
    } catch (err) {
      console.error('Error fetching health summary:', err);
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
          <p className="text-slate-600">Loading health summary...</p>
        </div>
      </div>
    );
  }

  if (!healthSummary) {
    return null;
  }

  const { patient: patientInfo, chronicConditions, currentMedications, recentVitals, recentLabResults, lastVisit } = healthSummary;
  const language = patient?.portalLanguage || 'en';
  const age = calculateAge(new Date(patientInfo.dob));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 print:bg-white">
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
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {language === 'en' ? 'Health Summary' : 'Ringkasan Kesihatan'}
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
        {/* Document Header - Print Only */}
        <div className="hidden print:block mb-6 pb-4 border-b-4 border-blue-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">HEALTH SUMMARY</h1>
              <p className="text-sm text-slate-600">Hospital Lawas Patient Portal</p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div>Generated: {new Date().toLocaleString('en-MY')}</div>
              <div className="mt-1 font-semibold text-blue-600">For Healthcare Professional Use</div>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <Card className="border-2 border-blue-200 print:border-4 mb-6 print:mb-4">
          <CardContent className="p-6 print:p-4">
            <div className="flex items-center gap-3 mb-4 print:mb-2">
              <User className="h-6 w-6 text-blue-600 print:h-5 print:w-5" />
              <h2 className="text-xl print:text-lg font-bold text-slate-900">
                {language === 'en' ? 'PATIENT INFORMATION' : 'MAKLUMAT PESAKIT'}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 print:gap-3">
              <div>
                <div className="mb-3 print:mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Name' : 'Nama'}
                  </div>
                  <div className="text-lg print:text-base font-bold text-slate-900">{patientInfo.name}</div>
                </div>
                <div className="mb-3 print:mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    IC / NRIC
                  </div>
                  <div className="text-base print:text-sm font-semibold text-slate-900">{patientInfo.nric}</div>
                </div>
                <div className="mb-3 print:mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    MRN
                  </div>
                  <div className="text-base print:text-sm font-semibold text-slate-900">{patientInfo.mrn}</div>
                </div>
              </div>

              <div>
                <div className="mb-3 print:mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Date of Birth' : 'Tarikh Lahir'}
                  </div>
                  <div className="text-base print:text-sm font-semibold text-slate-900">
                    {formatDate(new Date(patientInfo.dob), language)} ({age} {language === 'en' ? 'years' : 'tahun'})
                  </div>
                </div>
                <div className="mb-3 print:mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Gender' : 'Jantina'}
                  </div>
                  <div className="text-base print:text-sm font-semibold text-slate-900">{patientInfo.gender}</div>
                </div>
                {patientInfo.phone && (
                  <div className="mb-3 print:mb-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                      {language === 'en' ? 'Contact' : 'Hubungan'}
                    </div>
                    <div className="text-base print:text-sm font-semibold text-slate-900">{patientInfo.phone}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <div className="grid md:grid-cols-2 gap-4 print:gap-3 mb-6 print:mb-4">
          {/* Allergies */}
          <Card className="border-4 border-red-400 bg-red-50 print:bg-white">
            <CardContent className="p-6 print:p-4">
              <div className="flex items-center gap-3 mb-3 print:mb-2">
                <AlertTriangle className="h-6 w-6 text-red-600 print:h-5 print:w-5" />
                <h3 className="text-lg print:text-base font-bold text-red-900">
                  ⚠️ {language === 'en' ? 'ALLERGIES' : 'ALAHAN'}
                </h3>
              </div>
              {patientInfo.allergies.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {language === 'en' ? 'No known allergies' : 'Tiada alahan diketahui'}
                </p>
              ) : (
                <div className="space-y-2 print:space-y-1">
                  {patientInfo.allergies.map((allergy, idx) => (
                    <div key={idx} className="text-base print:text-sm font-bold text-red-900 bg-red-100 print:bg-transparent p-2 print:p-1 rounded">
                      • {allergy}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chronic Conditions */}
          <Card className="border-4 border-orange-400 bg-orange-50 print:bg-white">
            <CardContent className="p-6 print:p-4">
              <div className="flex items-center gap-3 mb-3 print:mb-2">
                <Activity className="h-6 w-6 text-orange-600 print:h-5 print:w-5" />
                <h3 className="text-lg print:text-base font-bold text-orange-900">
                  {language === 'en' ? 'CHRONIC CONDITIONS' : 'PENYAKIT KRONIK'}
                </h3>
              </div>
              {chronicConditions.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {language === 'en' ? 'No chronic conditions' : 'Tiada penyakit kronik'}
                </p>
              ) : (
                <div className="space-y-2 print:space-y-1">
                  {chronicConditions.map((condition, idx) => (
                    <div key={idx} className="text-base print:text-sm font-bold text-orange-900 bg-orange-100 print:bg-transparent p-2 print:p-1 rounded">
                      • {condition}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Medications */}
        <Card className="border-2 border-slate-200 print:border mb-6 print:mb-4 print:page-break-inside-avoid">
          <CardContent className="p-6 print:p-4">
            <div className="flex items-center gap-3 mb-4 print:mb-3">
              <Pill className="h-6 w-6 text-blue-600 print:h-5 print:w-5" />
              <h2 className="text-xl print:text-lg font-bold text-slate-900">
                {language === 'en' ? 'CURRENT MEDICATIONS' : 'UBAT SEMASA'}
              </h2>
            </div>

            {currentMedications.length === 0 ? (
              <p className="text-slate-600 text-center py-4 print:py-2">
                {language === 'en' ? 'No current medications' : 'Tiada ubat semasa'}
              </p>
            ) : (
              <div className="space-y-4 print:space-y-2">
                {currentMedications.map((med, index) => (
                  <div key={med.id} className="p-4 print:p-2 bg-slate-50 print:bg-white rounded-lg border-2 print:border border-slate-200">
                    <div className="flex items-start gap-3 mb-2 print:mb-1">
                      <span className="text-lg print:text-base font-bold text-blue-600 flex-shrink-0">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <h4 className="text-base print:text-sm font-bold text-slate-900 mb-1">{med.medicationName}</h4>
                        <div className="grid grid-cols-2 gap-2 print:gap-1 text-sm print:text-xs">
                          <div>
                            <span className="font-medium">📝 {language === 'en' ? 'Dosage' : 'Dos'}:</span> {med.dosage}
                          </div>
                          <div>
                            <span className="font-medium">🕐 {language === 'en' ? 'Frequency' : 'Kekerapan'}:</span> {med.frequency}
                          </div>
                          <div>
                            <span className="font-medium">{language === 'en' ? 'Route' : 'Cara'}:</span> {med.route}
                          </div>
                          <div>
                            <span className="font-medium">{language === 'en' ? 'Started' : 'Mula'}:</span> {formatDate(new Date(med.startDate), language)}
                          </div>
                        </div>
                        {med.specialInstructions && (
                          <div className="mt-2 print:mt-1 text-xs print:text-xs bg-yellow-50 print:bg-transparent p-2 print:p-1 rounded">
                            ⚠️ {med.specialInstructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vital Signs */}
        {recentVitals && (
          <Card className="border-2 border-slate-200 print:border mb-6 print:mb-4">
            <CardContent className="p-6 print:p-4">
              <div className="flex items-center justify-between mb-4 print:mb-3">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-purple-600 print:h-5 print:w-5" />
                  <h2 className="text-xl print:text-lg font-bold text-slate-900">
                    {language === 'en' ? 'LATEST VITAL SIGNS' : 'TANDA-TANDA VITAL TERKINI'}
                  </h2>
                </div>
                <div className="text-xs print:text-xs text-slate-600">
                  {formatDate(new Date(recentVitals.recordedAt), language)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2">
                <div className="text-center p-3 print:p-2 bg-slate-50 print:bg-white rounded-lg">
                  <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Blood Pressure' : 'Tekanan Darah'}
                  </div>
                  <div className="text-2xl print:text-lg font-bold text-slate-900">
                    {recentVitals.bloodPressureSystolic}/{recentVitals.bloodPressureDiastolic}
                  </div>
                  <div className="text-xs text-slate-600">mmHg</div>
                </div>

                <div className="text-center p-3 print:p-2 bg-slate-50 print:bg-white rounded-lg">
                  <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Heart Rate' : 'Degupan Jantung'}
                  </div>
                  <div className="text-2xl print:text-lg font-bold text-slate-900">
                    {recentVitals.heartRate}
                  </div>
                  <div className="text-xs text-slate-600">bpm</div>
                </div>

                <div className="text-center p-3 print:p-2 bg-slate-50 print:bg-white rounded-lg">
                  <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Temperature' : 'Suhu'}
                  </div>
                  <div className="text-2xl print:text-lg font-bold text-slate-900">
                    {recentVitals.temperature}
                  </div>
                  <div className="text-xs text-slate-600">°C</div>
                </div>

                <div className="text-center p-3 print:p-2 bg-slate-50 print:bg-white rounded-lg">
                  <div className="text-xs print:text-xs font-semibold text-slate-500 uppercase mb-1">
                    SpO2
                  </div>
                  <div className="text-2xl print:text-lg font-bold text-slate-900">
                    {recentVitals.oxygenSaturation}
                  </div>
                  <div className="text-xs text-slate-600">%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lab Results */}
        {recentLabResults.length > 0 && (
          <Card className="border-2 border-slate-200 print:border mb-6 print:mb-4">
            <CardContent className="p-6 print:p-4">
              <div className="flex items-center gap-3 mb-4 print:mb-3">
                <Droplet className="h-6 w-6 text-purple-600 print:h-5 print:w-5" />
                <h2 className="text-xl print:text-lg font-bold text-slate-900">
                  {language === 'en' ? 'RECENT LAB RESULTS' : 'KEPUTUSAN MAKMAL TERKINI'}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4 print:gap-2">
                {recentLabResults.map((lab) => (
                  <div key={lab.id} className="p-4 print:p-2 bg-slate-50 print:bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2 print:mb-1">
                      <h4 className="font-bold text-slate-900 text-base print:text-sm">{lab.testName}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        lab.status === 'normal' ? 'bg-green-100 text-green-700' :
                        lab.status === 'abnormal' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {lab.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl print:text-lg font-bold text-slate-900">{lab.result}</span>
                      {lab.unit && <span className="text-sm text-slate-600">{lab.unit}</span>}
                    </div>
                    {lab.referenceRange && (
                      <p className="text-xs text-slate-600">
                        {language === 'en' ? 'Reference' : 'Rujukan'}: {lab.referenceRange}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2 print:mt-1">
                      {formatDate(new Date(lab.testDate), language)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Visit */}
        {lastVisit && (
          <Card className="border-2 border-slate-200 print:border mb-6 print:mb-4">
            <CardContent className="p-6 print:p-4">
              <div className="flex items-center gap-3 mb-4 print:mb-3">
                <Calendar className="h-6 w-6 text-green-600 print:h-5 print:w-5" />
                <h2 className="text-xl print:text-lg font-bold text-slate-900">
                  {language === 'en' ? 'RECENT DIAGNOSIS' : 'DIAGNOSIS TERKINI'}
                </h2>
              </div>

              <div className="space-y-3 print:space-y-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Date' : 'Tarikh'}
                  </div>
                  <div className="text-base print:text-sm font-semibold text-slate-900">
                    {formatDate(new Date(lastVisit.visitDate), language)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Diagnosis' : 'Diagnosis'}
                  </div>
                  <div className="text-base print:text-sm font-semibold text-slate-900">
                    {lastVisit.diagnosis}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {language === 'en' ? 'Managed By' : 'Dikendalikan Oleh'}
                  </div>
                  <div className="text-base print:text-sm font-semibold text-slate-900">
                    {lastVisit.doctorName} - {lastVisit.department}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Card className="border-2 border-blue-200 print:border-4 print:border-blue-600">
          <CardContent className="p-6 print:p-4">
            <div className="text-center space-y-2 print:space-y-1">
              <h3 className="text-lg print:text-base font-bold text-slate-900">Hospital Lawas</h3>
              <p className="text-sm print:text-xs text-slate-600">
                {language === 'en' ? 'Phone' : 'Telefon'}: 085-283781
              </p>
              <p className="text-sm print:text-xs text-slate-600">
                🌐 www.hospitallawas.gov.my
              </p>
              <div className="pt-4 print:pt-2 border-t border-slate-200 print:border-slate-400">
                <p className="text-xs text-slate-500">
                  🔒 {language === 'en' ? 'CONFIDENTIAL MEDICAL RECORD' : 'REKOD PERUBATAN SULIT'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'en' ? 'For healthcare professional use only' : 'Untuk kegunaan professional perubatan sahaja'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

