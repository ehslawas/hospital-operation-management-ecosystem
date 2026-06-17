'use client';

import React from 'react';
import type { EmergencyPatient, TimelineEvent } from '../types/Patient';

interface PatientTimelineProps {
  patient: EmergencyPatient;
  onClose: () => void;
}

const eventIcons: Record<TimelineEvent['type'], string> = {
  'arrival': '🚑',
  'triage': '🏥',
  'bed-assigned': '🛏️',
  'doctor-assigned': '👨‍⚕️',
  'vitals': '💓',
  'order-placed': '📋',
  'order-completed': '✅',
  'medication-given': '💊',
  'procedure': '🔬',
  'consult': '👥',
  'disposition': '📝',
  'transfer': '➡️',
  'discharge': '🏠',
  'trauma-activation': '🚨',
  'note': '📌',
};

const eventColors: Record<TimelineEvent['type'], string> = {
  'arrival': 'bg-blue-100 text-blue-700 border-blue-300',
  'triage': 'bg-orange-100 text-orange-700 border-orange-300',
  'bed-assigned': 'bg-purple-100 text-purple-700 border-purple-300',
  'doctor-assigned': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  'vitals': 'bg-pink-100 text-pink-700 border-pink-300',
  'order-placed': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'order-completed': 'bg-green-100 text-green-700 border-green-300',
  'medication-given': 'bg-teal-100 text-teal-700 border-teal-300',
  'procedure': 'bg-violet-100 text-violet-700 border-violet-300',
  'consult': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'disposition': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'transfer': 'bg-blue-100 text-blue-700 border-blue-300',
  'discharge': 'bg-green-100 text-green-700 border-green-300',
  'trauma-activation': 'bg-red-100 text-red-700 border-red-300',
  'note': 'bg-gray-100 text-gray-700 border-gray-300',
};

export function PatientTimeline({ patient, onClose }: PatientTimelineProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const sortedTimeline = [...patient.timeline].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Patient Timeline & Audit Log</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{patient.name}</span>
                <span>•</span>
                <span>{patient.registrationNumber}</span>
              </div>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  Complete journey from arrival to disposition
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            {sortedTimeline.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-semibold">No timeline events yet</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-300" />
                
                {/* Timeline events */}
                <div className="space-y-6">
                  {sortedTimeline.map((event, idx) => (
                    <div key={event.id} className="relative flex gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold shadow-lg ${eventColors[event.type]}`}>
                        {eventIcons[event.type]}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-white rounded-lg p-4 shadow-md border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-bold text-slate-900 text-lg">
                              {event.description}
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              {event.actor}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                              {formatTime(event.timestamp)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDateTime(event.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        {event.details && (
                          <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {/* Time since previous event */}
                        {idx > 0 && (
                          <div className="mt-2 text-xs text-slate-500">
                            {(() => {
                              const prevEvent = sortedTimeline[idx - 1];
                              const diff = event.timestamp.getTime() - prevEvent.timestamp.getTime();
                              const minutes = Math.floor(diff / (1000 * 60));
                              return `+${minutes} min from previous event`;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Total Events: <span className="font-semibold">{sortedTimeline.length}</span>
            {sortedTimeline.length > 0 && (
              <>
                <span className="mx-2">•</span>
                Time in Department: <span className="font-semibold">
                  {(() => {
                    const first = sortedTimeline[0];
                    const last = sortedTimeline[sortedTimeline.length - 1];
                    const diff = last.timestamp.getTime() - first.timestamp.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                  })()}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

