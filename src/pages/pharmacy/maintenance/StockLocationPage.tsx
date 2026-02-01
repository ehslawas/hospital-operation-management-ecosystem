import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import {
  Building2,
  MapPin,
  Plus,
  Thermometer,
  AlertTriangle,
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Search,
  RefreshCw
} from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import {
  Button,
  Badge,
  Spinner,
  Table,
} from '@/components/ui'
import { StandardPageLayout } from '@/components/layouts/StandardPageLayout'
import { getStockLocations, buildLocationTree } from '@/services/pharmacy/maintenanceService'
import type { StockLocation, StockLocationWithRelations, LocationType, TemperatureRequirement } from '@/types/pharmacy'
import { AddLocationModal } from './modals/AddLocationModal'
import { StockLocationDetailModal } from './modals/StockLocationDetailModal'

export const StockLocationPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [locations, setLocations] = useState<StockLocation[]>([])
  const [locationTree, setLocationTree] = useState<StockLocationWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<StockLocation | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [parentIdForAdd, setParentIdForAdd] = useState<string | undefined>(undefined)

  const loadLocations = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)

    const res = await getStockLocations(hospitalId)

    if (res.error) {
      setError(res.error)
      setLocations([])
      setLocationTree([])
    } else {
      const data = res.data || []
      setLocations(data)
      const tree = buildLocationTree(data)
      setLocationTree(tree)

      // Auto-expand first level by default if hierarchy is simplified
      if (expandedIds.size === 0 && tree.length > 0) {
        setExpandedIds(new Set(tree.map(node => node.id)))
      }
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (!isSessionReady || !hospitalId) return
    void loadLocations()
  }, [isSessionReady, hospitalId])

  const renderLocationTypeBadge = (type: LocationType) => {
    const map: Record<LocationType, { color: 'success' | 'warning' | 'error' | 'info' | 'gray'; label: string }> = {
      warehouse: { color: 'info', label: 'Warehouse' },
      pharmacy: { color: 'success', label: 'Pharmacy' },
      ward: { color: 'warning', label: 'Ward' },
      cold_room: { color: 'gray', label: 'Cold Room' },
      controlled: { color: 'error', label: 'Controlled' },
      unit: { color: 'info', label: 'Unit' },
      store: { color: 'success', label: 'Store' },
      zone: { color: 'warning', label: 'Zone' },
      fridge: { color: 'info', label: 'Fridge' },
      shelf: { color: 'gray', label: 'Shelf' },
      bin: { color: 'gray', label: 'Bin' },
    }
    const cfg = map[type] || { color: 'gray', label: type }
    return <Badge variant={cfg.color} className="font-semibold">{cfg.label}</Badge>
  }

  const renderTemperatureBadge = (temp?: TemperatureRequirement) => {
    if (!temp) return <span className="text-gray-300 text-xs">—</span>
    const map: Record<TemperatureRequirement, { color: string; label: string }> = {
      ambient: { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Ambient' },
      '2-8C': { color: 'bg-blue-50 text-blue-700 border-blue-100', label: '2-8°C' },
      '-20C': { color: 'bg-cyan-50 text-cyan-700 border-cyan-100', label: '-20°C' },
      '-80C': { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: '-80°C' },
    }
    const cfg = map[temp] || { color: 'bg-gray-50 text-gray-700 border-gray-100', label: temp }
    return (
      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
        {cfg.label}
      </span>
    )
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedIds(next)
  }

  const renderLocationRow = (location: StockLocationWithRelations, depth: number) => {
    const isExpanded = expandedIds.has(location.id)
    const hasChildren = location.children && location.children.length > 0
    const isSelected = selectedLocation?.id === location.id

    return (
      <React.Fragment key={location.id}>
        <Table.Row
          className={`
                        group transition-all duration-200 
                        ${depth > 0 ? 'bg-gray-50/20' : 'bg-white'} 
                        ${isSelected ? 'bg-teal-50/30' : ''}
                        hover:bg-teal-50/20
                    `}
        >
          <Table.Cell className="py-3 px-6">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${depth * 1.5}rem` }}
            >
              <div className="flex items-center">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(location.id)}
                    className="p-1 hover:bg-white rounded shadow-sm border border-transparent hover:border-gray-200 transition-all"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 flex justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                  </div>
                )}

                <button
                  onClick={() => navigate(ROUTES.PHARMACY_STOCK_LOCATION_ITEMS.replace(':id', location.id))}
                  className="flex items-center gap-2.5 text-gray-900 hover:text-teal-600 transition-colors group/link cursor-pointer text-left ml-1"
                >
                  <div className={`
                                        p-1.5 rounded-lg transition-colors
                                        ${location.location_type === 'fridge' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-500'}
                                        group-hover/link:bg-teal-50 group-hover/link:text-teal-600
                                    `}>
                    {location.location_type === 'fridge' ? (
                      <Thermometer className="w-3.5 h-3.5" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="font-semibold text-sm group-hover/link:underline decoration-teal-200 underline-offset-4 tracking-tight">
                    {location.location_name}
                  </span>
                </button>
              </div>
            </div>
          </Table.Cell>
          <Table.Cell className="py-3 px-6 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
            {location.location_code || 'NO-CODE'}
          </Table.Cell>
          <Table.Cell className="py-3 px-6">
            {renderLocationTypeBadge(location.location_type)}
          </Table.Cell>
          <Table.Cell className="py-3 px-6">
            {renderTemperatureBadge(location.temperature_required)}
          </Table.Cell>
          <Table.Cell className="py-3 px-6 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-teal-50 hover:text-teal-600"
                title="Add Sub-location"
                onClick={() => {
                  setParentIdForAdd(location.id)
                  setIsAddModalOpen(true)
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-teal-50 hover:text-teal-600"
                onClick={() => {
                  setSelectedLocation(location)
                  setIsDetailModalOpen(true)
                }}
              >
                <Settings className="w-3 h-3" />
                Setup
              </Button>
            </div>
          </Table.Cell>
        </Table.Row>
        {isExpanded && location.children?.map(child => renderLocationRow(child, depth + 1))}
      </React.Fragment>
    )
  }

  const breadcrumbs = [
    { label: 'Pharmacy', href: '/pharmacy' },
    { label: 'Maintenance', href: '/pharmacy/maintenance' },
    { label: 'Stock Locations' }
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex items-center gap-2 border-gray-200"
        onClick={loadLocations}
        disabled={isLoading}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        Reload
      </Button>
      <Button
        size="sm"
        className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2"
        onClick={() => {
          setParentIdForAdd(undefined)
          setIsAddModalOpen(true)
        }}
      >
        <Plus className="w-4 h-4" />
        New Root
      </Button>
    </div>
  )

  return (
    <StandardPageLayout
      title="Stock Locations"
      description="Manage and organize storage hierarchy for all medical supplies."
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-teal-200 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{locations.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Warehouses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{locations.filter(l => l.location_type === 'warehouse').length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stores</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{locations.filter(l => l.location_type === 'store').length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Thermometer className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fridges</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{locations.filter(l => l.location_type === 'fridge').length}</p>
        </div>
      </div>

      {/* Error Message */}
      {!isLoading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 text-sm text-rose-700 animate-in slide-in-from-top-2 duration-300 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-rose-900">Connection Error</p>
            <p className="text-rose-700/80 leading-relaxed">{error}</p>
            <Button
              variant="link"
              size="sm"
              className="text-rose-600 hover:text-rose-800 p-0 h-auto font-bold underline underline-offset-4"
              onClick={loadLocations}
            >
              Try refreshing the data
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <Spinner size="lg" className="text-teal-600 mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Building location hierarchy...</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1">
              <Table>
                <Table.Head className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100">
                  <Table.Row className="hover:bg-transparent border-none">
                    <Table.Cell as="th" className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Storage Hierarchy / Location Name
                    </Table.Cell>
                    <Table.Cell as="th" className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Code
                    </Table.Cell>
                    <Table.Cell as="th" className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Type
                    </Table.Cell>
                    <Table.Cell as="th" className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Storage Condition
                    </Table.Cell>
                    <Table.Cell as="th" className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {locationTree.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-gray-300" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-900 font-bold text-lg">No locations found</p>
                            <p className="text-gray-500 max-w-xs mx-auto">Build your storage structure by adding a root location first.</p>
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 bg-teal-600 hover:bg-teal-700"
                            onClick={() => {
                              setParentIdForAdd(undefined)
                              setIsAddModalOpen(true)
                            }}
                          >
                            Add First Location
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    locationTree.map((location) => renderLocationRow(location, 0))
                  )}
                </Table.Body>
              </Table>
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-900">{locations.length}</span> total physical storage points mapped across hierarchy.
              </p>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" /> Ambient
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" /> Cold Storage
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          void loadLocations()
        }}
        parentId={parentIdForAdd}
      />

      <StockLocationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        location={selectedLocation}
        onSuccess={() => {
          void loadLocations()
        }}
      />
    </StandardPageLayout>
  )
}

export default StockLocationPage


