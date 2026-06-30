// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { AlertTriangle, MapPin, Plus, Thermometer, Building2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Badge, Button } from '@/components/ui'
import { getStockLocations } from '@/services/pharmacy/inventoryService'
import type { StockLocation, LocationType, TemperatureRequirement } from '@/types/pharmacy'

export const StockLocationPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [locations, setLocations] = useState<StockLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hospitalId) return

    const load = async () => {
      setIsLoading(true)
      setError(null)

      const res = await getStockLocations(hospitalId)

      if (res.error) {
        setError(res.error)
        setLocations([])
      } else {
        setLocations(res.data || [])
      }

      setIsLoading(false)
    }

    void load()
  }, [hospitalId])

  const renderLocationTypeBadge = (type: LocationType) => {
    const map: Record<LocationType, { color: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
      warehouse: { color: 'info', label: 'Warehouse' },
      pharmacy: { color: 'success', label: 'Pharmacy' },
      ward: { color: 'warning', label: 'Ward' },
      cold_room: { color: 'secondary', label: 'Cold Room' },
      controlled: { color: 'error', label: 'Controlled' },
    }
    const cfg = map[type] || { color: 'secondary', label: type }
    return <Badge variant={cfg.color}>{cfg.label}</Badge>
  }

  const renderTemperatureBadge = (temp?: TemperatureRequirement) => {
    if (!temp) return <span className="text-gray-400 text-xs">—</span>
    const map: Record<TemperatureRequirement, { color: string; label: string }> = {
      ambient: { color: 'bg-green-100 text-green-700', label: 'Ambient' },
      '2-8C': { color: 'bg-blue-100 text-blue-700', label: '2-8°C' },
      '-20C': { color: 'bg-cyan-100 text-cyan-700', label: '-20°C' },
      '-80C': { color: 'bg-indigo-100 text-indigo-700', label: '-80°C' },
    }
    const cfg = map[temp] || { color: 'bg-gray-100 text-gray-700', label: temp }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
        {cfg.label}
      </span>
    )
  }

  // Group locations by type for summary
  const locationsByType = locations.reduce((acc, loc) => {
    acc[loc.location_type] = (acc[loc.location_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-violet-600" />
            Stock Locations
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage storage locations for drugs and non-drug items.
          </p>
        </div>

        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Location
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <span className="text-sm font-medium text-violet-700">Total Locations</span>
          <p className="text-2xl font-bold text-violet-800 mt-1">{locations.length}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <span className="text-sm font-medium text-blue-700">Warehouses</span>
          <p className="text-2xl font-bold text-blue-800 mt-1">{locationsByType['warehouse'] || 0}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-sm font-medium text-green-700">Pharmacies</span>
          <p className="text-2xl font-bold text-green-800 mt-1">{locationsByType['pharmacy'] || 0}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-sm font-medium text-amber-700">Wards</span>
          <p className="text-2xl font-bold text-amber-800 mt-1">{locationsByType['ward'] || 0}</p>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
          <span className="text-sm font-medium text-cyan-700">Cold Rooms</span>
          <p className="text-2xl font-bold text-cyan-800 mt-1">{locationsByType['cold_room'] || 0}</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load locations</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Cell as="th">Code</Table.Cell>
                <Table.Cell as="th">Location Name</Table.Cell>
                <Table.Cell as="th">Type</Table.Cell>
                <Table.Cell as="th">Temperature</Table.Cell>
                <Table.Cell as="th" className="text-right">Capacity</Table.Cell>
                <Table.Cell as="th" className="text-center">Status</Table.Cell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {locations.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                    No stock locations configured. Add your first location to get started.
                  </Table.Cell>
                </Table.Row>
              )}

              {locations.map((location) => (
                <Table.Row key={location.id}>
                  <Table.Cell className="font-mono text-xs text-gray-700">
                    {location.location_code}
                  </Table.Cell>
                  <Table.Cell className="text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {location.location_name}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {renderLocationTypeBadge(location.location_type)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-gray-400" />
                      {renderTemperatureBadge(location.temperature_required)}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-right text-sm text-gray-600">
                    {location.capacity ? `${location.capacity} units` : '—'}
                  </Table.Cell>
                  <Table.Cell className="text-center">
                    {location.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <h3 className="font-medium text-violet-800 mb-2">📍 Location Types</h3>
        <ul className="text-sm text-violet-700 space-y-1 list-disc list-inside">
          <li><strong>Warehouse:</strong> Main storage facility for bulk inventory</li>
          <li><strong>Pharmacy:</strong> Dispensing locations (main, satellite, outpatient)</li>
          <li><strong>Ward:</strong> Ward-level stock for immediate patient care</li>
          <li><strong>Cold Room:</strong> Temperature-controlled storage (2-8°C, -20°C, -80°C)</li>
          <li><strong>Controlled:</strong> Secure storage for scheduled/controlled substances</li>
        </ul>
      </div>
    </div>
  )
}

export default StockLocationPage

