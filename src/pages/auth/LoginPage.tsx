import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, FileText, Shield, Activity, Users, Zap } from 'lucide-react'
import { Button, Modal, LogoImage } from '@/components/ui'
import { LoginForm, ResetPasswordForm, AccessRequestForm } from '@/components/forms'
import { ContactModal } from '@/components/shared'
import { useAuthStore } from '@/stores/authStore'
import { COPYRIGHT_TEXT, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

type View = 'login' | 'reset' | 'access-request'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [currentView, setCurrentView] = useState<View>('login')
  const [showContactModal, setShowContactModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const hasNavigated = useRef(false)

  // Redirect if already authenticated
  useEffect(() => {
    // Don't navigate if still loading or already navigated
    if (isLoading || hasNavigated.current) {
      return
    }

    // Only navigate if authenticated and currently on login page
    if (isAuthenticated && location.pathname === ROUTES.LOGIN) {
      hasNavigated.current = true
      // Use setTimeout to prevent navigation loop
      const timer = setTimeout(() => {
        navigate(ROUTES.DASHBOARD, { replace: true })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname])

  const handleLoginSuccess = () => {
    navigate(ROUTES.DASHBOARD, { replace: true })
  }

  const handleAccessRequestSuccess = () => {
    setShowAccessModal(false)
    setCurrentView('login')
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden">
        {/* Background - Dark gradient with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Accent Glow */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full px-12 xl:px-20 py-12">
          {/* Top - Government Branding */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-5"
          >
            {/* Jata Negara */}
            <LogoImage
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara Malaysia"
              size="w-32 h-32 xl:w-40 xl:h-40"
              className="drop-shadow-2xl"
              priority
            />
            <div className="border-l-2 border-white/20 pl-5">
              <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-wide">
                MINISTRY OF HEALTH (MOH)
              </h1>
              <p className="text-lg xl:text-xl text-slate-300 font-semibold">
                MALAYSIA
              </p>
            </div>
          </motion.div>

          {/* Center - Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* System Name */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full" />
                <span className="text-teal-400 text-sm font-semibold tracking-widest uppercase">
                  Healthcare Management System
                </span>
              </div>
              
              <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
                Hospital Operation
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">
                  Management Ecosystem
                </span>
              </h2>
              
              <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                A comprehensive digital platform designed to streamline hospital operations, 
                enhance efficiency, and improve healthcare delivery across Malaysia.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, label: 'Secure Access' },
                { icon: Activity, label: 'Real-time Monitoring' },
                { icon: Users, label: 'Multi-Hospital' },
                { icon: Zap, label: 'High Performance' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
                >
                  <feature.icon className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-slate-300">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom - Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-8"
          >
            {[
              { value: '150+', label: 'Healthcare Facilities' },
              { value: '50K+', label: 'Active Users' },
              { value: '99.9%', label: 'System Uptime' },
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col bg-white relative overflow-hidden">
        {/* Subtle Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" className="text-slate-900" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        {/* Mobile Header */}
        <div className="lg:hidden bg-slate-950 px-6 py-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-center gap-4">
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara"
              className="w-20 h-20 object-contain drop-shadow-glow"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">MINISTRY OF HEALTH</h1>
              <p className="text-sm text-teal-400 font-bold uppercase tracking-[0.2em]">Malaysia</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 xl:px-24 py-16 relative z-10">
          <div className="w-full max-w-[420px] mx-auto">
            {/* Form Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center lg:text-left"
            >
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                {currentView === 'login' && (
                  <>
                    Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Back</span>
                  </>
                )}
                {currentView === 'reset' && 'Reset Security'}
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                {currentView === 'login' && 'Sign in to manage hospital operations and healthcare delivery.'}
                {currentView === 'reset' && 'Please enter your administrative ID to proceed.'}
              </p>
            </motion.div>

            {/* Main Form Content */}
            <div className="relative">
              {currentView === 'login' && (
                <LoginForm
                  onShowResetPassword={() => setCurrentView('reset')}
                  onSuccess={handleLoginSuccess}
                />
              )}

              {currentView === 'reset' && (
                <ResetPasswordForm onBack={() => setCurrentView('login')} />
              )}
            </div>

            {/* Bottom Actions */}
            {currentView === 'login' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 pt-10 border-t border-slate-100"
              >
                <div className="text-center space-y-6">
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    Administrative Access
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 border-slate-200 bg-white text-slate-700 hover:border-teal-500 hover:bg-teal-50/50 hover:text-teal-700 rounded-2xl transition-all duration-300 font-bold text-base"
                    onClick={() => setShowAccessModal(true)}
                    leftIcon={<FileText className="w-5 h-5 text-teal-600" />}
                  >
                    Request System Access
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/30">
          <div className="flex flex-col items-center gap-6 text-sm">
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-slate-500 font-semibold">
              <button
                onClick={() => setShowContactModal(true)}
                className="flex items-center gap-2 hover:text-teal-600 transition-colors"
              >
                <Mail className="w-4 h-4 text-teal-500" />
                Help Desk
              </button>
              <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-teal-600 transition-colors">
                Privacy
              </Link>
              <Link to={ROUTES.TERMS_OF_SERVICE} className="hover:text-teal-600 transition-colors">
                Terms
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <img
                src="/512px-Jata_MalaysiaV2.svg.png"
                alt="Jata Negara"
                className="w-6 h-6 object-contain opacity-40 grayscale"
              />
              <p className="text-slate-400 font-medium">{COPYRIGHT_TEXT}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      {/* Access Request Modal */}
      <Modal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        size="xl"
      >
        <AccessRequestForm
          onBack={() => setShowAccessModal(false)}
          onSuccess={handleAccessRequestSuccess}
        />
      </Modal>
    </div>
  )
}

export default LoginPage
