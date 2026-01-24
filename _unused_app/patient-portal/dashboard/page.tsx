'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart,
  Pill,
  Calendar,
  FileText,
  Activity,
  Download,
  Share2,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Loader2,
  ChevronRight,
  TrendingUp,
  Droplet,
  Wind,
  QrCode,
} from 'lucide-react';
import { getCurrentPatient, formatDate, calculateAge, logPortalAccess } from '@/features/patient-portal/utils/auth';
import type { PatientHealthSummary } from '@/features/patient-portal/types/Patient';

export default function PatientDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState(getCurrentPatient());
  const [healthSummary, setHealthSummary] = useState<PatientHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication
    if (!patient) {
      router.push('/patient-portal/login');
      return;
    }

    // Fetch health summary
    fetchHealthSummary();
  }, []);

  const fetchHealthSummary = async () => {
    try {
      const response = await fetch(`/api/patient-portal/health-summary?patientId=${patient?.id}`);
      const data = await response.json();

      if (data.success) {
        setHealthSummary(data.data);
      } else {
        setError(data.error || 'Failed to load health summary');
      }
    } catch (err) {
      console.error('Error fetching health summary:', err);
      setError('An error occurred while loading your health information');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('patient_session');
    router.push('/patient-portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your health information...</p>
        </div>
      </div>
    );
  }

  if (error || !healthSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Data</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/patient-portal/login')}>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { patient: patientInfo, chronicConditions, currentMedications, recentVitals, recentLabResults, lastVisit } = healthSummary;
  const language = patient?.portalLanguage || 'en';
  const age = calculateAge(new Date(patientInfo.dob));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {language === 'en' ? 'My Health Portal' : 'Portal Kesihatan Saya'}
                </h1>
                <p className="text-sm text-slate-600">Hospital Lawas</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              {language === 'en' ? 'Logout' : 'Log Keluar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Patient Info Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{patientInfo.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/90">
                      <span>IC: {patientInfo.nric}</span>
                      <span>•</span>
                      <span>{age} {language === 'en' ? 'years' : 'tahun'} / {patientInfo.gender}</span>
                      <span>•</span>
                      <span>MRN: {patientInfo.mrn}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/80 mb-1">
                    {language === 'en' ? 'Last Visit' : 'Lawatan Terakhir'}
                  </div>
                  <div className="text-lg font-semibold">
                    {lastVisit ? formatDate(new Date(lastVisit.visitDate), language) : '-'}
                  </div>
                </div>
              </div>

              {patientInfo.phone && (
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Phone className="h-4 w-4" />
                  <span>{patientInfo.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          {(patientInfo.allergies.length > 0 || chronicConditions.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Allergies */}
              {patientInfo.allergies.length > 0 && (
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-2">
                          {language === 'en' ? '⚠️ Drug Allergies' : '⚠️ Alahan Ubat'}
                        </h3>
                        <div className="space-y-1">
                          {patientInfo.allergies.map((allergy, idx) => (
                            <div key={idx} className="text-sm font-medium text-red-800">
                              • {allergy}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chronic Conditions */}
              {chronicConditions.length > 0 && (
                <Card className="border-2 border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-600 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-orange-900 mb-2">
                          {language === 'en' ? 'Chronic Conditions' : 'Penyakit Kronik'}
                        </h3>
                        <div className="space-y-1">
                          {chronicConditions.map((condition, idx) => (
                            <div key={idx} className="text-sm font-medium text-orange-800">
                              • {condition}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Pill className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{currentMedications.length}</div>
                    <div className="text-xs text-slate-600">
                      {language === 'en' ? 'Medications' : 'Ubat'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {recentVitals?.bloodPressureSystolic || '-'}/{recentVitals?.bloodPressureDiastolic || '-'}
                    </div>
                    <div className="text-xs text-slate-600">BP (mmHg)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {recentVitals?.heartRate || '-'}
                    </div>
                    <div className="text-xs text-slate-600">
                      {language === 'en' ? 'Heart Rate' : 'Degupan Jantung'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Wind className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {recentVitals?.oxygenSaturation || '-'}%
                    </div>
                    <div className="text-xs text-slate-600">SpO2</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Medications */}
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Pill className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {language === 'en' ? 'Current Medications' : 'Ubat Semasa'}
                  </h3>
                </div>
                <Link href="/patient-portal/medications">
                  <Button variant="outline" size="sm" className="gap-2">
                    {language === 'en' ? 'View All' : 'Lihat Semua'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {currentMedications.length === 0 ? (
                <p className="text-slate-600 text-center py-8">
                  {language === 'en' ? 'No current medications' : 'Tiada ubat semasa'}
                </p>
              ) : (
                <div className="space-y-3">
                  {currentMedications.slice(0, 3).map((med) => (
                    <div key={med.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-1">{med.medicationName}</h4>
                          <p className="text-sm text-slate-600 mb-2">
                            {med.dosage} {med.frequency}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {med.route}
                            </span>
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              {med.form}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-slate-600">
                          <div className="font-medium">{med.strength}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Lab Results */}
          {recentLabResults.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Droplet className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {language === 'en' ? 'Recent Lab Results' : 'Keputusan Makmal Terkini'}
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {recentLabResults.map((lab) => (
                    <div key={lab.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{lab.testName}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          lab.status === 'normal' ? 'bg-green-100 text-green-700' :
                          lab.status === 'abnormal' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {lab.status}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-slate-900">{lab.result}</span>
                        {lab.unit && <span className="text-sm text-slate-600">{lab.unit}</span>}
                      </div>
                      {lab.referenceRange && (
                        <p className="text-xs text-slate-600">
                          {language === 'en' ? 'Reference' : 'Rujukan'}: {lab.referenceRange}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        {formatDate(new Date(lab.testDate), language)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/patient-portal/health-summary">
              <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">
                        {language === 'en' ? 'Health Summary' : 'Ringkasan Kesihatan'}
                      </h4>
                      <p className="text-xs text-white/80">
                        {language === 'en' ? 'View full report' : 'Lihat laporan penuh'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/patient-portal/share">
              <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">
                        {language === 'en' ? 'Share QR Code' : 'Kongsi QR Code'}
                      </h4>
                      <p className="text-xs text-white/80">
                        {language === 'en' ? 'For other doctors' : 'Untuk doktor lain'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {language === 'en' ? 'Contact Hospital' : 'Hubungi Hospital'}
                    </h4>
                    <p className="text-xs text-slate-600">085-283781</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}

