'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Lock, Calendar, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Globe, Pill, AlertTriangle, FileText, Activity, Share2, Phone } from 'lucide-react';
import { validateMalaysianIC, formatIC, storePatientSession } from '@/features/patient-portal/utils/auth';

export default function PatientPortalLogin() {
  const router = useRouter();
  const [nric, setNric] = useState('');
  const [authMethod, setAuthMethod] = useState<'pin' | 'dob'>('pin');
  const [pin, setPin] = useState('');
  const [dob, setDob] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'en' | 'ms'>('en');

  const translations = {
    en: {
      title: 'Patient Health Portal',
      subtitle: 'Hospital Lawas',
      welcome: 'Welcome to MyHealth',
      description: 'Access your medical records, medications, and health information securely',
      icLabel: 'IC Number',
      icPlaceholder: 'Enter your IC (e.g., 850615-10-5234)',
      authMethodLabel: 'Login Method',
      pinMethod: 'PIN (6 digits)',
      dobMethod: 'Date of Birth',
      pinLabel: 'PIN',
      pinPlaceholder: 'Enter your 6-digit PIN',
      dobLabel: 'Date of Birth',
      dobPlaceholder: 'Select your date of birth',
      loginButton: 'Login',
      loggingIn: 'Logging in...',
      firstTime: 'First time here?',
      activate: 'Contact hospital to activate your account',
      contactPhone: 'Phone: 085-283781',
      features: {
        title: 'What you can do',
        medications: 'View current medications',
        allergies: 'Check your allergies',
        visits: 'Access visit history',
        labs: 'See lab results',
        share: 'Share with other doctors',
      },
      security: 'Your data is secure and encrypted',
    },
    ms: {
      title: 'Portal Kesihatan Pesakit',
      subtitle: 'Hospital Lawas',
      welcome: 'Selamat Datang ke MyHealth',
      description: 'Akses rekod perubatan, ubat-ubatan, dan maklumat kesihatan anda dengan selamat',
      icLabel: 'Nombor IC',
      icPlaceholder: 'Masukkan IC anda (cth: 850615-10-5234)',
      authMethodLabel: 'Kaedah Log Masuk',
      pinMethod: 'PIN (6 digit)',
      dobMethod: 'Tarikh Lahir',
      pinLabel: 'PIN',
      pinPlaceholder: 'Masukkan PIN 6 digit anda',
      dobLabel: 'Tarikh Lahir',
      dobPlaceholder: 'Pilih tarikh lahir anda',
      loginButton: 'Log Masuk',
      loggingIn: 'Sedang log masuk...',
      firstTime: 'Kali pertama?',
      activate: 'Hubungi hospital untuk aktifkan akaun anda',
      contactPhone: 'Telefon: 085-283781',
      features: {
        title: 'Apa yang anda boleh lakukan',
        medications: 'Lihat ubat semasa',
        allergies: 'Semak alahan anda',
        visits: 'Akses sejarah lawatan',
        labs: 'Lihat keputusan makmal',
        share: 'Kongsi dengan doktor lain',
      },
      security: 'Data anda selamat dan disulitkan',
    },
  };

  const t = translations[language];

  // Format IC as user types
  const handleNricChange = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 12 digits
    const limited = cleaned.slice(0, 12);
    
    // Format as user types
    let formatted = limited;
    if (limited.length > 6) {
      formatted = limited.slice(0, 6) + '-' + limited.slice(6);
    }
    if (limited.length > 8) {
      formatted = limited.slice(0, 6) + '-' + limited.slice(6, 8) + '-' + limited.slice(8);
    }
    
    setNric(formatted);
    setError('');
  };

  // Handle PIN input (numbers only)
  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setPin(cleaned.slice(0, 6));
    setError('');
  };

  const handleLogin = async () => {
    setError('');

    // Validate IC
    if (!nric) {
      setError(language === 'en' ? 'Please enter your IC number' : 'Sila masukkan nombor IC anda');
      return;
    }

    if (!validateMalaysianIC(nric)) {
      setError(language === 'en' ? 'Invalid IC number format' : 'Format nombor IC tidak sah');
      return;
    }

    // Validate authentication method
    if (authMethod === 'pin') {
      if (!pin || pin.length !== 6) {
        setError(language === 'en' ? 'Please enter a valid 6-digit PIN' : 'Sila masukkan PIN 6 digit yang sah');
        return;
      }
    } else {
      if (!dob) {
        setError(language === 'en' ? 'Please select your date of birth' : 'Sila pilih tarikh lahir anda');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/patient-portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nric,
          pin: authMethod === 'pin' ? pin : undefined,
          dob: authMethod === 'dob' ? dob : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store session
        storePatientSession({
          patient: {
            ...data.patient,
            dob: new Date(data.patient.dob),
          },
          token: data.token,
          expiresAt: new Date(data.expiresAt),
        });

        // Redirect to dashboard
        router.push('/patient-portal/dashboard');
      } else {
        if (data.code === 'PORTAL_NOT_ACTIVE') {
          setError(data.error);
        } else {
          setError(data.error || (language === 'en' ? 'Login failed. Please check your credentials.' : 'Log masuk gagal. Sila semak kelayakan anda.'));
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(language === 'en' ? 'An error occurred. Please try again.' : 'Ralat berlaku. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f] relative overflow-hidden">
      {/* Tech DNA Network Background */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        {/* Network Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Glowing Nodes */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse animation-delay-4000"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse animation-delay-4000"></div>
        
        {/* DNA Helix Effect */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent transform rotate-12"></div>
        <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent transform -rotate-12"></div>
        
        {/* Particle Connections */}
        <svg className="absolute inset-0 w-full h-full">
          <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
          <line x1="70%" y1="30%" x2="85%" y2="50%" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
          <line x1="20%" y1="60%" x2="40%" y2="80%" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
          <line x1="60%" y1="70%" x2="80%" y2="85%" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
          <line x1="50%" y1="30%" x2="70%" y2="60%" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="1" />
        </svg>
        
        {/* Floating Circuit Patterns */}
        <div className="absolute top-10 right-10 w-32 h-32 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="20" cy="20" r="3" fill="#3b82f6" />
            <circle cx="80" cy="20" r="3" fill="#06b6d4" />
            <circle cx="50" cy="50" r="3" fill="#3b82f6" />
            <circle cx="20" cy="80" r="3" fill="#06b6d4" />
            <circle cx="80" cy="80" r="3" fill="#3b82f6" />
            <line x1="20" y1="20" x2="50" y2="50" stroke="#3b82f6" strokeWidth="1" />
            <line x1="80" y1="20" x2="50" y2="50" stroke="#06b6d4" strokeWidth="1" />
            <line x1="50" y1="50" x2="20" y2="80" stroke="#3b82f6" strokeWidth="1" />
            <line x1="50" y1="50" x2="80" y2="80" stroke="#06b6d4" strokeWidth="1" />
          </svg>
        </div>
        
        <div className="absolute bottom-10 left-10 w-32 h-32 opacity-20 transform rotate-45">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="10" r="3" fill="#3b82f6" />
            <circle cx="90" cy="50" r="3" fill="#06b6d4" />
            <circle cx="50" cy="90" r="3" fill="#3b82f6" />
            <circle cx="10" cy="50" r="3" fill="#06b6d4" />
            <line x1="50" y1="10" x2="90" y2="50" stroke="#3b82f6" strokeWidth="1" />
            <line x1="90" y1="50" x2="50" y2="90" stroke="#06b6d4" strokeWidth="1" />
            <line x1="50" y1="90" x2="10" y2="50" stroke="#3b82f6" strokeWidth="1" />
            <line x1="10" y1="50" x2="50" y2="10" stroke="#06b6d4" strokeWidth="1" />
          </svg>
        </div>
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/20"></div>

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all shadow-lg hover:shadow-xl"
        >
          <Globe className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">
            {language === 'en' ? 'Bahasa Malaysia' : 'English'}
          </span>
        </button>
      </div>

      <div className="container mx-auto px-4 py-6 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full relative z-10">
          
          {/* Header - Logo & Title */}
          <div className="text-center mb-8">
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 mx-auto mb-4">
              {/* Pulsing Ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 animate-ping"></div>
              <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30"></div>
              {/* Icon */}
              <Heart className="h-10 w-10 text-white relative z-10" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
              {t.title}
            </h1>
            <p className="text-sm text-cyan-300 font-medium uppercase tracking-wider">{t.subtitle}</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 border border-white/50 relative">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
              
              <div className="mb-6 relative z-10">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {t.loginButton}
                </h2>
                <p className="text-slate-600 text-sm">{language === 'en' ? 'Enter your credentials to access your health record' : 'Masukkan kelayakan anda untuk akses rekod kesihatan'}</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4 relative z-10">
                {/* IC Number */}
                <div className="group">
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    {t.icLabel}
                  </label>
                  <Input
                    type="text"
                    value={nric}
                    onChange={(e) => handleNricChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.icPlaceholder}
                    className="h-11 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 backdrop-blur-sm hover:border-blue-300"
                    disabled={loading}
                  />
                </div>

                {/* Authentication Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    {t.authMethodLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('pin')}
                      className={`group p-3 rounded-xl border-2 transition-all ${
                        authMethod === 'pin'
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                      disabled={loading}
                    >
                      <div className={`h-10 w-10 rounded-lg mx-auto mb-2 flex items-center justify-center transition-all ${
                        authMethod === 'pin'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          : 'bg-slate-100 group-hover:bg-blue-100'
                      }`}>
                        <Lock className={`h-5 w-5 ${authMethod === 'pin' ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <div className={`text-xs font-bold ${authMethod === 'pin' ? 'text-blue-900' : 'text-slate-700'}`}>
                        {t.pinMethod}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('dob')}
                      className={`group p-3 rounded-xl border-2 transition-all ${
                        authMethod === 'dob'
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                      disabled={loading}
                    >
                      <div className={`h-10 w-10 rounded-lg mx-auto mb-2 flex items-center justify-center transition-all ${
                        authMethod === 'dob'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          : 'bg-slate-100 group-hover:bg-blue-100'
                      }`}>
                        <Calendar className={`h-5 w-5 ${authMethod === 'dob' ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <div className={`text-xs font-bold ${authMethod === 'dob' ? 'text-blue-900' : 'text-slate-700'}`}>
                        {t.dobMethod}
                      </div>
                    </button>
                  </div>
                </div>

                {/* PIN Input */}
                {authMethod === 'pin' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      {t.pinLabel}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t.pinPlaceholder}
                        className="h-11 text-sm pr-12 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 backdrop-blur-sm hover:border-blue-300 tracking-widest"
                        maxLength={6}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* DOB Input */}
                {authMethod === 'dob' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                      {t.dobLabel}
                    </label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        setError('');
                      }}
                      onKeyPress={handleKeyPress}
                      className="h-11 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 backdrop-blur-sm hover:border-blue-300"
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Login Button */}
                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-12 text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.loggingIn}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      {t.loginButton}
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Lock className="h-2 w-2 text-white" />
                  </div>
                  <span className="font-medium uppercase tracking-wide">{t.security}</span>
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-6 pt-4 border-t border-slate-200 relative z-10">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">
                  {t.firstTime}
                </p>
                <p className="text-xs text-slate-600 mb-2">{t.activate}</p>
                <div className="flex items-center gap-2 text-blue-600">
                  <Phone className="h-4 w-4" />
                  <p className="text-sm font-bold">{t.contactPhone}</p>
                </div>
              </div>
            </div>

            {/* Footer - Features */}
            <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 text-center">
                {t.features.title}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Pill, text: t.features.medications },
                  { icon: AlertTriangle, text: t.features.allergies },
                  { icon: FileText, text: t.features.visits },
                  { icon: Activity, text: t.features.labs },
                ].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-blue-100">
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

