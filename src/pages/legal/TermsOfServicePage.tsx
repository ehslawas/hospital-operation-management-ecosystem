import React from 'react'
import { motion } from 'framer-motion'
import { FileText, AlertTriangle, CheckCircle, Shield, Users, Ban } from 'lucide-react'
import { Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

export const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate()

  const sections = [
    {
      icon: FileText,
      title: '1. Acceptance of Terms',
      content: `By accessing and using the Hospital Operation Management Ecosystem (HOME) system, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and the Ministry of Health Malaysia (MOH).

If you do not agree to these terms, you must not access or use the HOME system.`,
    },
    {
      icon: Users,
      title: '2. System Access and Authorization',
      content: `Access to the HOME system is granted solely to authorized personnel of the Ministry of Health Malaysia and affiliated healthcare facilities. 

- System access is granted based on your role and responsibilities within the healthcare organization
- You are responsible for maintaining the confidentiality of your login credentials
- You must not share your account credentials with any other person
- You must immediately report any unauthorized access or security breaches
- MOH reserves the right to suspend or terminate access at any time for security or policy violations`,
    },
    {
      icon: Shield,
      title: '3. Acceptable Use Policy',
      content: `You agree to use the HOME system only for legitimate healthcare operations and administrative purposes. Prohibited activities include:

- Unauthorized access to data or systems
- Attempting to breach system security
- Sharing confidential patient or operational information outside authorized channels
- Using the system for personal gain or commercial purposes
- Introducing malware, viruses, or harmful code
- Interfering with system operations or other users' access
- Violating any applicable laws or regulations`,
    },
    {
      icon: AlertTriangle,
      title: '4. Data Accuracy and Responsibility',
      content: `Users are responsible for:

- Ensuring the accuracy and completeness of data entered into the system
- Verifying information before submission
- Reporting errors or discrepancies immediately
- Maintaining data integrity in accordance with MOH guidelines
- Complying with healthcare data standards and regulations

MOH is not liable for errors resulting from incorrect data entry by users.`,
    },
    {
      icon: Shield,
      title: '5. Confidentiality and Privacy',
      content: `All users must maintain strict confidentiality regarding:

- Patient information and medical records
- Employee personal data
- System configurations and security measures
- Operational procedures and protocols
- Any other confidential information accessed through the system

Breach of confidentiality may result in disciplinary action and legal consequences.`,
    },
    {
      icon: CheckCircle,
      title: '6. System Availability and Maintenance',
      content: `MOH strives to ensure system availability but does not guarantee uninterrupted access. The system may be unavailable due to:

- Scheduled maintenance and updates
- Emergency repairs or security patches
- Technical issues or system failures
- Network or infrastructure problems

MOH is not liable for any losses or damages resulting from system unavailability.`,
    },
    {
      icon: Ban,
      title: '7. Prohibited Conduct',
      content: `The following conduct is strictly prohibited:

- Unauthorized modification of system data or settings
- Attempting to reverse engineer or decompile system components
- Creating false accounts or impersonating other users
- Collecting or harvesting user information without authorization
- Using automated tools or scripts to access the system
- Engaging in any activity that compromises system security or integrity`,
    },
    {
      icon: FileText,
      title: '8. Intellectual Property',
      content: `All content, software, and materials within the HOME system are the property of the Ministry of Health Malaysia and are protected by copyright and other intellectual property laws.

- You may not copy, reproduce, or distribute system content without authorization
- You may not create derivative works based on system materials
- All rights are reserved by MOH`,
    },
    {
      icon: AlertTriangle,
      title: '9. Limitation of Liability',
      content: `To the maximum extent permitted by law:

- MOH provides the HOME system "as is" without warranties
- MOH is not liable for indirect, incidental, or consequential damages
- MOH's total liability is limited to the extent permitted by Malaysian law
- Users assume responsibility for their use of the system`,
    },
    {
      icon: CheckCircle,
      title: '10. Termination of Access',
      content: `MOH reserves the right to suspend or terminate your access to the HOME system:

- Immediately, for security violations or policy breaches
- Upon termination of employment or role change
- For non-compliance with these Terms of Service
- At any time, with or without notice, at MOH's discretion

Upon termination, you must immediately cease all use of the system.`,
    },
    {
      icon: FileText,
      title: '11. Changes to Terms',
      content: `MOH reserves the right to modify these Terms of Service at any time. Changes will be communicated through the system or official channels. Continued use of the system after changes constitutes acceptance of the modified terms.`,
    },
    {
      icon: Shield,
      title: '12. Governing Law',
      content: `These Terms of Service are governed by the laws of Malaysia. Any disputes arising from these terms or use of the system shall be subject to the exclusive jurisdiction of Malaysian courts.`,
    },
    {
      icon: Users,
      title: '13. Contact and Support',
      content: `For questions, concerns, or support regarding these Terms of Service or the HOME system:

Ministry of Health Malaysia
System Administrator
Email: support@moh.gov.my
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
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara Malaysia"
              className="w-24 h-24 object-contain drop-shadow-2xl"
            />
            <div className="flex-1">
              <h1 className="text-3xl xl:text-4xl font-bold text-white mb-2">
                Terms of Service
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
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Terms and Conditions of Use
              </h2>
              <p className="text-slate-700 leading-relaxed text-lg">
                These Terms of Service govern your access to and use of the Hospital Operation Management Ecosystem (HOME) system, 
                operated by the Ministry of Health Malaysia. Please read these terms carefully before using the system.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border-l-4 border-amber-500">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> By accessing and using the HOME system, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms of Service. Violation of these terms may result in 
                immediate termination of access and potential legal action.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border-l-4 border-slate-400">
            <p className="text-sm text-slate-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Terms Sections */}
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
          transition={{ delay: 1.3 }}
          className="mt-12 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200"
        >
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                Compliance and Responsibility
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                All users are expected to comply with these Terms of Service and all applicable laws and regulations. 
                Failure to comply may result in disciplinary action, termination of access, and potential legal consequences. 
                If you have questions about these terms, please contact the system administrator.
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

export default TermsOfServicePage

