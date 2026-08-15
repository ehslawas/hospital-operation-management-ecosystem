// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  X,
  Maximize2,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '@/lib/constants'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button, Modal, Spinner, ConfirmationDialog } from '@/shared/components/ui'
import { useToast } from '@/stores/toastStore'
import { cn, generateId } from '@/shared/lib/utils'

interface Photo {
  id: string
  photo_url: string
  caption: string | null
  created_at: string
  created_by: string
}

interface Album {
  id: string
  name: string
  description: string | null
  created_at: string
  hospital_id: string
}

const AlbumDetailPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success, error, info } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [album, setAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Lightbox state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (albumId) {
      fetchAlbumDetails()
      fetchPhotos()
    }
  }, [albumId])

  const fetchAlbumDetails = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('gallery_albums')
        .select('*')
        .eq('id', albumId)
        .single()

      if (fetchError) throw fetchError
      setAlbum(data)
    } catch (err) {
      console.error('Error fetching album:', err)
      error('Gagal memuatkan butiran album')
      navigate(ROUTES.HUB_GALLERY)
    }
  }

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setPhotos(data)
    } catch (err) {
      console.error('Error fetching photos:', err)
      error('Gagal memuatkan gambar')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user || !album) return

    try {
      setUploading(true)
      const file = files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${generateId()}.${fileExt}`
      const filePath = `${user.hospital_id}/${albumId}/${fileName}`

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath)

      // 3. Insert into Database
      const { error: dbError } = await supabase
        .from('gallery_photos')
        .insert({
          album_id: albumId,
          photo_url: publicUrl,
          storage_path: filePath,
          created_by: user.id
        })

      if (dbError) throw dbError

      // 4. Update Album Cover if it's the first photo
      if (photos.length === 0) {
        await supabase
          .from('gallery_albums')
          .update({ cover_photo_url: publicUrl })
          .eq('id', albumId)
      }

      success('Gambar Dimuatnaik', 'Gambar berjaya ditambah ke album.')
      fetchPhotos()
    } catch (err) {
      console.error('Error uploading photo:', err)
      error('Gagal memuatnaik gambar', 'Sila cuba lagi.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (id: string, storagePath: string) => {
    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([storagePath])

      if (storageError) throw storageError

      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      success('Gambar Dipadam', 'Gambar telah dikeluarkan dari album.')
      setPhotos(photos.filter(p => p.id !== id))
      setIsDeleting(null)
      setSelectedPhotoIndex(null)
    } catch (err) {
      console.error('Error deleting photo:', err)
      error('Gagal memadam gambar')
    }
  }

  const handleNextPhoto = () => {
    if (selectedPhotoIndex === null) return
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length)
  }

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex === null) return
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length)
  }

  if (!album && loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <button 
              onClick={() => navigate(ROUTES.HUB_GALLERY)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali ke Galeri</span>
            </button>
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                {album?.name}
              </h1>
              <p className="text-slate-500 font-medium">{album?.description || 'Tiada keterangan disediakan.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-white text-slate-950 hover:bg-slate-200 rounded-2xl px-6 py-3 flex items-center gap-2 font-bold shadow-xl shadow-white/5 border-none"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span>{uploading ? 'Memuatnaik...' : 'Tambah Gambar'}</span>
            </Button>
          </div>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-square bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedPhotoIndex(index)}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 cursor-pointer bg-slate-900"
              >
                <img 
                  src={photo.photo_url} 
                  alt={photo.caption || 'Photo'} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-8 h-8 text-white/70" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-8 bg-slate-900/50 rounded-full border border-slate-800 text-slate-700 mb-6">
              <ImageIcon className="w-20 h-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">Belum ada gambar</h3>
            <p className="text-slate-500 mb-8 max-w-xs">Album ini kosong. Mula muatnaik gambar untuk menghidupkannya.</p>
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl px-8"
            >
              Muatnaik Sekarang
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <span className="text-slate-500 font-mono text-sm">
                  {selectedPhotoIndex + 1} / {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsDeleting(photos[selectedPhotoIndex].id)}
                  className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Padam Gambar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <a 
                  href={photos[selectedPhotoIndex].photo_url} 
                  download 
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  title="Muat Turun"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Lightbox Content */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-12">
              <button 
                onClick={handlePrevPhoto}
                className="absolute left-4 md:left-8 p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <motion.img
                key={photos[selectedPhotoIndex].id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                src={photos[selectedPhotoIndex].photo_url}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />

              <button 
                onClick={handleNextPhoto}
                className="absolute right-4 md:right-8 p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Lightbox Footer */}
            <div className="p-8 text-center bg-gradient-to-t from-slate-950 to-transparent">
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                Dimuatnaik pada {new Date(photos[selectedPhotoIndex].created_at).toLocaleDateString('ms-MY', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleting !== null}
        onClose={() => setIsDeleting(null)}
        onConfirm={() => {
          const photo = photos.find(p => p.id === isDeleting)
          if (photo) handleDeletePhoto(photo.id, (photo as any).storage_path)
        }}
        title="Delete Photo?"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
      />
    </div>
  )
}

export default AlbumDetailPage
