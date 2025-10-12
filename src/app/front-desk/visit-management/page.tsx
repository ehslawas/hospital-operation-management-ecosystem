'use client';

import React, { useMemo, useState, useEffect } from "react";

// ---- Types ----
type Patient = {
  id: string;
  name: string;
  nric: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
};

type VisitStatus =
  | "Registered"
  | "Triage"
  | "Waiting Doctor"
  | "In Consultation"
  | "Orders"
  | "Billing"
  | "Completed"
  | "Cancelled";

type OrderType = "Lab" | "Imaging" | "Pharmacy" | "Procedure";

type VisitOrder = {
  id: string;
  type: OrderType;
  name: string;
  status: "Pending" | "Sent" | "Resulted" | "Dispensed" | "NA";
  notes?: string;
};

type Visit = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  patientId: string;
  clinic: string; // General, Paeds, Ortho, etc.
  doctor?: string;
  reason: string; // chief complaint
  vitals?: {
    height?: number;
    weight?: number;
    temp?: number; // °C
    bp?: string; // 120/80
    hr?: number;
    spo2?: number;
  };
  status: VisitStatus;
  orders: VisitOrder[];
  billing?: {
    payer: "Government" | "Private" | "Insurance";
    estAmount?: number;
    paid?: boolean;
    invoiceNo?: string;
  };
  notes?: string;
};

// ---- Utilities ----
const uid = () => Math.random().toString(36).slice(2, 9);
const now = new Date();
const todayISO = () => new Date().toISOString().slice(0, 10);
const timeHM = () => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

// ---- Seed ----
const seedPatients: Patient[] = [
  { id: "p1", name: "Adam Hassan", nric: "900101-14-1234", dob: "1990-01-01", gender: "Male", phone: "012-3456789" },
  { id: "p2", name: "Lim Mei Yi", nric: "980202-13-5566", dob: "1998-02-02", gender: "Female", phone: "013-1112233" },
  { id: "p3", name: "John Carter", nric: "A1234567", dob: "1985-07-19", gender: "Male", phone: "016-8889999" },
];

const seedVisits: Visit[] = [
  {
    id: "v1",
    date: todayISO(),
    time: "08:35",
    patientId: "p1",
    clinic: "General Medicine",
    doctor: "Dr. Nur",
    reason: "Fever and cough",
    vitals: { temp: 38.2, bp: "120/80", hr: 92, spo2: 98 },
    status: "Waiting Doctor",
    orders: [
      { id: uid(), type: "Lab", name: "FBC", status: "Pending" },
    ],
    billing: { payer: "Government", estAmount: 0, paid: true, invoiceNo: "GOV-0001" },
  },
  {
    id: "v2",
    date: todayISO(),
    time: "09:20",
    patientId: "p2",
    clinic: "Paediatrics",
    doctor: "Dr. Chan",
    reason: "Follow-up vaccination",
    status: "Registered",
    orders: [],
    billing: { payer: "Government", estAmount: 0, paid: true },
  },
];

// ---- UI Primitives ----
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children, ...rest }) => (
  <div
    className={
      "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl " +
      "transition-all duration-300 hover:scale-[1.02] " +
      className
    }
    {...rest}
  >
    {children}
  </div>
);

const Pill: React.FC<{ label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" } & React.HTMLAttributes<HTMLSpanElement>> = ({ label, tone = "neutral", className = "" }) => {
  const toneClass = {
    neutral: "bg-slate-200/30 text-slate-700 border-slate-300/40",
    success: "bg-emerald-200/30 text-emerald-700 border-emerald-300/40",
    warning: "bg-amber-200/30 text-amber-700 border-amber-300/40",
    danger: "bg-red-200/30 text-red-700 border-red-300/40",
    info: "bg-cyan-200/30 text-cyan-700 border-cyan-300/40",
  }[tone];
  return <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border ${toneClass} ${className}`}>{label}</span>;
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...rest }) => (
  <input
    className={
      "w-full rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 text-slate-800 px-4 py-3 " +
      "outline-none focus:ring-2 ring-cyan-400/50 placeholder-slate-500 transition-all duration-300 focus:bg-white focus:border-cyan-400 " +
      className
    }
    {...rest}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = "", children, ...rest }) => (
  <select
    className={
      "w-full rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 text-slate-800 px-4 py-3 " +
      "outline-none focus:ring-2 ring-cyan-400/50 transition-all duration-300 focus:bg-white focus:border-cyan-400 " +
      className
    }
    {...rest}
  >
    {children}
  </select>
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = "", ...rest }) => (
  <textarea
    className={
      "w-full rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 text-slate-800 px-4 py-3 " +
      "outline-none focus:ring-2 ring-cyan-400/50 placeholder-slate-500 min-h-[96px] transition-all duration-300 focus:bg-white focus:border-cyan-400 " +
      className
    }
    {...rest}
  />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...rest }) => (
  <button
    className={
      "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 " +
      "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl " +
      "transition-all duration-300 hover:scale-105 hover:from-cyan-600 hover:to-blue-700 " +
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 " +
      className
    }
    {...rest}
  >
    {children}
  </button>
);

const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...rest }) => (
  <button
    className={
      "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 " +
      "bg-white/20 backdrop-blur-sm text-slate-700 border border-white/30 hover:bg-white/30 " +
      "transition-all duration-300 hover:scale-105 font-semibold " +
      className
    }
    {...rest}
  >
    {children}
  </button>
);

// ---- Main Component ----
export default function VisitManagementPage() {
  const [patients, setPatients] = useState<Patient[]>(seedPatients);
  const [visits, setVisits] = useState<Visit[]>(seedVisits);

  const [search, setSearch] = useState("");
  const [clinic, setClinic] = useState("All");
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "All">("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("Clinic");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const clinics = useMemo(() => ["All", ...Array.from(new Set(visits.map((v) => v.clinic)))], [visits]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visits
      .filter((v) => (clinic === "All" ? true : v.clinic === clinic))
      .filter((v) => (statusFilter === "All" ? true : v.status === statusFilter))
      .filter((v) => {
        if (!q) return true;
        const p = patients.find((x) => x.id === v.patientId);
        return (
          v.date.includes(q) ||
          v.time.includes(q) ||
          v.clinic.toLowerCase().includes(q) ||
          (v.doctor && v.doctor.toLowerCase().includes(q)) ||
          v.reason.toLowerCase().includes(q) ||
          (p && (p.name.toLowerCase().includes(q) || p.nric.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [visits, patients, search, clinic, statusFilter]);

  const selectedVisit = useMemo(() => visits.find((v) => v.id === selectedVisitId) || null, [visits, selectedVisitId]);

  const createVisit = (form: FormData) => {
    const pid = String(form.get("patientId") || "");
    const clinic = String(form.get("clinic") || "General Medicine");
    const doctor = String(form.get("doctor") || "");
    const reason = String(form.get("reason") || "");
    const payer = (String(form.get("payer") || "Government") as Visit["billing"]["payer"]);
    if (!pid || !reason) {
      setToast("Patient & reason are required");
      return;
    }

    const v: Visit = {
      id: uid(),
      date: todayISO(),
      time: timeHM(),
      patientId: pid,
      clinic,
      doctor: doctor || undefined,
      reason,
      status: "Registered",
      orders: [],
      billing: { payer, estAmount: payer === "Government" ? 0 : 50, paid: payer === "Government" },
      notes: "",
    };
    setVisits((prev) => [v, ...prev]);
    setDrawerOpen(false);
    setSelectedVisitId(v.id);
    setToast("Visit created");
  };

  const updateStatus = (id: string, to: VisitStatus) => {
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: to } : v)));
  };

  const saveVitals = (id: string, form: FormData) => {
    const vitals = {
      height: Number(form.get("height")) || undefined,
      weight: Number(form.get("weight")) || undefined,
      temp: Number(form.get("temp")) || undefined,
      bp: String(form.get("bp") || "") || undefined,
      hr: Number(form.get("hr")) || undefined,
      spo2: Number(form.get("spo2")) || undefined,
    };
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, vitals: vitals } : v)));
    setToast("Vitals saved");
  };

  const addOrder = (id: string, form: FormData) => {
    const type = String(form.get("type")) as OrderType;
    const name = String(form.get("name") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    if (!name) return;
    const order: VisitOrder = { id: uid(), type, name, status: "Pending", notes: notes || undefined };
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, orders: [...v.orders, order], status: v.status === "In Consultation" ? "Orders" : v.status } : v)));
    setToast(`${type} order added`);
  };

  const updateOrderStatus = (visitId: string, orderId: string, next: VisitOrder["status"]) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, orders: v.orders.map((o) => (o.id === orderId ? { ...o, status: next } : o)) } : v))
    );
  };

  const markBilling = (id: string, form: FormData) => {
    const amount = Number(form.get("amount")) || 0;
    const paid = Boolean(form.get("paid"));
    const invoiceNo = String(form.get("invoiceNo") || "").trim() || undefined;
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, billing: { ...(v.billing || { payer: "Government" }), estAmount: amount, paid, invoiceNo }, status: paid ? "Completed" : v.status } : v))
    );
    setToast("Billing updated");
  };

  return (
    <>
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
        <header className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">VM</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Visit Management</h1>
                  <p className="text-sm text-gray-600 font-medium">Patient workflow tracking</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Visit</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              </button>
            </div>
            
            {/* Modern Search Bar */}
            <div className="mt-8">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search patients, doctors, or clinics..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                  />
                </div>
                <select
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  className="px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm font-medium"
                >
                  {clinics.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm font-medium"
                >
                  {["All", "Registered", "Triage", "Waiting Doctor", "In Consultation", "Orders", "Billing", "Completed", "Cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Patient List */}
            <div>
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/20 bg-gradient-to-r from-white/40 to-blue-50/30">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Today's Visits</h2>
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                      {filtered.length} patients
                    </span>
                  </div>
                </div>
                
                <div className="divide-y divide-white/20">
                  {filtered.map((v) => {
                    const p = patients.find((x) => x.id === v.patientId);
                    return (
                      <div
                        key={v.id}
                        className={`p-6 hover:bg-white/50 transition-all duration-300 cursor-pointer group ${
                          selectedVisitId === v.id ? "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-l-4 border-l-blue-500 shadow-md" : ""
                        }`}
                        onClick={() => setSelectedVisitId(v.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-sm border border-blue-200/50">
                                <span className="text-sm font-bold text-blue-700">{v.time}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-medium text-gray-900 truncate">{p?.name}</h3>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                                  v.status === "Completed" 
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                    : v.status === "Waiting Doctor"
                                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                    : v.status === "In Consultation"
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                    : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                                }`}>
                                  {v.status}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                <span>{p?.nric}</span>
                                <span>•</span>
                                <span>{v.clinic}</span>
                                <span>•</span>
                                <span>{v.doctor || "Unassigned"}</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">{v.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVisitId(v.id);
                              }}
                              className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors duration-200"
                            >
                              View Details
                            </button>
                            {v.status !== "Completed" && v.status !== "Cancelled" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(v.id,
                                    v.status === "Registered" ? "Triage" :
                                    v.status === "Triage" ? "Waiting Doctor" :
                                    v.status === "Waiting Doctor" ? "In Consultation" :
                                    v.status === "In Consultation" ? "Orders" :
                                    v.status === "Orders" ? "Billing" : "Completed"
                                  );
                                }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                Next Step
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Patient Details */}
            <div className="space-y-6">
              {!selectedVisit && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-blue-200/50">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Select a Patient</h3>
                  <p className="text-gray-600 mb-8 font-medium">
                    Choose a patient from the list to view and manage their visit details.
                  </p>
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl w-full"
                  >
                    + Create New Visit
                  </button>
                </div>
              )}

              {selectedVisit && (
                <>
                  {/* Visit Overview */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedVisit.date} • {selectedVisit.time}</h3>
                        <div className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">{selectedVisit.clinic}</span> • {selectedVisit.doctor || "Unassigned"}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                          selectedVisit.status === "Completed" 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            : selectedVisit.status === "Waiting Doctor"
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                            : selectedVisit.status === "In Consultation"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                            : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                        }`}>
                          {selectedVisit.status}
                        </span>
                        <button
                          onClick={() => updateStatus(selectedVisit.id, "Cancelled")}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Patient Information */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 p-6">
                    {(() => {
                      const p = patients.find((x) => x.id === selectedVisit.patientId)!;
                      return (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-4">Patient Information</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patient Name</label>
                              <div className="text-lg font-semibold text-gray-900">{p.name}</div>
                              <div className="text-sm text-gray-600">{p.nric}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</label>
                                <div className="text-sm font-medium text-gray-900">{p.phone}</div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender & DOB</label>
                                <div className="text-sm font-medium text-gray-900">{p.gender} • {p.dob}</div>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chief Complaint</label>
                              <div className="text-sm text-gray-900 mt-1">{selectedVisit.reason}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Vitals */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900">Vital Signs</h4>
                      {selectedVisit.status === "Registered" && (
                        <button
                          onClick={() => updateStatus(selectedVisit.id, "Triage")}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Start Triage
                        </button>
                      )}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget as HTMLFormElement);
                        saveVitals(selectedVisit.id, fd);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Height (cm)</label>
                          <input
                            name="height"
                            type="number"
                            placeholder="170"
                            defaultValue={selectedVisit.vitals?.height || ""}
                            className="w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                          <input
                            name="weight"
                            type="number"
                            placeholder="70"
                            defaultValue={selectedVisit.vitals?.weight || ""}
                            className="w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Temperature (°C)</label>
                          <input
                            name="temp"
                            type="number"
                            step="0.1"
                            placeholder="37.0"
                            defaultValue={selectedVisit.vitals?.temp || ""}
                            className="w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Blood Pressure</label>
                          <input
                            name="bp"
                            type="text"
                            placeholder="120/80"
                            defaultValue={selectedVisit.vitals?.bp || ""}
                            className="w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                          <input
                            name="hr"
                            type="number"
                            placeholder="72"
                            defaultValue={selectedVisit.vitals?.hr || ""}
                            className="w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">SpO₂ (%)</label>
                          <input
                            name="spo2"
                            type="number"
                            placeholder="98"
                            defaultValue={selectedVisit.vitals?.spo2 || ""}
                            className="w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Save Vitals
                        </button>
                      </div>
                    </form>
                  </div>

                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Drawer: New Visit */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-cyan-900/40 backdrop-blur-md" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/30 backdrop-blur-2xl border-l border-white/30 shadow-2xl overflow-auto">
            {/* Modern Header with Glass Effect */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative p-8 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    </div>
                    <div>
                      <div className="text-sm font-medium opacity-90 tracking-wide">CREATE NEW</div>
                      <div className="text-3xl font-black tracking-tight">Patient Visit</div>
                      <div className="text-sm opacity-80 mt-1">Quick & seamless registration</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="group p-3 rounded-2xl bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30 hover:scale-105 hover:rotate-90"
                  >
                    <svg className="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-4 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-4 left-20 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl"></div>
            </div>

            {/* Form Content */}
            <div className="p-8 space-y-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  const patientId = fd.get('patientId') as string;
                  const reason = fd.get('reason') as string;
                  
                  // Validation
                  if (!patientId) {
                    setToast('Please select a patient');
                    return;
                  }
                  
                  if (!reason || reason.trim() === '') {
                    setToast('Please provide a reason for the visit');
                    return;
                  }
                  
                  createVisit(fd);
                }}
                className="space-y-8"
              >
                {/* Patient Selection - Featured Card */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Select Patient <span className="text-red-500">*</span></h3>
                        <p className="text-sm text-slate-600">Choose from registered patients</p>
                      </div>
                    </div>
                    <Select name="patientId" defaultValue="" className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 focus:bg-white/90 transition-all duration-300 shadow-sm">
                      <option value="" disabled>Select from registered patients</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — {p.nric}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Department & Visit Type Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Card */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-xl p-5 border border-white/60 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-400 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Department</h4>
                          <p className="text-xs text-slate-600">Select department</p>
                        </div>
                      </div>
                      <Select 
                        name="department" 
                        defaultValue="Clinic"
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 focus:bg-white/90 transition-all duration-300 shadow-sm"
                      >
                        <option>Clinic</option>
                        <option>Pharmacy</option>
                        <option>Laboratory</option>
                        <option>Emergency & Trauma</option>
                      </Select>
                    </div>
                  </div>

                  {/* Visit Type Card */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-xl p-5 border border-white/60 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Visit Type</h4>
                          <p className="text-xs text-slate-600">Type of visit</p>
                        </div>
                      </div>
                      <Select name="visitType" defaultValue="Walk In" className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 focus:bg-white/90 transition-all duration-300 shadow-sm">
                        <option>Medical Appointment</option>
                        <option>Walk In</option>
                        <option>Pharmaceutical Supply Collection</option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Clinic Type - Conditional */}
                {selectedDepartment === "Clinic" && (
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-xl p-5 border border-white/60 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Clinic Type</h4>
                          <p className="text-xs text-slate-600">Medical specialty</p>
                        </div>
                      </div>
                      <Select name="clinicType" defaultValue="General Medicine" className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 focus:bg-white/90 transition-all duration-300 shadow-sm">
                        <option>General Medicine</option>
                        <option>Ophthalmology</option>
                        <option>Cardiology</option>
                        <option>Nephrology</option>
                        <option>Neurology</option>
                        <option>Dermatology</option>
                        <option>Orthopedics</option>
                        <option>Gynecology</option>
                        <option>Pediatrics</option>
                        <option>Psychiatry</option>
                        <option>Oncology</option>
                        <option>Endocrinology</option>
                        <option>Gastroenterology</option>
                        <option>Pulmonology</option>
                        <option>Urology</option>
                        <option>ENT (Ear, Nose & Throat)</option>
                        <option>Rheumatology</option>
                        <option>Infectious Diseases</option>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Doctor Field */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white/90 backdrop-blur-xl rounded-xl p-5 border border-white/60 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Doctor (Optional)</h4>
                        <p className="text-xs text-slate-600">Assigning doctor</p>
                      </div>
                    </div>
                    <Input name="doctor" placeholder="e.g., Dr. Nur" className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 focus:bg-white/90 transition-all duration-300 shadow-sm" />
                  </div>
                </div>

                {/* Reason Field - Required */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-rose-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white/90 backdrop-blur-xl rounded-xl p-5 border border-white/60 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-400 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Reason for Visit <span className="text-red-500">*</span></h4>
                        <p className="text-xs text-slate-600">Chief complaint or reason</p>
                      </div>
                    </div>
                    <TextArea name="reason" placeholder="e.g., Fever 2 days, cough, sore throat" className="w-full bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-400 focus:bg-white/90 transition-all duration-300 shadow-sm" required />
                  </div>
                </div>

                {/* Action Footer */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 rounded-3xl blur opacity-30"></div>
                  <div className="relative bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-2xl">
                    <div className="flex items-center justify-between gap-6">
                      {/* Status Info */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white animate-bounce"></div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-800">Ready to Register</div>
                          <div className="text-sm text-slate-600">Status will start at <span className="font-semibold text-green-600">Registered</span></div>
                          <div className="text-xs text-slate-500 mt-1">Patient will be added to the queue</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button 
                          type="button" 
                          onClick={() => setDrawerOpen(false)}
                          className="group px-8 py-4 rounded-2xl border-2 border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 font-semibold transform hover:scale-105"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </div>
                        </button>
                        <button 
                          type="submit"
                          className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                          <div className="relative flex items-center gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            Create Visit
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 px-4 py-3 text-sm shadow-lg text-slate-800">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}


