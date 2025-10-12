"use client";

import React, { useEffect, useMemo, useState } from "react";

// No‑Show Management — Appointments for a selected day
// This module helps front desk/admins manage no‑shows with audit trails, contact attempts, and rescheduling.

// ---- Types ----
type Patient = {
  id: string;
  name: string;
  nric: string;
  phone: string;
};

type ApptStatus = "Scheduled" | "Arrived" | "Checked-in" | "Completed" | "No-show" | "Cancelled";

type ContactMethod = "Call" | "SMS" | "WhatsApp" | "Email" | "Other";

interface ContactLog {
  id: string;
  dt: string; // ISO
  by: string; // staff user (stub)
  method: ContactMethod;
  outcome: "Reached" | "No Answer" | "Left Message" | "Wrong Number" | "Declined";
  notes?: string;
}

interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  patientId: string;
  clinic: string;
  doctor: string;
  status: ApptStatus;
  reason?: string; // visit reason/complaint
  noShowReason?: "Forgot" | "Transport" | "Sick" | "Weather" | "Late" | "Other";
  rescheduledTo?: { date: string; time: string } | null;
  contacts: ContactLog[];
  history: { dt: string; action: string }[];
}

// ---- Utilities ----
const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();

// ---- Seed ----
const seedPatients: Patient[] = [
  { id: "p1", name: "Adam Hassan", nric: "900101-14-1234", phone: "012-3456789" },
  { id: "p2", name: "Lim Mei Yi", nric: "980202-13-5566", phone: "013-1112233" },
  { id: "p3", name: "John Carter", nric: "A1234567", phone: "016-8889999" },
  { id: "p4", name: "Siti Aisyah", nric: "950505-13-8899", phone: "014-2223344" },
  { id: "p5", name: "Ahmad Rahman", nric: "920315-10-4455", phone: "017-3334444" },
  { id: "p6", name: "Sarah Lee", nric: "880712-08-6677", phone: "018-5556666" },
];

const seedAppts: Appointment[] = [
  { id: "a1", date: todayISO(), time: "08:30", patientId: "p1", clinic: "General Medicine", doctor: "Dr. Nur", status: "Scheduled", reason: "Fever", contacts: [], history: [], rescheduledTo: null },
  { id: "a2", date: todayISO(), time: "09:00", patientId: "p2", clinic: "Paediatrics", doctor: "Dr. Chan", status: "Scheduled", reason: "Vaccination", contacts: [], history: [], rescheduledTo: null },
  { id: "a3", date: todayISO(), time: "09:45", patientId: "p3", clinic: "Orthopaedics", doctor: "Dr. James", status: "No-show", reason: "Knee pain", noShowReason: "Transport", contacts: [{ id: uid(), dt: nowISO(), by: "FD-1", method: "Call", outcome: "No Answer" }], history: [{ dt: nowISO(), action: "Marked No-show" }], rescheduledTo: null },
  { id: "a4", date: todayISO(), time: "10:15", patientId: "p4", clinic: "General Medicine", doctor: "Dr. Nur", status: "Scheduled", reason: "Follow-up", contacts: [], history: [], rescheduledTo: null },
  { id: "a5", date: todayISO(), time: "11:00", patientId: "p5", clinic: "Cardiology", doctor: "Dr. Wong", status: "No-show", reason: "Chest pain", noShowReason: "Forgot", contacts: [{ id: uid(), dt: nowISO(), by: "FD-1", method: "SMS", outcome: "Left Message", notes: "Sent reminder SMS" }], history: [{ dt: nowISO(), action: "Marked No-show" }], rescheduledTo: null },
  { id: "a6", date: todayISO(), time: "14:30", patientId: "p6", clinic: "Dermatology", doctor: "Dr. Lim", status: "Completed", reason: "Skin check", contacts: [], history: [{ dt: nowISO(), action: "Completed appointment" }], rescheduledTo: null },
];

// ---- UI Primitives ----
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children, ...rest }) => (
  <div className={"rounded-2xl bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 " + className} {...rest}>{children}</div>
);

const Pill: React.FC<{ label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" } & React.HTMLAttributes<HTMLSpanElement>> = ({ label, tone = "neutral", className = "" }) => {
  const toneClass = {
    neutral: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
    danger: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
    info: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
  }[tone];
  return <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${toneClass} ${className}`}>{label}</span>;
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...rest }) => (
  <input className={"w-full rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 text-slate-800 px-3 py-2 outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm placeholder-slate-500 " + className} {...rest} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = "", children, ...rest }) => (
  <select className={"w-full rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 text-slate-800 px-3 py-2 outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm " + className} {...rest}>{children}</select>
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = "", ...rest }) => (
  <textarea className={"w-full rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 text-slate-800 px-3 py-2 outline-none focus:ring-2 ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm placeholder-slate-500 min-h-[96px] " + className} {...rest} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...rest }) => (
  <button className={"inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed " + className} {...rest}>{children}</button>
);

const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...rest }) => (
  <button className={"inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-white/20 text-slate-700 border border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-200 font-medium " + className} {...rest}>{children}</button>
);

// ---- Main Component ----
export default function NoShowManagement() {
  const [date, setDate] = useState<string>(todayISO());
  const [patients, setPatients] = useState<Patient[]>(seedPatients);
  const [appts, setAppts] = useState<Appointment[]>(seedAppts);

  const [clinic, setClinic] = useState<string>("All");
  const [doctor, setDoctor] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<ApptStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return; const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t);
  }, [toast]);

  const clinics = useMemo(() => ["All", ...Array.from(new Set(appts.map(a => a.clinic)))], [appts]);
  const doctors = useMemo(() => ["All", ...Array.from(new Set(appts.map(a => a.doctor)))], [appts]);

  const todaysAppts = useMemo(() => appts.filter(a => a.date === date), [appts, date]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return todaysAppts
      .filter(a => (clinic === "All" ? true : a.clinic === clinic))
      .filter(a => (doctor === "All" ? true : a.doctor === doctor))
      .filter(a => (statusFilter === "All" ? true : a.status === statusFilter))
      .filter(a => {
        if (!q) return true; const p = patients.find(x => x.id === a.patientId);
        return (
          a.time.includes(q) || a.clinic.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q) ||
          (p && (p.name.toLowerCase().includes(q) || p.nric.toLowerCase().includes(q) || p.phone.toLowerCase().includes(q)))
        );
      })
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [todaysAppts, clinic, doctor, statusFilter, search, patients]);

  const selectedAppt = useMemo(() => appts.find(a => a.id === selected) || null, [appts, selected]);

  const kpis = useMemo(() => {
    const total = todaysAppts.length;
    const noshows = todaysAppts.filter(a => a.status === "No-show").length;
    const arrived = todaysAppts.filter(a => a.status === "Arrived" || a.status === "Checked-in" || a.status === "Completed").length;
    const contacted = todaysAppts.filter(a => a.contacts.length > 0).length;
    return { total, noshows, arrived, contacted };
  }, [todaysAppts]);

  const markNoShow = (id: string, reason: Appointment["noShowReason"]) => {
    setAppts(prev => prev.map(a => a.id === id ? ({
      ...a,
      status: "No-show",
      noShowReason: reason,
      history: [...a.history, { dt: nowISO(), action: `Marked No-show (${reason || "Unspecified"})` }],
    }) : a));
    setToast("Marked as No-show");
  };

  const undoNoShow = (id: string) => {
    setAppts(prev => prev.map(a => a.id === id ? ({
      ...a,
      status: a.rescheduledTo ? "Scheduled" : "Scheduled",
      history: [...a.history, { dt: nowISO(), action: "No-show undone" }],
    }) : a));
    setToast("No-show undone");
  };

  const logContact = (id: string, form: FormData) => {
    const method = String(form.get("method")) as ContactMethod;
    const outcome = String(form.get("outcome")) as ContactLog["outcome"];
    const notes = String(form.get("notes") || "").trim() || undefined;
    const entry: ContactLog = { id: uid(), dt: nowISO(), by: "FD-1", method, outcome, notes };
    setAppts(prev => prev.map(a => a.id === id ? ({ ...a, contacts: [entry, ...a.contacts], history: [{ dt: nowISO(), action: `Contacted via ${method} (${outcome})` }, ...a.history] }) : a));
    setToast("Contact logged");
  };

  const reschedule = (id: string, form: FormData) => {
    const d = String(form.get("newDate") || "");
    const t = String(form.get("newTime") || "");
    if (!d || !t) { setToast("Pick date & time"); return; }
    setAppts(prev => prev.map(a => a.id === id ? ({
      ...a,
      rescheduledTo: { date: d, time: t },
      date: d,
      time: t,
      status: "Scheduled",
      history: [{ dt: nowISO(), action: `Rescheduled to ${d} ${t}` }, ...a.history]
    }) : a));
    setToast("Rescheduled");
  };

  const exportCSV = () => {
    const rows = [
      ["Date","Time","Patient","NRIC","Phone","Clinic","Doctor","Status","NoShowReason","RescheduledTo","ContactCount"],
      ...filtered.map(a => {
        const p = patients.find(x => x.id === a.patientId)!;
        const rs = a.rescheduledTo ? `${a.rescheduledTo.date} ${a.rescheduledTo.time}` : "";
        return [a.date, a.time, p?.name || "", p?.nric || "", p?.phone || "", a.clinic, a.doctor, a.status, a.noShowReason || "", rs, String(a.contacts.length)];
      })
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `appointments_${date}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      {/* Subtle Glass Orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl"></div>

      {/* Modern Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">NS</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">No‑Show Management</div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Daily Appointments & Recovery</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
              <Select value={clinic} onChange={(e) => setClinic(e.target.value)} className="w-auto">
                {clinics.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-auto">
                {doctors.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-auto">
                {["All","Scheduled","Arrived","Checked-in","Completed","No-show","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-slate-600 font-medium">Appointments Today</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{kpis.total}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-600 font-medium">No‑shows</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{kpis.noshows}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-600 font-medium">Arrived/Completed</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{kpis.arrived}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-600 font-medium">With Contact Attempts</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{kpis.contacted}</div>
          </Card>
        </section>

        {/* Toolbar */}
        <section className="mb-6 flex items-center gap-4">
          <Input placeholder="Search patient/NRIC/phone/doctor/clinic" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <GhostButton onClick={exportCSV}>Export CSV</GhostButton>
        </section>

        {/* List + Detail */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List */}
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-gradient-to-r from-white/40 to-blue-50/30">
              <div className="font-bold text-slate-900">Appointments for {date}</div>
              <div className="text-sm text-slate-600 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full">{filtered.length} result(s)</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/50 text-slate-700">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold">Time</th>
                    <th className="text-left px-6 py-4 font-semibold">Patient</th>
                    <th className="text-left px-6 py-4 font-semibold">Clinic / Doctor</th>
                    <th className="text-left px-6 py-4 font-semibold">Status</th>
                    <th className="text-right px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => {
                    const p = patients.find(x => x.id === a.patientId)!;
                    return (
                      <tr key={a.id} className={`border-b border-white/20 hover:bg-white/50 transition-all duration-200 ${selected === a.id ? "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-l-4 border-l-blue-500" : ""}`}>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-800">{a.time}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{p?.name}</div>
                          <div className="text-xs text-slate-600">{p?.nric} · {p?.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{a.clinic}</div>
                          <div className="text-xs text-slate-600">{a.doctor}</div>
                        </td>
                        <td className="px-6 py-4">
                          {a.status === "No-show" ? <Pill label="No-show" tone="danger" /> :
                           a.status === "Scheduled" ? <Pill label="Scheduled" tone="neutral" /> :
                           a.status === "Arrived" || a.status === "Checked-in" ? <Pill label={a.status} tone="info" /> :
                           a.status === "Completed" ? <Pill label="Completed" tone="success" /> :
                           <Pill label={a.status} tone="neutral" />}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <GhostButton onClick={() => setSelected(a.id)}>Open</GhostButton>
                            {a.status !== "No-show" && a.status !== "Completed" && a.status !== "Cancelled" && (
                              <Button onClick={() => markNoShow(a.id, "Forgot")}>Mark No‑show</Button>
                            )}
                            {a.status === "No-show" && (
                              <GhostButton onClick={() => undoNoShow(a.id)}>Undo</GhostButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Detail */}
          <div className="space-y-6">
            {!selectedAppt && (
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Select an Appointment</h3>
                <p className="text-slate-600">Choose an appointment to log contact attempts, set no‑show reasons, and reschedule.</p>
              </Card>
            )}

            {selectedAppt && (
              <>
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-slate-600 font-medium">Appointment</div>
                      <div className="text-xl font-bold text-slate-900">{selectedAppt.date} · {selectedAppt.time}</div>
                      <div className="text-sm text-slate-600 mt-1">{selectedAppt.clinic} · {selectedAppt.doctor}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Pill label={selectedAppt.status} tone={selectedAppt.status === "No-show" ? "danger" : "info"} />
                      {selectedAppt.status !== "No-show" && (
                        <Button onClick={() => markNoShow(selectedAppt.id, "Other")}>Mark No‑show</Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Patient Snapshot */}
                <Card className="p-6">
                  {(() => {
                    const p = patients.find(x => x.id === selectedAppt.patientId)!;
                    return (
                      <div>
                        <h4 className="font-bold text-slate-900 mb-4">Patient Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-slate-600 font-medium">Patient</div>
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            <div className="text-slate-600 text-xs">{p.nric}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600 font-medium">Phone</div>
                            <div className="font-semibold text-slate-900">{p.phone}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600 font-medium">Current Status</div>
                            <div className="font-semibold text-slate-900">{selectedAppt.status}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </Card>

                {/* No‑show Reason & Reschedule */}
                <Card className="p-6">
                  <div className="font-bold text-slate-900 mb-4">No‑show Reason & Reschedule</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm text-slate-700 font-medium">Reason</span>
                      <Select
                        value={selectedAppt.noShowReason || "Other"}
                        onChange={(e) => setAppts(prev => prev.map(a => a.id === selectedAppt.id ? ({...a, noShowReason: e.target.value as any, history: [...a.history, { dt: nowISO(), action: `No‑show reason set: ${e.target.value}` }]}) : a))}
                      >
                        {(["Forgot","Transport","Sick","Weather","Late","Other"] as const).map(r => <option key={r} value={r}>{r}</option>)}
                      </Select>
                    </label>

                    <form
                      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); reschedule(selectedAppt.id, fd); }}
                      className="grid grid-cols-2 gap-3 sm:col-span-2"
                    >
                      <Input name="newDate" type="date" defaultValue={selectedAppt.rescheduledTo?.date || date} />
                      <Input name="newTime" type="time" defaultValue={selectedAppt.rescheduledTo?.time || "10:00"} />
                      <div className="col-span-2 flex items-center justify-end">
                        <GhostButton type="submit">Reschedule</GhostButton>
                      </div>
                    </form>
                  </div>
                </Card>

                {/* Contact Attempts */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-slate-900">Contact Attempts</div>
                  </div>

                  <form
                    onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); logContact(selectedAppt.id, fd); (e.currentTarget as HTMLFormElement).reset(); }}
                    className="grid grid-cols-1 sm:grid-cols-6 gap-3 mb-4"
                  >
                    <Select name="method" defaultValue="Call">
                      <option>Call</option>
                      <option>SMS</option>
                      <option>WhatsApp</option>
                      <option>Email</option>
                      <option>Other</option>
                    </Select>
                    <Select name="outcome" defaultValue="No Answer">
                      <option>No Answer</option>
                      <option>Reached</option>
                      <option>Left Message</option>
                      <option>Wrong Number</option>
                      <option>Declined</option>
                    </Select>
                    <TextArea name="notes" placeholder="Notes (optional)" className="sm:col-span-3" />
                    <Button type="submit">Log</Button>
                  </form>

                  <div className="space-y-3">
                    {selectedAppt.contacts.length === 0 && (
                      <div className="text-sm text-slate-600 text-center py-4">No contact attempts yet.</div>
                    )}
                    {selectedAppt.contacts.map(c => (
                      <div key={c.id} className="p-4 bg-white/50 rounded-xl border border-white/30">
                        <div className="flex items-start gap-3 text-sm">
                          <div className="min-w-[120px] text-slate-600 font-medium">{new Date(c.dt).toLocaleString()}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900">{c.method} · {c.outcome}</div>
                            {c.notes && <div className="text-slate-700 mt-1">{c.notes}</div>}
                            <div className="text-xs text-slate-500 mt-1">by {c.by}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* History */}
                <Card className="p-6">
                  <div className="font-bold text-slate-900 mb-4">Audit Trail</div>
                  <div className="space-y-3">
                    {selectedAppt.history.length === 0 && <div className="text-slate-600 text-center py-4">No activity yet.</div>}
                    {selectedAppt.history.map((h, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm p-3 bg-white/50 rounded-lg">
                        <div className="min-w-[120px] text-slate-600 font-medium">{new Date(h.dt).toLocaleString()}</div>
                        <div className="text-slate-800">{h.action}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-xl bg-white/90 backdrop-blur-xl border border-white/30 px-6 py-3 text-sm shadow-lg text-slate-800 font-medium">{toast}</div>
        </div>
      )}

      <footer className="relative z-10 mx-auto max-w-7xl px-6 py-8 text-xs text-slate-500 text-center">
        Connect this to your backend (e.g., Supabase) to persist appointments, contacts, and history. This demo is in-memory.
      </footer>
    </div>
  );
}