'use client';

import React, { useState } from 'react';
import type { Mother } from '../types/Maternity';

interface MotherDetailsModalProps {
  mother: Mother;
  onClose: () => void;
}

export function MotherDetailsModal({ mother, onClose }: MotherDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'partograph' | 'delivery' | 'newborn'>('overview');
  
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-MY', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{mother.name}</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{mother.age}y • IC: {mother.icNumber}</span>
                <span>{mother.registrationNumber}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {mother.gestationalAge} (EDD: {new Date(mother.edd).toLocaleDateString('en-MY')})
                </span>
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  G{mother.gravida} P{mother.para}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  mother.riskLevel === 'high' ? 'bg-red-500' :
                  mother.riskLevel === 'moderate' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  {mother.riskLevel.toUpperCase()} RISK
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
        
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex gap-1 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              ...(mother.labour ? [{ id: 'partograph', label: 'Partograph' }] : []),
              ...(mother.delivery ? [{ id: 'delivery', label: 'Delivery Record' }] : []),
              ...(mother.delivery?.newborn ? [{ id: 'newborn', label: 'Newborn' }] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Patient Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Blood Type:</span>
                      <span className="font-semibold text-slate-900">{mother.bloodType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Contact:</span>
                      <span className="font-semibold text-slate-900">{mother.contactNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bed:</span>
                      <span className="font-semibold text-slate-900">{mother.bedNumber || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Midwife:</span>
                      <span className="font-semibold text-slate-900">{mother.assignedMidwife || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Doctor:</span>
                      <span className="font-semibold text-slate-900">{mother.assignedDoctor || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Pregnancy History</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gravida:</span>
                      <span className="font-semibold text-slate-900">{mother.gravida}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Para:</span>
                      <span className="font-semibold text-slate-900">{mother.para}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Abortions:</span>
                      <span className="font-semibold text-slate-900">{mother.abortions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Living Children:</span>
                      <span className="font-semibold text-slate-900">{mother.livingChildren}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">LMP:</span>
                      <span className="font-semibold text-slate-900">{new Date(mother.lmp).toLocaleDateString('en-MY')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">EDD:</span>
                      <span className="font-semibold text-slate-900">{new Date(mother.edd).toLocaleDateString('en-MY')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Risk Factors */}
              {mother.riskFactors.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Risk Factors</h3>
                  <div className="flex flex-wrap gap-2">
                    {mother.riskFactors.map((risk, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm font-semibold border border-red-300">
                        ⚠️ {risk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Medical Conditions */}
              {mother.medicalConditions.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Medical Conditions</h3>
                  <ul className="space-y-1">
                    {mother.medicalConditions.map((condition, idx) => (
                      <li key={idx} className="text-sm text-slate-700">• {condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Allergies */}
              {mother.allergies.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Allergies</h3>
                  <div className="flex flex-wrap gap-2">
                    {mother.allergies.map((allergy, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-semibold">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Labour Status */}
              {mother.labour && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">Current Labour Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-purple-700">Stage</div>
                      <div className="text-xl font-bold text-purple-900">{mother.labour.stage.toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-700">Dilation</div>
                      <div className="text-xl font-bold text-purple-900">{mother.labour.currentDilation} cm</div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-700">Effacement</div>
                      <div className="text-xl font-bold text-purple-900">{mother.labour.currentEffacement}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-700">Station</div>
                      <div className="text-xl font-bold text-purple-900">{mother.labour.currentStation}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'partograph' && mother.labour && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-2">Labour Progress Chart</h3>
                <div className="text-sm text-purple-700">
                  Started: {formatDateTime(mother.labour.startTime)} • Stage: {mother.labour.stage.toUpperCase()}
                </div>
              </div>
              
              {/* Partograph Entries */}
              <div className="space-y-3">
                {mother.labour.partograph.map((entry, idx) => (
                  <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-slate-900">{formatTime(entry.time)}</div>
                        <div className="text-xs text-slate-500">{entry.hoursInLabour} hours in labour</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{entry.cervicalDilation}cm</div>
                        <div className="text-xs text-slate-500">dilation</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-600">Contractions</div>
                        <div className="font-semibold text-slate-900">
                          {entry.contractionsPerTenMin}/10min • {entry.contractionDuration}s
                        </div>
                        <div className="text-xs text-slate-500">{entry.contractionStrength}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Fetal HR</div>
                        <div className="font-semibold text-slate-900">{entry.fetalHeartRate} bpm</div>
                        <div className={`text-xs ${
                          entry.fetalHeartRatePattern === 'reassuring' ? 'text-green-600' :
                          entry.fetalHeartRatePattern === 'non-reassuring' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {entry.fetalHeartRatePattern}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-600">Maternal BP</div>
                        <div className="font-semibold text-slate-900">{entry.maternalBP}</div>
                        <div className="text-xs text-slate-500">Pulse: {entry.maternalPulse}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Temperature</div>
                        <div className="font-semibold text-slate-900">{entry.maternalTemp}°C</div>
                      </div>
                    </div>
                    
                    {entry.drugsGiven && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-xs text-slate-600">Medication: <span className="font-semibold text-blue-700">{entry.drugsGiven}</span></div>
                      </div>
                    )}
                    
                    {entry.notes && (
                      <div className="mt-2 text-xs text-slate-600 italic">{entry.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'delivery' && mother.delivery && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-2">Delivery Summary</h3>
                <div className="text-sm text-green-700">
                  Time: {formatDateTime(mother.delivery.deliveryTime)} • Duration: {Math.floor(mother.delivery.labourDuration / 60)}h {mother.delivery.labourDuration % 60}m
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Delivery Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-semibold text-slate-900">{mother.delivery.deliveryType.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Presentation:</span>
                      <span className="font-semibold text-slate-900">{mother.delivery.presentation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Episiotomy:</span>
                      <span className="font-semibold text-slate-900">{mother.delivery.episiotomy ? 'Yes' : 'No'}</span>
                    </div>
                    {mother.delivery.perinealTear && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Perineal Tear:</span>
                        <span className="font-semibold text-slate-900">{mother.delivery.perinealTear}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Blood Loss:</span>
                      <span className="font-semibold text-slate-900">{mother.delivery.bloodLoss} ml</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Placenta</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Delivered:</span>
                      <span className="font-semibold text-slate-900">{formatTime(mother.delivery.placentaDelivered)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Complete:</span>
                      <span className="font-semibold text-slate-900">{mother.delivery.placentaComplete ? 'Yes' : 'No'}</span>
                    </div>
                    {mother.delivery.placentaWeight && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Weight:</span>
                        <span className="font-semibold text-slate-900">{mother.delivery.placentaWeight}g</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Staff</h3>
                <div className="text-sm text-slate-700">
                  <div>Delivered by: <span className="font-semibold">{mother.delivery.deliveredBy}</span></div>
                  <div>Assisted by: <span className="font-semibold">{mother.delivery.assistedBy.join(', ')}</span></div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'newborn' && mother.delivery?.newborn && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Newborn Assessment</h3>
                <div className="text-sm text-blue-700">
                  {mother.delivery.newborn.gender} • Born: {formatDateTime(mother.delivery.newborn.birthTime)}
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600">Birth Weight</div>
                  <div className="text-2xl font-bold text-slate-900">{mother.delivery.newborn.birthWeight}g</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600">Length</div>
                  <div className="text-2xl font-bold text-slate-900">{mother.delivery.newborn.birthLength} cm</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600">Head Circumference</div>
                  <div className="text-2xl font-bold text-slate-900">{mother.delivery.newborn.headCircumference} cm</div>
                </div>
              </div>
              
              {/* APGAR Scores */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">APGAR Scores</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-2">1 Minute</div>
                    <div className="text-4xl font-bold text-blue-600 mb-2">{mother.delivery.newborn.apgar1Min.score}/10</div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">A</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar1Min.appearance}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">P</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar1Min.pulse}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">G</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar1Min.grimace}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">A</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar1Min.activity}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">R</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar1Min.respiration}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm font-semibold text-green-900 mb-2">5 Minutes</div>
                    <div className="text-4xl font-bold text-green-600 mb-2">{mother.delivery.newborn.apgar5Min.score}/10</div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">A</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar5Min.appearance}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">P</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar5Min.pulse}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">G</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar5Min.grimace}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">A</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar5Min.activity}</div>
                      </div>
                      <div>
                        <div className="text-slate-600">R</div>
                        <div className="font-bold">{mother.delivery.newborn.apgar5Min.respiration}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Screening */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Screening & Prophylaxis</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-3 rounded-lg border ${mother.delivery.newborn.vitaminKGiven ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-sm font-semibold">Vitamin K</div>
                    <div className="text-lg font-bold">{mother.delivery.newborn.vitaminKGiven ? '✓ Given' : '✗ Not given'}</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${mother.delivery.newborn.eyeProphylaxis ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-sm font-semibold">Eye Prophylaxis</div>
                    <div className="text-lg font-bold">{mother.delivery.newborn.eyeProphylaxis ? '✓ Given' : '✗ Not given'}</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${mother.delivery.newborn.hepatitisB ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-sm font-semibold">Hepatitis B</div>
                    <div className="text-lg font-bold">{mother.delivery.newborn.hepatitisB ? '✓ Given' : '✗ Not given'}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Feeding</h3>
                <div className="text-sm text-slate-700">
                  Type: <span className="font-semibold">{mother.delivery.newborn.feedingType}</span>
                  {mother.delivery.newborn.firstFeed && (
                    <span className="ml-3">First feed: {formatTime(mother.delivery.newborn.firstFeed)}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







