import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Loader2, Camera, Upload, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import * as userService from '@/services/userService'
import { uploadFile } from '@/services/supabase'

interface ProfileEditModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user, setUser } = useAuthStore()
    const toast = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        employee_id: '',
        ic_number: '',
        phone_number: '',
        address: '',
        date_of_birth: '',
        gender: '' as 'male' | 'female' | ''
    })

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                employee_id: user.employee_id || '',
                ic_number: user.ic_number || '',
                phone_number: user.phone_number || '',
                address: user.address || '',
                date_of_birth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
                gender: user.gender || ''
            })
            setPhotoPreview(user.profile_photo_url || null)
            setSelectedFile(null)
        }
    }, [isOpen, user])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Invalid File', 'Please upload an image file (JPG, PNG, WEBP)')
                return
            }
            // Validate file size (e.g. 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File too large', 'Image size should be less than 5MB')
                return
            }

            setSelectedFile(file)
            setPhotoPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)
        try {
            let profilePhotoUrl = user.profile_photo_url

            // Upload new photo if selected
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}.${fileExt}`
                const bucketName = 'avatars'

                // Attempt upload
                const { url, error } = await uploadFile(bucketName, fileName, selectedFile)

                if (error) {
                    console.error('Photo upload failed:', error)
                    toast.error('Upload Failed', 'Failed to upload profile photo. Please try again.')
                    setIsLoading(false)
                    return
                }

                if (url) {
                    profilePhotoUrl = url
                }
            }

            // Update User Data
            const updatedUser = await userService.updateUser(user.id, {
                full_name: formData.full_name,
                email: formData.email,
                employee_id: formData.employee_id,
                ic_number: formData.ic_number,
                phone_number: formData.phone_number,
                address: formData.address,
                date_of_birth: formData.date_of_birth || undefined,
                gender: formData.gender as 'male' | 'female' | undefined,
                profile_photo_url: profilePhotoUrl
            })

            // Update Auth State
            setUser(updatedUser)

            toast.success('Profile Updated', 'Your profile has been updated successfully.')
            if (onSuccess) onSuccess()
            onClose()
        } catch (error) {
            console.error('Failed to update profile:', error)
            toast.error('Update Failed', 'Could not save your changes. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                                <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-white hover:shadow-sm transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                {/* Profile Photo Section */}
                                <div className="flex flex-col items-center">
                                    <div className="relative group">
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
                                            {photoPreview ? (
                                                <img
                                                    src={photoPreview}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <UserIcon className="w-12 h-12" />
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </div>

                                        {/* Edit Button Badge */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-1 right-1 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors border-2 border-white"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/webp"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 font-medium">Click to change profile photo</p>
                                </div>

                                {/* Personal Details */}
                                <div className="space-y-5">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                            Personal Information
                                        </label>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                    placeholder="Enter your full name"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                    placeholder="john@example.com"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Employee ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.employee_id}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                    placeholder="EMP12345"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    IC Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.ic_number}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, ic_number: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                    placeholder="900101-12-1234"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Date of Birth
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.date_of_birth}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Gender
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.gender}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 appearance-none"
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Details */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                            Contact Details
                                        </label>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone_number}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                    placeholder="+60..."
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Address
                                                </label>
                                                <textarea
                                                    value={formData.address}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                                                    placeholder="Enter your full address"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm shadow-primary-600/20 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:translate-y-[-1px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
