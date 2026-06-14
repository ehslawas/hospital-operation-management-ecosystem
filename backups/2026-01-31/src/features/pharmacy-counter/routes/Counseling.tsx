'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import { PatientSearch } from '../components/PatientSearch';
import type { Patient } from '../types/entities';
import { MessageSquare, CheckCircle, X, FileText, Clock } from 'lucide-react';

type CounselingContext = 'new-start' | 'high-risk' | 'discharge' | 'device-training' | 'adherence-support';

export default function Counseling() {
  const { language } = useLanguage();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [context, setContext] = useState<CounselingContext>('new-start');
  const [topicsCovered, setTopicsCovered] = useState<string[]>([]);
  const [teachBackPassed, setTeachBackPassed] = useState(false);
  const [leafletGiven, setLeafletGiven] = useState(false);
  const [notes, setNotes] = useState('');

  const contexts = [
    { id: 'new-start' as const, label: { en: 'New Medication', bm: 'Ubat Baru' } },
    { id: 'high-risk' as const, label: { en: 'High-Risk Medication', bm: 'Ubat Berisiko Tinggi' } },
    { id: 'discharge' as const, label: { en: 'Discharge', bm: 'Pelepasan' } },
    { id: 'device-training' as const, label: { en: 'Device Training', bm: 'Latihan Alat' } },
    { id: 'adherence-support' as const, label: { en: 'Adherence Support', bm: 'Sokongan Pematuhan' } },
  ];

  const commonTopics = [
    { en: 'Medication name and purpose', bm: 'Nama dan tujuan ubat' },
    { en: 'Dosage and frequency', bm: 'Dos dan kekerapan' },
    { en: 'Administration instructions', bm: 'Arahan pengambilan' },
    { en: 'Common side effects', bm: 'Kesan sampingan biasa' },
    { en: 'Storage requirements', bm: 'Keperluan penyimpanan' },
    { en: 'Warning signs to watch for', bm: 'Tanda amaran yang perlu diperhatikan' },
    { en: 'Drug interactions', bm: 'Interaksi ubat' },
    { en: 'When to seek medical help', bm: 'Bila perlu dapatkan bantuan perubatan' },
  ];

  const deviceTopics = [
    { en: 'MDI (Metered Dose Inhaler)', bm: 'MDI (Penyedut Dos Terukur)' },
    { en: 'DPI (Dry Powder Inhaler)', bm: 'DPI (Penyedut Serbuk Kering)' },
    { en: 'Spacer use', bm: 'Penggunaan spacer' },
    { en: 'Insulin pen/syringe', bm: 'Pen/picagari insulin' },
    { en: 'Glucometer', bm: 'Glukometer' },
    { en: 'Blood pressure monitor', bm: 'Monitor tekanan darah' },
  ];

  const toggleTopic = (topic: string) => {
    if (topicsCovered.includes(topic)) {
      setTopicsCovered(topicsCovered.filter(t => t !== topic));
    } else {
      setTopicsCovered([...topicsCovered, topic]);
    }
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      alert(language === 'en' ? 'Please select a patient' : 'Sila pilih pesakit');
      return;
    }

    const record = {
      id: `COUN${Date.now()}`,
      patientId: selectedPatient.id,
      date: new Date().toISOString(),
      context,
      topicsCovered,
      teachBackPassed,
      leafletGiven,
      notes,
      counseledBy: 'Current User', // Would come from auth
      duration: 15, // Mock
    };

    console.log('Saving counseling record:', record);
    alert(language === 'en' ? 'Counseling record saved' : 'Rekod kaunseling disimpan');

    // Reset form
    setTopicsCovered([]);
    setTeachBackPassed(false);
    setLeafletGiven(false);
    setNotes('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.counseling', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'Patient counseling, device training, and medication education' 
            : 'Kaunseling pesakit, latihan alat, dan pendidikan ubat'}
        </p>
      </div>

      {/* Patient Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          {t('patient.name', language)}
        </h2>
        <PatientSearch onSelect={setSelectedPatient} />
        
        {selectedPatient && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedPatient.name}</h3>
                <p className="text-sm text-gray-600">MRN: {selectedPatient.mrn}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Counseling Form */}
      {selectedPatient && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Context Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {language === 'en' ? 'Counseling Context' : 'Konteks Kaunseling'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {contexts.map((ctx) => (
                <button
                  key={ctx.id}
                  onClick={() => setContext(ctx.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    context === ctx.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ctx.label[language]}
                </button>
              ))}
            </div>
          </div>

          {/* Topics Covered */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {language === 'en' ? 'Topics Covered' : 'Topik yang Dibincangkan'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(context === 'device-training' ? deviceTopics : commonTopics).map((topic, index) => (
                <button
                  key={index}
                  onClick={() => toggleTopic(topic[language])}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    topicsCovered.includes(topic[language])
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {topicsCovered.includes(topic[language]) && (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="flex-1">{topic[language]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Teach-Back and Leaflet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="teachBack"
                checked={teachBackPassed}
                onChange={(e) => setTeachBackPassed(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="teachBack" className="text-sm font-medium text-gray-900 cursor-pointer">
                {language === 'en' ? 'Teach-Back Assessment Passed' : 'Penilaian Teach-Back Lulus'}
              </label>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="leaflet"
                checked={leafletGiven}
                onChange={(e) => setLeafletGiven(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="leaflet" className="text-sm font-medium text-gray-900 cursor-pointer">
                {language === 'en' ? 'Patient Information Leaflet Given' : 'Risalah Maklumat Pesakit Diberikan'}
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {language === 'en' ? 'Counseling Notes' : 'Nota Kaunseling'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={language === 'en' 
                ? 'Additional notes, follow-up plans, patient concerns, etc.' 
                : 'Nota tambahan, rancangan susulan, kebimbangan pesakit, dll.'}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {language === 'en' ? 'Save Counseling Record' : 'Simpan Rekod Kaunseling'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-4 w-4" />
              {language === 'en' ? 'Print Leaflet' : 'Cetak Risalah'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

