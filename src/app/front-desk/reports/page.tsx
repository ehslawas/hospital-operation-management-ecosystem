'use client';

import { useMemo } from 'react';

type DailyRegistration = { date: string; registrations: number; walkIns: number; appointments: number };
type WaitTime = { hour: string; avg: number; p90: number };
type TriageBreakdown = { level: 'Red' | 'Orange' | 'Yellow' | 'Green'; count: number };
type Referral = { department: string; count: number };

export default function FrontDeskReportsPage() {
  // Mocked datasets (can be wired to API later)
  const daily: DailyRegistration[] = [
    { date: '2025-01-01', registrations: 112, walkIns: 48, appointments: 64 },
    { date: '2025-01-02', registrations: 128, walkIns: 55, appointments: 73 },
    { date: '2025-01-03', registrations: 119, walkIns: 51, appointments: 68 },
    { date: '2025-01-04', registrations: 140, walkIns: 63, appointments: 77 },
    { date: '2025-01-05', registrations: 134, walkIns: 57, appointments: 77 },
    { date: '2025-01-06', registrations: 147, walkIns: 60, appointments: 87 },
    { date: '2025-01-07', registrations: 152, walkIns: 62, appointments: 90 },
  ];

  const waits: WaitTime[] = [
    { hour: '08:00', avg: 12, p90: 25 },
    { hour: '09:00', avg: 16, p90: 32 },
    { hour: '10:00', avg: 19, p90: 40 },
    { hour: '11:00', avg: 18, p90: 36 },
    { hour: '12:00', avg: 14, p90: 28 },
    { hour: '13:00', avg: 13, p90: 26 },
    { hour: '14:00', avg: 15, p90: 30 },
    { hour: '15:00', avg: 17, p90: 34 },
  ];

  const triage: TriageBreakdown[] = [
    { level: 'Red', count: 6 },
    { level: 'Orange', count: 18 },
    { level: 'Yellow', count: 42 },
    { level: 'Green', count: 86 },
  ];

  const referrals: Referral[] = [
    { department: 'General Medicine', count: 58 },
    { department: 'Orthopedics', count: 24 },
    { department: 'Cardiology', count: 19 },
    { department: 'Dermatology', count: 15 },
    { department: 'ENT', count: 12 },
  ];

  const kpis = useMemo(() => {
    const total7d = daily.reduce((s, d) => s + d.registrations, 0);
    const avgWait = Math.round(waits.reduce((s, w) => s + w.avg, 0) / waits.length);
    const p90 = Math.round(waits.reduce((s, w) => s + w.p90, 0) / waits.length);
    const urgent = triage.find(t => t.level === 'Red')!.count + triage.find(t => t.level === 'Orange')!.count;
    return { total7d, avgWait, p90, urgent };
  }, [daily, waits, triage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="bg-white/90 rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Front Desk Reports</h1>
              <p className="text-slate-600 mt-1">Daily registrations • Wait times • Triage • Referrals</p>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi title="Registrations (7d)" value={kpis.total7d.toLocaleString()} color="blue" />
          <Kpi title="Avg Wait (min)" value={kpis.avgWait} color="indigo" />
          <Kpi title="P90 Wait (min)" value={kpis.p90} color="purple" />
          <Kpi title="Urgent (Red/Orange)" value={kpis.urgent} color="rose" />
        </div>

        {/* Charts/Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Registrations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Daily Registrations</h2>
            <p className="text-sm text-slate-600 mb-4">Appointments vs Walk‑ins (last 7 days)</p>
            <div className="h-64">
              {LineComparison({ daily })}
            </div>
          </div>

          {/* Hourly Wait Times */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Hourly Wait Times</h2>
            <p className="text-sm text-slate-600 mb-4">Average and 90th percentile by hour</p>
            <div className="h-64">
              {LineWait({ waits })}
            </div>
          </div>

          {/* Triage Levels */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Triage Level Distribution</h2>
            <p className="text-sm text-slate-600 mb-4">Counts by ESI level</p>
            <div className="h-64 flex items-center justify-center">
              {DonutTriage({ triage })}
            </div>
          </div>

          {/* Referrals */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Top Referral Destinations</h2>
            <p className="text-sm text-slate-600 mb-4">Departments receiving most referrals</p>
            <div className="space-y-3">
              {referrals.map(r => (
                <div key={r.department} className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">{r.department}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-40 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2" style={{ width: `${(r.count / referrals[0].count) * 100}%` }}></div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{r.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value, color }: { title: string; value: number | string; color: 'blue' | 'indigo' | 'purple' | 'rose' }) {
  const map: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    indigo: 'from-indigo-500 to-blue-600',
    purple: 'from-purple-500 to-pink-500',
    rose: 'from-rose-500 to-orange-500',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${map[color]} mb-3`}></div>
      <div className="text-sm text-slate-600">{title}</div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

// Lightweight SVG renderers (no external chart lib)
function LineComparison({ daily }: { daily: DailyRegistration[] }) {
  const max = Math.max(...daily.map(d => Math.max(d.registrations, d.walkIns, d.appointments))) || 1;
  const points = (key: 'walkIns' | 'appointments') => daily.map((d, i) => `${(i / (daily.length - 1)) * 100},${100 - (d[key] / max) * 100}`).join(' ');
  const ticks = daily.map((d, i) => ({ x: (i / (daily.length - 1)) * 100, label: d.date.slice(5) }));
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <polyline fill="none" stroke="#22c55e" strokeWidth="1.5" points={points('appointments')} />
      <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" points={points('walkIns')} />
      {ticks.map(t => (
        <text key={t.x} x={t.x} y="98" fontSize="3" textAnchor="middle" fill="#64748b">{t.label}</text>
      ))}
    </svg>
  );
}

function LineWait({ waits }: { waits: WaitTime[] }) {
  const max = Math.max(...waits.map(w => w.p90)) || 1;
  const pAvg = waits.map((w, i) => `${(i / (waits.length - 1)) * 100},${100 - (w.avg / max) * 100}`).join(' ');
  const p90 = waits.map((w, i) => `${(i / (waits.length - 1)) * 100},${100 - (w.p90 / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <polyline fill="none" stroke="#6366f1" strokeWidth="1.5" points={pAvg} />
      <polyline fill="none" stroke="#f59e0b" strokeWidth="1.5" points={p90} />
    </svg>
  );
}

function DonutTriage({ triage }: { triage: TriageBreakdown[] }) {
  const total = triage.reduce((s, t) => s + t.count, 0) || 1;
  const colors: Record<string, string> = { Red: '#ef4444', Orange: '#f97316', Yellow: '#f59e0b', Green: '#22c55e' };
  let acc = 0;
  const arcs = triage.map(t => {
    const start = acc / total;
    const end = (acc + t.count) / total;
    acc += t.count;
    const large = end - start > 0.5 ? 1 : 0;
    const cx = 50, cy = 50, r = 40;
    const a0 = 2 * Math.PI * start, a1 = 2 * Math.PI * end;
    const p0 = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) };
    const p1 = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
    const d = `M ${cx} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
    return { d, color: colors[t.level], label: t.level, value: t.count };
  });
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-44 h-44">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} opacity="0.85" />
        ))}
      </svg>
      <div className="space-y-2">
        {triage.map(t => (
          <div key={t.level} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded" style={{ background: colors[t.level] }} />
            <span className="font-medium text-slate-800 w-14">{t.level}</span>
            <span className="text-slate-600">{t.count} ({Math.round((t.count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}


