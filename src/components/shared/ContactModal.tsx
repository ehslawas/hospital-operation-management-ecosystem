// @ts-nocheck
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, Bot, X, Send, Phone, MapPin } from 'lucide-react'
import { Modal, Button, Input, Textarea } from '@/components/ui'
import { InquiryForm } from '@/components/forms'
import { cn } from '@/lib/utils'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'inquiry' | 'email' | 'chat'

const tabs = [
  { id: 'inquiry' as Tab, label: 'Inquiry Form', icon: MessageSquare },
  { id: 'email' as Tab, label: 'Email Us', icon: Mail },
  { id: 'chat' as Tab, label: 'AI Assistant', icon: Bot },
]

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('inquiry')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m the HOME AI Assistant. How can I help you today? You can ask me about system access, features, or general inquiries.',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

  const handleSendChat = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsChatLoading(true)

    // Simulate AI response (in production, this would call an AI API)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const responses: Record<string, string> = {
      access: 'To request access to the HOME system, please click on "Request Access" on the login page and fill out the registration form. Once submitted, your request will be reviewed by the hospital administrator.',
      password: 'If you forgot your password, click on "Forgot Password?" on the login page. Enter your email address and we will send you reset instructions.',
      features: 'The HOME system includes: User Management, Pharmacy Logistics, Inventory Management, Procurement, and more modules coming soon!',
      contact: 'You can reach our support team via email at support@home.gov.my or call us at 03-2615-5555 during office hours (8am-5pm, Monday-Friday).',
    }

    let response = 'I appreciate your question. For specific technical issues or account-related queries, please submit an inquiry through the form or contact our support team directly. Is there anything else I can help with?'
    
    const lowerMessage = userMessage.toLowerCase()
    if (lowerMessage.includes('access') || lowerMessage.includes('register')) {
      response = responses.access
    } else if (lowerMessage.includes('password') || lowerMessage.includes('forgot')) {
      response = responses.password
    } else if (lowerMessage.includes('feature') || lowerMessage.includes('module')) {
      response = responses.features
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('support')) {
      response = responses.contact
    }

    setChatMessages((prev) => [...prev, { role: 'assistant', content: response }])
    setIsChatLoading(false)
  }

  const renderInquiryTab = () => (
    <InquiryForm onSuccess={() => {}} />
  )

  const renderEmailTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Contact Us via Email
        </h3>
        <p className="text-sm text-gray-600">
          For urgent matters, please email us directly
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Mail className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">General Inquiries</p>
            <a href="mailto:info@home.gov.my" className="text-sm text-primary-600 hover:underline">
              info@home.gov.my
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Mail className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Technical Support</p>
            <a href="mailto:support@home.gov.my" className="text-sm text-primary-600 hover:underline">
              support@home.gov.my
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Phone className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Hotline</p>
            <a href="tel:+60326155555" className="text-sm text-primary-600 hover:underline">
              +603-2615-5555
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
          <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Address</p>
            <p className="text-sm text-gray-600">
              Ministry of Health Malaysia<br />
              Level 1, Block E1, Parcel E<br />
              62590 Putrajaya, Malaysia
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderChatTab = () => (
    <div className="flex flex-col h-[400px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        <AnimatePresence mode="popLayout">
          {chatMessages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] px-4 py-3 rounded-2xl text-sm',
                  message.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                )}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
          {isChatLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Input */}
      <div className="flex gap-2">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type your question..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendChat()
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={handleSendChat}
          disabled={!chatInput.trim() || isChatLoading}
          className="px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        AI responses are for general guidance only
      </p>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contact Us"
      description="Get in touch with our support team"
      size="lg"
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'inquiry' && renderInquiryTab()}
        {activeTab === 'email' && renderEmailTab()}
        {activeTab === 'chat' && renderChatTab()}
      </div>
    </Modal>
  )
}

export default ContactModal

