import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-react'
import { Button, LogoImage } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate()

  const sections = [
    {
      icon: Shield,
      title: '1. Introduction',
      content: `The Ministry of Health Malaysia (MOH) is committed to protecting the privacy and confidentiality of personal information collected through the Hospital Operation Management Ecosystem (HOME) system. This Privacy Policy outlines how we collect, use, store, and protect your personal data in accordance with the Personal Data Protection Act 2010 (PDPA) and other applicable Malaysian laws.`,
    },
    {
      icon: FileText,
      title: '2. Information We Collect',
      content: `We collect personal information necessary for the operation of the HOME system, including but not limited to:
- Employee identification numbers and personal details
- Contact information (email, phone numbers, addresses)
- Department and role assignments
- Emergency contact information
- Profile photographs
- System access logs and activity records
- Health-related information as required for healthcare operations`,
    },
    {
      icon: Eye,
      title: '3. How We Use Your Information',
      content: `Your personal information is used exclusively for:
- System access authentication and authorization
- Healthcare facility operations and management
- Communication regarding system updates and important notices
- Compliance with legal and regulatory requirements
- System security and audit purposes
- Emergency contact purposes`,
    },
    {
      icon: Lock,
      title: '4. Data Security and Protection',
      content: `MOH implements comprehensive security measures to protect your personal information:
- Encryption of data in transit and at rest
- Access controls and authentication mechanisms
- Regular security audits and assessments
- Secure data storage with backup and recovery procedures
- Staff training on data protection and privacy
- Compliance with MOH security standards and guidelines`,
    },
    {
      icon: CheckCircle,
      title: '5. Data Retention',
      content: `Personal information is retained only for as long as necessary to fulfill the purposes outlined in this policy or as required by law. Data retention periods are determined based on:
- Legal and regulatory requirements
- Operational needs of the healthcare system
- MOH data retention policies
- User account status and access requirements`,
    },
    {
      icon: Shield,
      title: '6. Your Rights',
      content: `Under the PDPA, you have the right to:
- Access your personal information
- Request correction of inaccurate data
- Withdraw consent (subject to legal and operational constraints)
- File complaints regarding data handling
- Request information about data processing activities`,
    },
    {
      icon: FileText,
      title: '7. Third-Party Disclosure',
      content: `MOH does not sell, trade, or transfer your personal information to third parties except:
- When required by law or legal process
- To authorized healthcare facilities within the MOH network
- To service providers under strict confidentiality agreements
- In emergency situations for public health and safety`,
    },
    {
      icon: Lock,
      title: '8. Cookies and Tracking',
      content: `The HOME system uses essential cookies and session management tools for:
- User authentication and session maintenance
- System security and fraud prevention
- Performance monitoring and optimization
We do not use tracking cookies for advertising or marketing purposes.`,
    },
    {
      icon: CheckCircle,
      title: '9. Changes to This Policy',
      content: `MOH reserves the right to update this Privacy Policy to reflect changes in legal requirements, system operations, or best practices. Users will be notified of significant changes through the system or official communication channels.`,
    },
    {
      icon: Shield,
      title: '10. Contact Information',
      content: `For privacy-related inquiries, complaints, or requests, please contact:
Ministry of Health Malaysia
Data Protection Officer
Email: privacy@moh.gov.my
Phone: +60 3-8883 1000
Address: Block E1, E3, E6, E7 & E10, Parcel E, Federal Government Administrative Centre, 62590 Putrajaya, Malaysia`,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <LogoImage
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara Malaysia"
              size={64}
              priority
              className="w-24 h-24 object-contain drop-shadow-2xl"
            />
            <div className="flex-1">
              <h1 className="text-3xl xl:text-4xl font-bold text-white mb-2">
                Privacy Policy
              </h1>
              <p className="text-slate-300 text-lg">
                Ministry of Health Malaysia - Hospital Operation Management Ecosystem
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Back to Login
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-slate-200"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Our Commitment to Your Privacy
              </h2>
              <p className="text-slate-700 leading-relaxed text-lg">
                The Ministry of Health Malaysia is dedicated to maintaining the highest standards of data protection and privacy. This Privacy Policy demonstrates our commitment to safeguarding your personal information in accordance with Malaysian law and MOH guidelines.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border-l-4 border-teal-500">
            <p className="text-sm text-slate-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-white rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl flex-shrink-0">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">
                      {section.title}
                    </h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200"
        >
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                Your Privacy Matters
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                We are committed to protecting your privacy and ensuring the security of your personal information. 
                If you have any questions or concerns about this Privacy Policy or our data handling practices, 
                please do not hesitate to contact our Data Protection Officer.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="px-8"
          >
            Return to Login Page
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage

