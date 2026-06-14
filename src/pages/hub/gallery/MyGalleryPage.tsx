import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  FolderOpen,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../../lib/constants'
import { supabase } from '../../../services/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { Button } from '../../../components/ui/button'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/input'
import { useToast } from '../../../stores/toastStore'

interface Album {
  id: string
  name: string
  description: string | null
  cover_photo_url: string | null
  created_at: string
  created_by: string
  photo_count?: number
}

const MyGalleryPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success, error } = useToast()
  
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDesc, setNewAlbumDesc] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchAlbums()
  }, [user])

  const fetchAlbums = async () => {
    if (!user?.hospital_id) return
    
    try {
      setLoading(true)
      
      const { data, error: fetchError } = await supabase
        .from('gallery_albums')
        .select(`
          *,
          gallery_photos (id)
        `)
        .eq('hospital_id', user.hospital_id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const formattedAlbums = data.map((album: any) => ({
        ...album,
        photo_count: album.gallery_photos?.length || 0
      }))

      setAlbums(formattedAlbums)
    } catch (err) {
      console.error('Error fetching albums:', err)
      error('Gagal memuatkan album', 'Sila cuba lagi sebentar.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlbumName.trim() || !user) return

    try {
      setIsCreating(true)
      const { error: createError } = await supabase
        .from('gallery_albums')
        .insert({
          hospital_id: user.hospital_id,
          name: newAlbumName,
          description: newAlbumDesc,
          created_by: user.id
        })

      if (createError) throw createError

      success('Album Berjaya Dicipta', `Album "${newAlbumName}" telah dicipta.`)
      setIsCreateModalOpen(false)
      setNewAlbumName('')
      setNewAlbumDesc('')
      fetchAlbums()
    } catch (err) {
      console.error('Error creating album:', err)
      error('Gagal mencipta album', 'Sila cuba lagi.')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredAlbums = albums.filter(album => 
    album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (album.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <button 
              onClick={() => navigate(ROUTES.HUB)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali ke Hub Utama</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">MyGallery</h1>
                <p className="text-slate-400">Susun dan kongsi momen hospital anda</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="Cari album..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all w-64 backdrop-blur-sm"
              />
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Album Baru</span>
            </Button>
          </div>
        </div>

        {/* Albums Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800" />
            ))}
          </div>
        ) : filteredAlbums.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredAlbums.map((album) => (
                <motion.div
                  key={album.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate(`${ROUTES.HUB_GALLERY}/${album.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors shadow-2xl">
                    {album.cover_photo_url ? (
                      <img 
                        src={album.cover_photo_url} 
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-700 group-hover:text-indigo-400 transition-colors">
                        <FolderOpen className="w-12 h-12" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Tiada Gambar</span>
                      </div>
                    )}
                    
                    {/* Overlay Info */}
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-300 transition-colors truncate">{album.name}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                            <ImageIcon className="w-3 h-3" />
                            {album.photo_count} gambar
                          </p>
                        </div>
                        <div className="ml-3 p-2 bg-indigo-500/20 text-indigo-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
              <div className="relative p-8 bg-slate-900/50 rounded-full border border-slate-800 text-slate-700 backdrop-blur-xl">
                <FolderOpen className="w-20 h-20" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-200">Tiada Album Dijumpai</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Mula dengan mencipta album pertama anda untuk menyimpan kenangan hospital.</p>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-xl shadow-indigo-500/20 transition-all border-none"
            >
              Cipta Album Sekarang
            </Button>
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Cipta Album Baru"
      >
        <form onSubmit={handleCreateAlbum} className="space-y-6 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-400 ml-1">Nama Album</label>
            <Input 
              placeholder="Cth: Program Derma Darah 2024"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              required
              className="bg-slate-900/50 border-slate-800 focus:ring-indigo-500/50 h-12 rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-400 ml-1">Keterangan (Pilihan)</label>
            <textarea 
              placeholder="Sedikit info tentang album ini..."
              value={newAlbumDesc}
              onChange={(e) => setNewAlbumDesc(e.target.value)}
              className="w-full min-h-[120px] px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
              className="border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl px-6"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !newAlbumName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 min-w-[140px] border-none shadow-lg shadow-indigo-500/20"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mencipta...</span>
                </div>
              ) : 'Simpan Album'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MyGalleryPage
