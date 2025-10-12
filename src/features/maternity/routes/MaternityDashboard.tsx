'use client';

import React, { useState, useEffect } from 'react';
import { MetricsCard } from '@/features/emergency/components/MetricsCard';
import { ActiveDeliveriesBoard } from '../components/ActiveDeliveriesBoard';
import { MotherDetailsModal } from '../components/MotherDetailsModal';
import type { Mother } from '../types/Maternity';
import { mockMothers, mockMaternityBeds, calculateMaternityStats } from '../services/mockMaternityData';

export default function MaternityDashboard() {
  const [mothers, setMothers] = useState<Mother[]>(mockMothers);
  const [selectedMother, setSelectedMother] = useState<Mother | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  const stats = calculateMaternityStats(mothers, mockMaternityBeds);
  const bedOccupancy = Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100);
  
  const handleMotherClick = (mother: Mother) => {
    setSelectedMother(mother);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h1 className="text-4xl font-extrabold">Maternity Ward</h1>
            </div>
            <p className="text-pink-100 text-lg">Prenatal, labour & postnatal care</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-pink-100">{currentTime.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Patients"
          value={stats.totalPatients}
          subtitle={`Prenatal: ${stats.prenatal} | Postnatal: ${stats.postnatal}`}
          color="blue"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        
        <MetricsCard
          title="In Labour"
          value={stats.inLabour}
          subtitle="Active deliveries"
          color="purple"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <MetricsCard
          title="Deliveries Today"
          value={stats.deliveriesToday}
          subtitle={`C-section rate: ${stats.caesareanRate}%`}
          color="green"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <MetricsCard
          title="High Risk Cases"
          value={stats.highRiskCases}
          subtitle="Requiring special attention"
          color="red"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>
      
      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Labour Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Average Labour Duration</div>
                <div className="text-3xl font-bold text-purple-600">{stats.averageLabourDuration}h</div>
              </div>
              <svg className="w-12 h-12 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.prenatal}</div>
                  <div className="text-xs text-slate-600">Prenatal</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.inLabour}</div>
                  <div className="text-xs text-slate-600">In Labour</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.postnatal}</div>
                  <div className="text-xs text-slate-600">Postnatal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Bed Occupancy</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-pink-600">{bedOccupancy}%</div>
              <div className="text-sm text-slate-600 mt-1">Occupied</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{stats.availableBeds}</div>
              <div className="text-sm text-slate-600 mt-1">Available</div>
            </div>
          </div>
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
              style={{ width: `${bedOccupancy}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{stats.totalBeds - stats.availableBeds} occupied</span>
            <span>{stats.totalBeds} total beds</span>
          </div>
        </div>
      </div>
      
      {/* Ward Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Ward Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Prenatal', beds: mockMaternityBeds.filter(b => b.ward === 'Prenatal'), color: 'bg-blue-500' },
            { name: 'Labour', beds: mockMaternityBeds.filter(b => b.ward === 'Labour'), color: 'bg-purple-500' },
            { name: 'Postnatal', beds: mockMaternityBeds.filter(b => b.ward === 'Postnatal'), color: 'bg-green-500' },
            { name: 'High-Risk', beds: mockMaternityBeds.filter(b => b.ward === 'High-Risk'), color: 'bg-red-500' },
          ].map(ward => {
            const occupied = ward.beds.filter(b => b.status === 'occupied').length;
            const total = ward.beds.length;
            const percentage = Math.round((occupied / total) * 100);
            
            return (
              <div key={ward.name} className="text-center">
                <div className={`${ward.color} text-white rounded-xl p-4 mb-2`}>
                  <div className="text-3xl font-bold">{occupied}/{total}</div>
                </div>
                <div className="text-sm font-semibold text-slate-900">{ward.name}</div>
                <div className="text-xs text-slate-500">{percentage}% occupied</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Active Deliveries Board */}
      <ActiveDeliveriesBoard mothers={mothers} onMotherClick={handleMotherClick} />
      
      {/* Mother Details Modal */}
      {selectedMother && (
        <MotherDetailsModal
          mother={selectedMother}
          onClose={() => setSelectedMother(null)}
        />
      )}
    </div>
  );
}







