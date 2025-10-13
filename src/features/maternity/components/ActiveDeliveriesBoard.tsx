'use client';

import React, { useState } from 'react';
import type { Mother } from '../types/Maternity';

interface ActiveDeliveriesBoardProps {
  mothers: Mother[];
  onMotherClick: (mother: Mother) => void;
}

const riskColors = {
  low: 'bg-green-100 text-green-800 border-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-red-100 text-red-800 border-red-300',
};

const stageColors = {
  latent: 'bg-blue-500',
  active: 'bg-purple-500',
  transition: 'bg-orange-500',
  pushing: 'bg-red-500',
  delivery: 'bg-pink-500',
  placental: 'bg-green-500',
};

export function ActiveDeliveriesBoard({ mothers, onMotherClick }: ActiveDeliveriesBoardProps) {
  const [filter, setFilter] = useState<'all' | 'labour' | 'postnatal'>('all');
  
  const filteredMothers = mothers.filter(m => {
    if (filter === 'labour') return m.status === 'active-labour' || m.status === 'delivery';
    if (filter === 'postnatal') return m.status === 'postnatal';
    return m.status !== 'discharged';
  }).sort((a, b) => {
    // Priority: active labour > postnatal > prenatal
    const statusOrder = { 'active-labour': 0, 'delivery': 0, 'postnatal': 1, 'prenatal': 2 };
    const aOrder = statusOrder[a.status] ?? 3;
    const bOrder = statusOrder[b.status] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    
    // Then by risk level
    const riskOrder = { high: 0, moderate: 1, low: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });
  
  const getLabourDuration = (mother: Mother) => {
    if (!mother.labour) return null;
    const now = new Date();
    const diff = now.getTime() - mother.labour.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Patient Board</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({mothers.filter(m => m.status !== 'discharged').length})
            </button>
            <button
              onClick={() => setFilter('labour')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'labour'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              In Labour ({mothers.filter(m => m.status === 'active-labour' || m.status === 'delivery').length})
            </button>
            <button
              onClick={() => setFilter('postnatal')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'postnatal'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Postnatal ({mothers.filter(m => m.status === 'postnatal').length})
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredMothers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-semibold">No patients</p>
            </div>
          ) : (
            filteredMothers.map(mother => (
              <div
                key={mother.id}
                onClick={() => onMotherClick(mother)}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-r from-pink-50 to-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskColors[mother.riskLevel]}`}>
                        {mother.riskLevel.toUpperCase()} RISK
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        mother.status === 'active-labour' ? 'bg-purple-100 text-purple-700' :
                        mother.status === 'postnatal' ? 'bg-green-100 text-green-700' :
                        mother.status === 'prenatal' ? 'bg-blue-100 text-blue-700' :
                        'bg-pink-100 text-pink-700'
                      }`}>
                        {mother.status.replace('-', ' ').toUpperCase()}
                      </span>
                      {mother.labour && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${stageColors[mother.labour.stage]}`}>
                          {mother.labour.stage.replace('-', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900">{mother.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {mother.age}y • {mother.registrationNumber}
                    </p>
                    <p className="text-sm text-slate-700 font-semibold mt-2">
                      {mother.gestationalAge} • G{mother.gravida} P{mother.para}
                    </p>
                    
                    {mother.labour && (
                      <div className="mt-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-slate-600">Dilation</div>
                            <div className="text-lg font-bold text-purple-700">{mother.labour.currentDilation}cm</div>
                          </div>
                          <div>
                            <div className="text-slate-600">Effacement</div>
                            <div className="text-lg font-bold text-purple-700">{mother.labour.currentEffacement}%</div>
                          </div>
                          <div>
                            <div className="text-slate-600">Station</div>
                            <div className="text-lg font-bold text-purple-700">{mother.labour.currentStation}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {mother.delivery && (
                      <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <div className="text-sm font-semibold text-green-800">
                              Delivered: {mother.delivery.deliveryType.replace('-', ' ')}
                            </div>
                            <div className="text-xs text-green-600">
                              {mother.delivery.newborn.gender} • {mother.delivery.newborn.birthWeight}g • APGAR {mother.delivery.newborn.apgar1Min.score}/{mother.delivery.newborn.apgar5Min.score}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 flex gap-2 text-xs text-slate-600">
                      <span>Bed: {mother.bedNumber}</span>
                      {mother.assignedMidwife && <span>• {mother.assignedMidwife}</span>}
                      {mother.assignedDoctor && <span>• {mother.assignedDoctor}</span>}
                    </div>
                    
                    {mother.riskFactors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mother.riskFactors.slice(0, 2).map((risk, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold">
                            ⚠️ {risk}
                          </span>
                        ))}
                        {mother.riskFactors.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                            +{mother.riskFactors.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {mother.labour && (
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-purple-900">{getLabourDuration(mother)}</div>
                      <div className="text-xs text-slate-500">in labour</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}










