'use client';

import type { RadiologyEquipment } from '../types/Radiology';

interface EquipmentStatusProps {
  equipment: RadiologyEquipment[];
}

export function EquipmentStatus({ equipment }: EquipmentStatusProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      operational: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      offline: 'bg-red-100 text-red-800 border-red-200',
      calibration: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  const getModalityIcon = (modality: string) => {
    const icons = {
      'X-Ray': '🔬',
      CT: '🖥️',
      MRI: '🧲',
      Ultrasound: '📡',
      Mammography: '🩺',
      Fluoroscopy: '📹',
    };
    return icons[modality as keyof typeof icons] || '🏥';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Equipment Status
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {equipment.filter((e) => e.status === 'operational').length} operational •{' '}
          {equipment.filter((e) => e.status !== 'operational').length} unavailable
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((eq) => (
            <div
              key={eq.id}
              className={`border-2 rounded-lg p-4 transition-all ${getStatusColor(eq.status)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getModalityIcon(eq.modality)}</span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {eq.equipmentName}
                    </h4>
                    <p className="text-xs text-gray-600">{eq.room}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    eq.status === 'operational'
                      ? 'bg-green-600 text-white'
                      : eq.status === 'maintenance'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {eq.status === 'operational' && '✓ Online'}
                  {eq.status === 'maintenance' && '🔧 Maint.'}
                  {eq.status === 'offline' && '✗ Offline'}
                  {eq.status === 'calibration' && '⚙️ Calib.'}
                </span>
              </div>

              {/* Equipment Info */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-600">
                  {eq.manufacturer} {eq.model}
                </p>
              </div>

              {/* Usage Today */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Today's Studies</span>
                  <span className="text-sm font-bold text-gray-900">
                    {eq.totalStudiesToday}
                  </span>
                </div>
                {eq.currentlyInUse && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-800 font-semibold">
                      🔄 Currently in use
                    </p>
                    {eq.currentStudy && (
                      <p className="text-xs text-green-700 mt-0.5">
                        {eq.currentStudy}
                      </p>
                    )}
                    {eq.estimatedCompletionTime && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Est. completion:{' '}
                        {new Date(eq.estimatedCompletionTime).toLocaleTimeString(
                          'en-MY',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Issues */}
              {eq.hasIssues && eq.issues && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-800 mb-1">
                    ⚠️ Issues:
                  </p>
                  {eq.issues.map((issue, idx) => (
                    <p key={idx} className="text-xs text-red-700">
                      • {issue}
                    </p>
                  ))}
                  {eq.notes && (
                    <p className="text-xs text-red-600 mt-1 italic">{eq.notes}</p>
                  )}
                </div>
              )}

              {/* Maintenance Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Next Maintenance:</span>
                  <span className="font-medium">
                    {new Date(eq.nextMaintenanceDate).toLocaleDateString('en-MY', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next Calibration:</span>
                  <span className="font-medium">
                    {new Date(eq.nextCalibrationDate).toLocaleDateString('en-MY', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}








