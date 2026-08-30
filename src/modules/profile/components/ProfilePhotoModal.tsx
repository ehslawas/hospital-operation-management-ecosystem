// @ts-nocheck
import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Trash2, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Modal, Avatar } from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { updateProfilePhoto, removeProfilePhoto } from '../services/profileService'
import type { UserWithRelations } from '@/types'

interface ProfilePhotoModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithRelations
  onSuccess: (updatedUser: UserWithRelations) => void
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsLoading(false)
      setIsRemoving(false)
    }
  }, [isOpen])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select an image file (PNG, JPG, JPEG, or WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Image size should be less than 5MB.')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSave = async () => {
    if (!selectedFile) return
    setIsLoading(true)

    try {
      const result = await updateProfilePhoto(selectedFile, user.id, user)
      if (result.success && result.user) {
        toast.success('Photo Updated', 'Your profile photo has been successfully updated.')
        onSuccess(result.user)
        onClose()
      } else {
        toast.error('Upload Failed', result.error || 'Could not update profile photo')
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'An unexpected error occurred during upload')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!user.profile_photo_url && !previewUrl) return
    setIsRemoving(true)

    try {
      const result = await removeProfilePhoto(user.id, user)
      if (result.success && result.user) {
        toast.success('Photo Removed', 'Profile photo removed. Default initials will now be displayed.')
        onSuccess(result.user)
        onClose()
      } else {
        toast.error('Failed', result.error || 'Could not remove profile photo')
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'Failed to remove photo')
    } finally {
      setIsRemoving(false)
    }
  }

  const currentDisplayPhoto = previewUrl || user.profile_photo_url

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isLoading && !isRemoving && onClose()}
      title="Change Profile Photo"
      size="md"
    >
      <div className="space-y-6">
        {/* Current & Preview Avatar Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
          <div className="relative mb-4">
            <Avatar
              src={currentDisplayPhoto}
              name={user.full_name}
              size="2xl"
              className="w-28 h-28 text-3xl ring-4 ring-white shadow-md"
            />
            {previewUrl && (
              <span className="absolute bottom-0 right-0 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-full shadow">
                New
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {previewUrl
              ? 'New photo selected. Click "Save Photo" to apply.'
              : user.profile_photo_url
              ? 'Current profile photo'
              : 'No custom photo uploaded yet'}
          </p>
        </div>

        {/* Upload / Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
            dragOver
              ? 'border-primary-500 bg-primary-50/50'
              : 'border-slate-300 hover:border-primary-400 bg-white hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-semibold text-primary-600 hover:underline">
                Click to browse
              </span>{' '}
              <span className="text-sm text-slate-600">or drag and drop your photo</span>
            </div>
            <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG, WEBP up to 5MB</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {(user.profile_photo_url || previewUrl) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isLoading || isRemoving}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRemoving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Remove Photo
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isRemoving}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedFile || isLoading || isRemoving}
              className="px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Photo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ProfilePhotoModal
