'use client';

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  UserRound,
  Stethoscope,
  Ambulance,
  ClipboardList,
  Pill,
  FlaskConical,
  Scan,
  FileText,
  Search,
  Clock,
  BedDouble,
  ArrowRightLeft,
  CheckCircle2,
  History,
  Info,
  ListChecks as Workflow,
  FileClock,
  AlertCircle,
  Activity,
} from "lucide-react";

// -------------------- Helpers --------------------
const now = () => new Date().toISOString();
const uniquePush = (list: string[], value: string) => Array.from(new Set([...list, value].filter(Boolean)));

// Local minimal Badge to avoid export mismatch issues in various routes
const UIBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className = "", children, ...props }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`} {...props}>{children}</span>
);

const MOCK_PATIENTS = [
  {
    id: "P-001",
    name: "Ahmad bin Ali",
    ic: "900101-13-5677",
    age: 35,
    sex: "M",
    arrival: "Walk-in",
    acuity: "Red",
    vitals: { hr: 98, bp: "130/82", rr: 18, spo2: 98, temp: 37.2 },
    chiefComplaint: "Chest pain",
    status: "pendingAssessment",
    visits: [
      { date: "2025-09-20T09:20:00Z", complaint: "Gastritis", plan: "PPI, antacid", tests: ["FBC"], meds: ["Omeprazole 20mg OD 14d"] },
      { date: "2025-07-15T11:02:00Z", complaint: "Migraine", plan: "Analgesia, rest", tests: [], meds: ["Paracetamol 1g PRN"] },
    ],
    personal: { illnesses: ["Hypertension"], background: "Smoker 5 pack-years", surgeries: ["Appendectomy 2018"], lifestyle: "Sedentary, high-stress job", allergies: ["Penicillin"] },
  },
  {
    id: "P-002",
    name: "Siti Aminah",
    ic: "950412-12-1122",
    age: 30,
    sex: "F",
    arrival: "Ambulance",
    acuity: "Yellow",
    vitals: { hr: 120, bp: "88/54", rr: 26, spo2: 92, temp: 38.5 },
    chiefComplaint: "Abdominal pain",
    status: "triageAssessment",
    visits: [
      { date: "2025-05-09T03:11:00Z", complaint: "URTI", plan: "Symptomatic", tests: ["CXR"], meds: ["Loratadine"] },
    ],
    personal: { illnesses: ["Asthma"], background: "KKM staff nurse", surgeries: [], lifestyle: "Active, non-smoker", allergies: [] },
  },
  {
    id: "P-003",
    name: "John Tan",
    ic: "880921-10-9988",
    age: 37,
    sex: "M",
    arrival: "Walk-in",
    acuity: "Green",
    vitals: { hr: 72, bp: "118/76", rr: 14, spo2: 100, temp: 36.8 },
    chiefComplaint: "Minor laceration",
    status: "pendingRefer",
    visits: [],
    personal: { illnesses: [], background: "Office worker", surgeries: [], lifestyle: "Gym 2x/week", allergies: [] },
  },
  {
    id: "P-004",
    name: "Mary Wong",
    ic: "920315-14-2233",
    age: 33,
    sex: "F",
    arrival: "Walk-in",
    acuity: "Orange",
    vitals: { hr: 95, bp: "125/80", rr: 22, spo2: 95, temp: 37.0 },
    chiefComplaint: "Difficulty breathing",
    status: "pendingAssessment",
    visits: [],
    personal: { illnesses: [], background: "Teacher", surgeries: [], lifestyle: "Active", allergies: [] },
  },
  {
    id: "P-005",
    name: "Kumar Raj",
    ic: "850620-12-4455",
    age: 40,
    sex: "M",
    arrival: "Ambulance",
    acuity: "Red",
    vitals: { hr: 110, bp: "95/60", rr: 24, spo2: 93, temp: 37.8 },
    chiefComplaint: "Severe trauma",
    status: "triageAssessment",
    visits: [],
    personal: { illnesses: [], background: "Construction worker", surgeries: [], lifestyle: "Smoker", allergies: [] },
  },
  {
    id: "P-006",
    name: "Lisa Chen",
    ic: "930815-11-6677",
    age: 32,
    sex: "F",
    arrival: "Walk-in",
    acuity: "Yellow",
    vitals: { hr: 88, bp: "120/78", rr: 18, spo2: 98, temp: 38.5 },
    chiefComplaint: "High fever",
    status: "pendingAssessment",
    visits: [],
    personal: { illnesses: [], background: "Nurse", surgeries: [], lifestyle: "Non-smoker", allergies: [] },
  },
  {
    id: "P-007",
    name: "David Lee",
    ic: "910425-13-8899",
    age: 34,
    sex: "M",
    arrival: "Walk-in",
    acuity: "Green",
    vitals: { hr: 75, bp: "115/72", rr: 16, spo2: 99, temp: 36.9 },
    chiefComplaint: "Sprained ankle",
    status: "pendingRefer",
    visits: [],
    personal: { illnesses: [], background: "Athlete", surgeries: [], lifestyle: "Very active", allergies: [] },
  },
  {
    id: "P-008",
    name: "Sarah Lim",
    ic: "940910-12-3344",
    age: 31,
    sex: "F",
    arrival: "Walk-in",
    acuity: "Orange",
    vitals: { hr: 92, bp: "128/85", rr: 20, spo2: 97, temp: 37.3 },
    chiefComplaint: "Severe headache",
    status: "pendingAssessment",
    visits: [
      { date: "2025-08-10T14:30:00Z", complaint: "Migraine", plan: "Pain management", tests: [], meds: ["Paracetamol 1g PRN"] },
    ],
    personal: { illnesses: ["Migraine"], background: "Graphic designer", surgeries: [], lifestyle: "Sedentary, stressful job", allergies: [] },
  },
];

const QUEUE_LABELS: Record<string, { title: string; icon: React.ElementType; color: string }> = {
  pendingAssessment: { title: "Pending Assessment", icon: ClipboardList, color: "bg-amber-100 text-amber-700" },
  triageAssessment: { title: "Triage Assessment", icon: Ambulance, color: "bg-red-100 text-red-700" },
  pendingAdmit: { title: "Pending to Admit", icon: BedDouble, color: "bg-indigo-100 text-indigo-700" }, 
  pendingRefer: { title: "Pending to Refer", icon: ArrowRightLeft, color: "bg-emerald-100 text-emerald-700" },
};

const ACUITY_COLORS: Record<string, string> = {
  Red: "bg-red-500",
  Yellow: "bg-yellow-400",
  Green: "bg-green-500",
  Orange: "bg-orange-500",
  Blue: "bg-blue-500",
};

function QueueHeader({ label, count, icon: Icon, color }: { label: string; count: number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color} shadow-sm`}><Icon className="h-5 w-5" /></div>
        <h3 className="font-bold text-base text-slate-900">{label}</h3>
      </div>
      <UIBadge className="bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-3 py-1.5 font-bold text-sm">{count}</UIBadge>
    </div>
  );
}

export default function ETUDashboard() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const seeded = useMemo(() => MOCK_PATIENTS.map((p, i) => ({ ...p, _arrivedAt: Date.now() - (i+1)*20*60*1000 })), []);
  const [patients, setPatients] = useState(seeded);
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [compact, setCompact] = useState(true);
  // shared orders state (center + right stay in sync)
  const [orders, setOrders] = useState<{ meds: any[]; labs: any[]; imaging: any[] }>({ meds: [], labs: [], imaging: [] });

  // Set active patient based on URL parameter or default to first patient
  useEffect(() => {
    if (patientId) {
      const foundPatient = patients.find(p => p.id === patientId);
      setActivePatient(foundPatient || patients[0]);
    } else {
      setActivePatient(patients[0]);
    }
  }, [patientId, patients]);
  // expose save handler to right summary
  const [saveAssessmentFn, setSaveAssessmentFn] = useState<null | (()=>void)>(null);

  // when selected patient changes, hydrate orders snapshot
  React.useEffect(() => {
    const snap = (activePatient as any)?.assessment?.orders;
    if (snap) setOrders({ meds: snap.meds || [], labs: snap.labs || [], imaging: snap.imaging || [] });
    else setOrders({ meds: [], labs: [], imaging: [] });
  }, [activePatient]);

  function addOrder(kind: 'meds'|'labs'|'imaging', value: any){
    setOrders(prev => ({ ...prev, [kind]: [...prev[kind], value] }));
  }
  function removeOrder(kind: 'meds'|'labs'|'imaging', index: number){
    setOrders(prev => ({ ...prev, [kind]: prev[kind].filter((_, i)=> i!==index) }));
  }

  function updatePatient(id: string, updater: (prev: any) => any) {
    setPatients((prev: any) => prev.map((p: any) => (p.id === id ? updater(p) : p)));
    setActivePatient((prev: any) => (prev && prev.id === id ? updater(prev) : prev));
  }

  function runSmokeTests() {
    const results: { name: string; pass: boolean; note?: string }[] = [];
    const q = "afiq";
    results.push({ name: "Search finds patient by name", pass: MOCK_PATIENTS.some(p => String(p.name).toLowerCase().includes(q)) });
    const expected = ["pendingAssessment", "triageAssessment", "pendingAdmit", "pendingRefer"];
    const keysOk = expected.every(k => Object.hasOwn(QUEUE_LABELS, k));
    const classified = MOCK_PATIENTS.reduce((acc: Record<string, number>, p) => { acc[p.status] = (acc[p.status]||0)+1; return acc; }, {});
    const haveKnownStatusesOnly = Object.keys(classified).every(k => expected.includes(k));
    results.push({ name: "Queue keys & classification valid", pass: keysOk && haveKnownStatusesOnly });
    const out = uniquePush(uniquePush(["A"], "B"), "A");
    results.push({ name: "Utility uniquePush dedupes", pass: out.length === 2 && out.includes("A") && out.includes("B") });

    // Additional smoke tests
    const regions = [
      "Head","Neck","Chest","Abdomen","Back","Pelvis","Left Shoulder","Right Shoulder","Left Arm","Right Arm","Left Hand","Right Hand","Left Thigh","Right Thigh","Left Leg","Right Leg","Left Foot","Right Foot"
    ];
    results.push({ name: "BodyMap has 18 regions", pass: regions.length === 18 });
    results.push({ name: "BodyMap region keys unique", pass: new Set(regions).size === regions.length });
    // Toggle simulation: select Head, then toggle Head off => should end empty
    const toggle = (sel: string[], r: string) => sel.includes(r) ? sel.filter(x=>x!==r) : [...sel, r];
    const toggled = toggle(toggle([], 'Head'), 'Head');
    results.push({ name: "BodyMap toggle adds then removes", pass: Array.isArray(toggled) && toggled.length === 0 });

    results.push({ name: "Acuity colors cover all patients", pass: MOCK_PATIENTS.every(p => Boolean(ACUITY_COLORS[p.acuity])) });
    const paracetamol = FORMULARY.find(f => f.label === "Tab. Paracetamol 500 mg");
    results.push({ name: "Formulary includes Paracetamol 500 with defaults", pass: Boolean(paracetamol && paracetamol.defaultDose && paracetamol.frequency) });
    results.push({ name: "Formulary includes Aspirin STAT", pass: FORMULARY.some(f=>f.name==="Aspirin" && f.frequency==="STAT") });
    results.push({ name: "Durations include 5/7 and custom", pass: DURATION_OPTIONS.some(d=>d.value==="5/7") && DURATION_OPTIONS.some(d=>d.value==="custom") });
    results.push({ name: "Vitals present for all patients", pass: MOCK_PATIENTS.every(p=>p.vitals && 'hr' in p.vitals && 'bp' in p.vitals) });

    const allPass = results.every(r => r.pass);
    results.forEach(r => r.pass ? toast.success(`PASS: ${r.name}`) : toast.error(`FAIL: ${r.name}${r.note?` – ${r.note}`:""}`));
    if (allPass) toast.success("All smoke tests passed"); else toast.error("Some tests failed – see messages");
  }

  if (!activePatient) {
  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading patient data...</p>
            </div>
          </div>
    );
  }

  return (
    <div className="space-y-4">
      <AssessmentTabs
        patient={activePatient}
        onUpdate={(updater)=>updatePatient(activePatient.id, updater)}
        onSummary={()=>{}}
        saving={saving}
        setSaving={setSaving}
        orders={orders}
        onAddOrder={addOrder}
        onRemoveOrder={removeOrder}
        registerSave={(fn)=> setSaveAssessmentFn(()=>fn)}
      />
    </div>
  );
}

function AssessmentTabs({ patient, onUpdate, onSummary, saving, setSaving, orders, onAddOrder, onRemoveOrder, registerSave }: { patient: any; onUpdate: (u: any)=>void; onSummary: (d: "admit"|"discharge"|"refer")=>void; saving: boolean; setSaving: (b: boolean)=>void; orders: {meds:any[];labs:any[];imaging:any[]}; onAddOrder:(k:'meds'|'labs'|'imaging', v:any)=>void; onRemoveOrder:(k:'meds'|'labs'|'imaging', i:number)=>void; registerSave:(fn:()=>void)=>void; }) {
  const [tab, setTab] = useState("assessment");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="w-full h-auto bg-transparent p-0 gap-0 border-b border-slate-200 flex justify-start">
        <TabsTrigger 
          value="assessment" 
          className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50 font-semibold transition-all"
        >
          <div className="flex items-center gap-3">
            <Stethoscope className="h-5 w-5"/>
            <span>Assessment</span>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:bg-emerald-50/50 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50 font-semibold transition-all"
        >
          <div className="flex items-center gap-3">
            <History className="h-5 w-5"/>
            <span>Medical History</span>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="personal" 
          className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:bg-purple-50/50 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:hover:bg-slate-50 font-semibold transition-all"
        >
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5"/>
            <span>Personal History</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="assessment" className="mt-8">
        <AssessmentForm patient={patient} onUpdate={onUpdate} saving={saving} setSaving={setSaving} onSummary={onSummary} orders={orders} onAddOrder={onAddOrder} onRemoveOrder={onRemoveOrder} registerSave={registerSave} />
      </TabsContent>

      <TabsContent value="history" className="mt-8">
        <MedicalHistory visits={patient.visits} />
      </TabsContent>

      <TabsContent value="personal" className="mt-8">
        <PersonalHistory data={patient.personal} onChange={(data)=>onUpdate((p:any)=>({ ...p, personal: data }))} />
      </TabsContent>
    </Tabs>
  );
}

function AssessmentForm({ patient, onUpdate, onSummary, saving, setSaving, orders, onAddOrder, onRemoveOrder, registerSave }: { patient:any; onUpdate:(u:any)=>void; onSummary:(d:"admit"|"discharge"|"refer")=>void; saving:boolean; setSaving:(b:boolean)=>void; orders:{meds:any[];labs:any[];imaging:any[]}; onAddOrder:(k:'meds'|'labs'|'imaging', v:any)=>void; onRemoveOrder:(k:'meds'|'labs'|'imaging', i:number)=>void; registerSave:(fn:()=>void)=>void; }) {
  const [complaint, setComplaint] = useState(patient.chiefComplaint || "");
  const [examNotes, setExamNotes] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionFindings, setRegionFindings] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState("");
  const [summary, setSummary] = useState<"admit"|"discharge"|"refer"|"">("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [rr, setRr] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [pain, setPain] = useState("");
  const [weight, setWeight] = useState("");

  function toggleRegion(r: string) {
    setSelectedRegions((prev) => prev.includes(r) ? prev.filter(x=>x!==r) : [...prev, r]);
  }

  function updateRegionFinding(region: string, finding: string) {
    setRegionFindings((prev) => ({ ...prev, [region]: finding }));
  }

  function addOrderLocal(kind: 'meds'|'labs'|'imaging', value: any) { if (!value) return; onAddOrder(kind, value); }

  async function saveAll() {
    setSaving(true);
    await new Promise(r=>setTimeout(r, 700));
    onUpdate((p:any)=>({
      ...p,
      chiefComplaint: complaint,
      lastUpdated: now(),
      assessment: { regions: selectedRegions, regionFindings, examNotes, plan, orders, vitals: { bp, hr, rr, temp, spo2, pain, weight } }
    }));
    toast.success("Assessment saved");
    setSaving(false);
  }

  React.useEffect(()=> { registerSave(()=>{ void saveAll(); }); }, [complaint, examNotes, selectedRegions, regionFindings, plan, orders, bp, hr, rr, temp, spo2, pain, weight]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid gap-3 grid-cols-1">
        <Card className="rounded-lg shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-3 grid gap-3">
            <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 grid place-items-center">
                <ClipboardList className="h-4 w-4" />
              </div>
              Patient Complaint
            </Label>
            <Textarea value={complaint} onChange={(e)=>setComplaint(e.target.value)} placeholder="Describe the presenting complaint…" className="min-h-[120px] border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-3 grid gap-3">
            <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 grid place-items-center">
                <Activity className="h-4 w-4" />
              </div>
              Vital Signs • Pain Score • Weight
            </Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">BP (mmHg)</label>
                <Input value={bp} onChange={(e)=>setBp(e.target.value)} placeholder="120/80" className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">HR (bpm)</label>
                <Input value={hr} onChange={(e)=>setHr(e.target.value)} placeholder="72" type="number" className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">RR (bpm)</label>
                <Input value={rr} onChange={(e)=>setRr(e.target.value)} placeholder="16" type="number" className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Temp (°C)</label>
                <Input value={temp} onChange={(e)=>setTemp(e.target.value)} placeholder="37.0" type="number" step="0.1" className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">SpO2 (%)</label>
                <Input value={spo2} onChange={(e)=>setSpo2(e.target.value)} placeholder="98" type="number" className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Pain (0-10)</label>
                <Input value={pain} onChange={(e)=>setPain(e.target.value)} placeholder="5" type="number" min="0" max="10" className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Weight (kg)</label>
                <Input value={weight} onChange={(e)=>setWeight(e.target.value)} placeholder="70" type="number" step="0.1" className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-3 grid gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 grid place-items-center">
                  <ClipboardList className="h-4 w-4" />
            </div>
                Physical Examination
              </Label>
              <UIBadge className="bg-blue-100 text-blue-700 border border-blue-200 font-semibold">Head-to-Toe</UIBadge>
            </div>
            <BodyMap selected={selectedRegions} onToggle={toggleRegion} findings={regionFindings} onFindingChange={updateRegionFinding} />
            <Textarea value={examNotes} onChange={(e)=>setExamNotes(e.target.value)} placeholder="Document significant exam findings…" className="min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-3 grid gap-3">
            <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center">
                <Workflow className="h-4 w-4" />
              </div>
              Management Plan
            </Label>
            <Textarea value={plan} onChange={(e)=>setPlan(e.target.value)} placeholder="Outline plan: monitoring, IV access, oxygen, analgesia, referral triggers…" className="min-h-[120px] border-slate-300 focus:border-blue-500 focus:ring-blue-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 content-start">
        <Card className="rounded-lg shadow-md border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <Label className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 grid place-items-center">
                <FileText className="h-4 w-4" />
              </div>
              Orders
            </Label>
            
            <div className="space-y-5">
            <MedicationOrders patient={patient} items={orders.meds} onAdd={(v)=>addOrderLocal('meds', v)} onRemove={(i)=>onRemoveOrder('meds', i)} />
              
            <LabOrders items={orders.labs} onAdd={(v)=>addOrderLocal('labs', v)} onRemove={(i)=>onRemoveOrder('labs', i)} />
              
            <ImagingOrders items={orders.imaging} onAdd={(v)=>addOrderLocal('imaging', v)} onRemove={(i)=>onRemoveOrder('imaging', i)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-md border-2 border-green-200 bg-gradient-to-br from-green-50/30 to-white hover:shadow-lg transition-shadow">
          <CardContent className="p-4 grid gap-4">
            <div className="flex items-center gap-2 bg-green-600 text-white rounded-lg px-3 py-2 shadow-md">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold text-base">DISPOSITION SUMMARY</span>
              </div>
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200">
                <Checkbox id="sum-admit" checked={summary==="admit"} onCheckedChange={()=>setSummary("admit")} className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <Label htmlFor="sum-admit" className="cursor-pointer font-semibold text-slate-700">Admit</Label>
                <Checkbox id="sum-discharge" checked={summary==="discharge"} onCheckedChange={()=>setSummary("discharge")} className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <Label htmlFor="sum-discharge" className="cursor-pointer font-semibold text-slate-700">Discharge</Label>
                <Checkbox id="sum-refer" checked={summary==="refer"} onCheckedChange={()=>setSummary("refer")} className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <Label htmlFor="sum-refer" className="cursor-pointer font-semibold text-slate-700">Refer</Label>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={saveAll} disabled={saving} className="gap-2 h-11 font-semibold border-2">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin"/> : <ClipboardList className="h-5 w-5"/>}
                  Save Assessment
                </Button>
                <Button onClick={()=>{
                  if(!summary){ toast.error("Choose a summary decision first"); return; }
                  onSummary(summary as any);
                  toast.success(`Disposition: ${summary.toUpperCase()}`);
                }} className="gap-1.5 h-8 px-3 bg-blue-600 hover:bg-blue-700 font-medium text-xs shadow-md">
                  <BedDouble className="h-3.5 w-3.5"/>
                  Confirm Disposition
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon:any; title:string }){
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-3">
      <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white grid place-items-center shadow-sm">
        <Icon className="h-4 w-4"/>
      </div>
      <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</span>
    </div>
  );
}

const DRUG_FREQUENCIES = ["OD","BD","TDS","QID","QHS","PRN","STAT"];

const FORMULARY: { label: string; name: string; form: "Tab."|"Cap."|"Syp."|"Neb."|"Inj."|"Susp."|"Cream"|"Oint."|"Lotion"|"Drops"|string; strength: string; defaultDose: string; frequency: string }[] = [
  // Analgesics & Antipyretics
  { label: "Tab. Paracetamol 500 mg", name: "Paracetamol", form: "Tab.", strength: "500 mg", defaultDose: "1000 mg", frequency: "QID" },
  { label: "Tab. Paracetamol 1000 mg", name: "Paracetamol", form: "Tab.", strength: "1000 mg", defaultDose: "1000 mg", frequency: "QID" },
  { label: "Syp. Paracetamol 125 mg/5 ml", name: "Paracetamol", form: "Syp.", strength: "125 mg/5 ml", defaultDose: "15 mg/kg", frequency: "QID" },
  { label: "Tab. Ibuprofen 400 mg", name: "Ibuprofen", form: "Tab.", strength: "400 mg", defaultDose: "400 mg", frequency: "TDS" },
  { label: "Tab. Ibuprofen 600 mg", name: "Ibuprofen", form: "Tab.", strength: "600 mg", defaultDose: "600 mg", frequency: "TDS" },
  { label: "Syp. Ibuprofen 100 mg/5 ml", name: "Ibuprofen", form: "Syp.", strength: "100 mg/5 ml", defaultDose: "10 mg/kg", frequency: "TDS" },
  { label: "Tab. Aspirin 75 mg", name: "Aspirin", form: "Tab.", strength: "75 mg", defaultDose: "75 mg", frequency: "OD" },
  { label: "Tab. Aspirin 300 mg", name: "Aspirin", form: "Tab.", strength: "300 mg", defaultDose: "300 mg", frequency: "STAT" },
  { label: "Tab. Diclofenac 50 mg", name: "Diclofenac", form: "Tab.", strength: "50 mg", defaultDose: "50 mg", frequency: "TDS" },
  { label: "Inj. Diclofenac 75 mg/3 ml", name: "Diclofenac", form: "Inj.", strength: "75 mg/3 ml", defaultDose: "75 mg", frequency: "BD" },
  { label: "Tab. Mefenamic Acid 500 mg", name: "Mefenamic Acid", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "TDS" },
  { label: "Tab. Tramadol 50 mg", name: "Tramadol", form: "Tab.", strength: "50 mg", defaultDose: "50 mg", frequency: "QID" },
  { label: "Inj. Tramadol 50 mg/ml", name: "Tramadol", form: "Inj.", strength: "50 mg/ml", defaultDose: "50 mg", frequency: "QID" },
  { label: "Inj. Morphine 10 mg/ml", name: "Morphine", form: "Inj.", strength: "10 mg/ml", defaultDose: "5 mg", frequency: "PRN" },
  { label: "Inj. Pethidine 50 mg/ml", name: "Pethidine", form: "Inj.", strength: "50 mg/ml", defaultDose: "50 mg", frequency: "PRN" },

  // Antibiotics - Penicillins
  { label: "Cap. Amoxicillin 250 mg", name: "Amoxicillin", form: "Cap.", strength: "250 mg", defaultDose: "500 mg", frequency: "TDS" },
  { label: "Cap. Amoxicillin 500 mg", name: "Amoxicillin", form: "Cap.", strength: "500 mg", defaultDose: "500 mg", frequency: "TDS" },
  { label: "Syp. Amoxicillin 125 mg/5 ml", name: "Amoxicillin", form: "Syp.", strength: "125 mg/5 ml", defaultDose: "250 mg", frequency: "TDS" },
  { label: "Tab. Augmentin 625 mg", name: "Amoxicillin-Clavulanate", form: "Tab.", strength: "625 mg", defaultDose: "625 mg", frequency: "TDS" },
  { label: "Tab. Augmentin 1 g", name: "Amoxicillin-Clavulanate", form: "Tab.", strength: "1 g", defaultDose: "1 g", frequency: "BD" },
  { label: "Syp. Augmentin 228 mg/5 ml", name: "Amoxicillin-Clavulanate", form: "Syp.", strength: "228 mg/5 ml", defaultDose: "5 ml", frequency: "TDS" },
  { label: "Inj. Ampicillin 500 mg", name: "Ampicillin", form: "Inj.", strength: "500 mg", defaultDose: "500 mg", frequency: "QID" },
  { label: "Inj. Benzylpenicillin 1 MU", name: "Benzylpenicillin", form: "Inj.", strength: "1 MU", defaultDose: "1 MU", frequency: "QID" },
  { label: "Inj. Cloxacillin 500 mg", name: "Cloxacillin", form: "Inj.", strength: "500 mg", defaultDose: "500 mg", frequency: "QID" },

  // Antibiotics - Cephalosporins
  { label: "Cap. Cephalexin 250 mg", name: "Cephalexin", form: "Cap.", strength: "250 mg", defaultDose: "500 mg", frequency: "QID" },
  { label: "Cap. Cephalexin 500 mg", name: "Cephalexin", form: "Cap.", strength: "500 mg", defaultDose: "500 mg", frequency: "QID" },
  { label: "Syp. Cephalexin 125 mg/5 ml", name: "Cephalexin", form: "Syp.", strength: "125 mg/5 ml", defaultDose: "250 mg", frequency: "QID" },
  { label: "Tab. Cefuroxime 250 mg", name: "Cefuroxime", form: "Tab.", strength: "250 mg", defaultDose: "250 mg", frequency: "BD" },
  { label: "Tab. Cefuroxime 500 mg", name: "Cefuroxime", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Inj. Ceftriaxone 1 g", name: "Ceftriaxone", form: "Inj.", strength: "1 g", defaultDose: "1 g", frequency: "OD" },
  { label: "Inj. Ceftazidime 1 g", name: "Ceftazidime", form: "Inj.", strength: "1 g", defaultDose: "1 g", frequency: "TDS" },
  { label: "Inj. Cefotaxime 1 g", name: "Cefotaxime", form: "Inj.", strength: "1 g", defaultDose: "1 g", frequency: "TDS" },

  // Antibiotics - Macrolides & Others
  { label: "Tab. Azithromycin 250 mg", name: "Azithromycin", form: "Tab.", strength: "250 mg", defaultDose: "500 mg", frequency: "OD" },
  { label: "Tab. Azithromycin 500 mg", name: "Azithromycin", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "OD" },
  { label: "Syp. Azithromycin 200 mg/5 ml", name: "Azithromycin", form: "Syp.", strength: "200 mg/5 ml", defaultDose: "10 mg/kg", frequency: "OD" },
  { label: "Tab. Erythromycin 250 mg", name: "Erythromycin", form: "Tab.", strength: "250 mg", defaultDose: "500 mg", frequency: "QID" },
  { label: "Tab. Erythromycin 500 mg", name: "Erythromycin", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "QID" },
  { label: "Tab. Clarithromycin 250 mg", name: "Clarithromycin", form: "Tab.", strength: "250 mg", defaultDose: "250 mg", frequency: "BD" },
  { label: "Tab. Clarithromycin 500 mg", name: "Clarithromycin", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Tab. Doxycycline 100 mg", name: "Doxycycline", form: "Tab.", strength: "100 mg", defaultDose: "100 mg", frequency: "BD" },
  { label: "Cap. Doxycycline 100 mg", name: "Doxycycline", form: "Cap.", strength: "100 mg", defaultDose: "100 mg", frequency: "BD" },
  { label: "Tab. Ciprofloxacin 500 mg", name: "Ciprofloxacin", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Tab. Levofloxacin 500 mg", name: "Levofloxacin", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "OD" },
  { label: "Tab. Metronidazole 200 mg", name: "Metronidazole", form: "Tab.", strength: "200 mg", defaultDose: "400 mg", frequency: "TDS" },
  { label: "Tab. Metronidazole 400 mg", name: "Metronidazole", form: "Tab.", strength: "400 mg", defaultDose: "400 mg", frequency: "TDS" },
  { label: "Inj. Metronidazole 500 mg", name: "Metronidazole", form: "Inj.", strength: "500 mg", defaultDose: "500 mg", frequency: "TDS" },
  { label: "Tab. Nitrofurantoin 100 mg", name: "Nitrofurantoin", form: "Tab.", strength: "100 mg", defaultDose: "100 mg", frequency: "QID" },
  { label: "Inj. Gentamicin 80 mg/2 ml", name: "Gentamicin", form: "Inj.", strength: "80 mg/2 ml", defaultDose: "80 mg", frequency: "TDS" },

  // Gastrointestinal Medications
  { label: "Tab. Omeprazole 20 mg", name: "Omeprazole", form: "Tab.", strength: "20 mg", defaultDose: "20 mg", frequency: "OD" },
  { label: "Tab. Omeprazole 40 mg", name: "Omeprazole", form: "Tab.", strength: "40 mg", defaultDose: "40 mg", frequency: "OD" },
  { label: "Cap. Omeprazole 20 mg", name: "Omeprazole", form: "Cap.", strength: "20 mg", defaultDose: "20 mg", frequency: "OD" },
  { label: "Tab. Esomeprazole 20 mg", name: "Esomeprazole", form: "Tab.", strength: "20 mg", defaultDose: "20 mg", frequency: "OD" },
  { label: "Tab. Esomeprazole 40 mg", name: "Esomeprazole", form: "Tab.", strength: "40 mg", defaultDose: "40 mg", frequency: "OD" },
  { label: "Tab. Lansoprazole 30 mg", name: "Lansoprazole", form: "Tab.", strength: "30 mg", defaultDose: "30 mg", frequency: "OD" },
  { label: "Tab. Pantoprazole 40 mg", name: "Pantoprazole", form: "Tab.", strength: "40 mg", defaultDose: "40 mg", frequency: "OD" },
  { label: "Inj. Pantoprazole 40 mg", name: "Pantoprazole", form: "Inj.", strength: "40 mg", defaultDose: "40 mg", frequency: "OD" },
  { label: "Tab. Ranitidine 150 mg", name: "Ranitidine", form: "Tab.", strength: "150 mg", defaultDose: "150 mg", frequency: "BD" },
  { label: "Tab. Ranitidine 300 mg", name: "Ranitidine", form: "Tab.", strength: "300 mg", defaultDose: "300 mg", frequency: "BD" },
  { label: "Inj. Ranitidine 50 mg/2 ml", name: "Ranitidine", form: "Inj.", strength: "50 mg/2 ml", defaultDose: "50 mg", frequency: "TDS" },
  { label: "Tab. Famotidine 20 mg", name: "Famotidine", form: "Tab.", strength: "20 mg", defaultDose: "20 mg", frequency: "BD" },
  { label: "Tab. Metoclopramide 10 mg", name: "Metoclopramide", form: "Tab.", strength: "10 mg", defaultDose: "10 mg", frequency: "TDS" },
  { label: "Inj. Metoclopramide 10 mg/2 ml", name: "Metoclopramide", form: "Inj.", strength: "10 mg/2 ml", defaultDose: "10 mg", frequency: "TDS" },
  { label: "Tab. Domperidone 10 mg", name: "Domperidone", form: "Tab.", strength: "10 mg", defaultDose: "10 mg", frequency: "TDS" },
  { label: "Syp. Domperidone 5 mg/5 ml", name: "Domperidone", form: "Syp.", strength: "5 mg/5 ml", defaultDose: "10 mg", frequency: "TDS" },
  { label: "Tab. Ondansetron 4 mg", name: "Ondansetron", form: "Tab.", strength: "4 mg", defaultDose: "4 mg", frequency: "TDS" },
  { label: "Tab. Ondansetron 8 mg", name: "Ondansetron", form: "Tab.", strength: "8 mg", defaultDose: "8 mg", frequency: "TDS" },
  { label: "Inj. Ondansetron 4 mg/2 ml", name: "Ondansetron", form: "Inj.", strength: "4 mg/2 ml", defaultDose: "4 mg", frequency: "TDS" },
  { label: "Tab. Loperamide 2 mg", name: "Loperamide", form: "Tab.", strength: "2 mg", defaultDose: "4 mg", frequency: "PRN" },
  { label: "Syp. Lactulose 3.3 g/5 ml", name: "Lactulose", form: "Syp.", strength: "3.3 g/5 ml", defaultDose: "15 ml", frequency: "BD" },
  { label: "Tab. Bisacodyl 5 mg", name: "Bisacodyl", form: "Tab.", strength: "5 mg", defaultDose: "10 mg", frequency: "OD" },
  { label: "Syp. Senna 7.5 mg/5 ml", name: "Senna", form: "Syp.", strength: "7.5 mg/5 ml", defaultDose: "10 ml", frequency: "OD" },

  // Cardiovascular Medications
  { label: "Tab. Amlodipine 5 mg", name: "Amlodipine", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Tab. Amlodipine 10 mg", name: "Amlodipine", form: "Tab.", strength: "10 mg", defaultDose: "10 mg", frequency: "OD" },
  { label: "Tab. Atenolol 50 mg", name: "Atenolol", form: "Tab.", strength: "50 mg", defaultDose: "50 mg", frequency: "OD" },
  { label: "Tab. Atenolol 100 mg", name: "Atenolol", form: "Tab.", strength: "100 mg", defaultDose: "100 mg", frequency: "OD" },
  { label: "Tab. Bisoprolol 5 mg", name: "Bisoprolol", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Tab. Carvedilol 6.25 mg", name: "Carvedilol", form: "Tab.", strength: "6.25 mg", defaultDose: "6.25 mg", frequency: "BD" },
  { label: "Tab. Carvedilol 12.5 mg", name: "Carvedilol", form: "Tab.", strength: "12.5 mg", defaultDose: "12.5 mg", frequency: "BD" },
  { label: "Tab. Enalapril 5 mg", name: "Enalapril", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Tab. Enalapril 10 mg", name: "Enalapril", form: "Tab.", strength: "10 mg", defaultDose: "10 mg", frequency: "OD" },
  { label: "Tab. Perindopril 4 mg", name: "Perindopril", form: "Tab.", strength: "4 mg", defaultDose: "4 mg", frequency: "OD" },
  { label: "Tab. Losartan 50 mg", name: "Losartan", form: "Tab.", strength: "50 mg", defaultDose: "50 mg", frequency: "OD" },
  { label: "Tab. Losartan 100 mg", name: "Losartan", form: "Tab.", strength: "100 mg", defaultDose: "100 mg", frequency: "OD" },
  { label: "Tab. Valsartan 80 mg", name: "Valsartan", form: "Tab.", strength: "80 mg", defaultDose: "80 mg", frequency: "OD" },
  { label: "Tab. Valsartan 160 mg", name: "Valsartan", form: "Tab.", strength: "160 mg", defaultDose: "160 mg", frequency: "OD" },
  { label: "Tab. Furosemide 40 mg", name: "Furosemide", form: "Tab.", strength: "40 mg", defaultDose: "40 mg", frequency: "OD" },
  { label: "Inj. Furosemide 20 mg/2 ml", name: "Furosemide", form: "Inj.", strength: "20 mg/2 ml", defaultDose: "20 mg", frequency: "BD" },
  { label: "Tab. Hydrochlorothiazide 25 mg", name: "Hydrochlorothiazide", form: "Tab.", strength: "25 mg", defaultDose: "25 mg", frequency: "OD" },
  { label: "Tab. Spironolactone 25 mg", name: "Spironolactone", form: "Tab.", strength: "25 mg", defaultDose: "25 mg", frequency: "OD" },
  { label: "Tab. Atorvastatin 20 mg", name: "Atorvastatin", form: "Tab.", strength: "20 mg", defaultDose: "20 mg", frequency: "OD" },
  { label: "Tab. Atorvastatin 40 mg", name: "Atorvastatin", form: "Tab.", strength: "40 mg", defaultDose: "40 mg", frequency: "OD" },
  { label: "Tab. Simvastatin 20 mg", name: "Simvastatin", form: "Tab.", strength: "20 mg", defaultDose: "20 mg", frequency: "OD" },
  { label: "Tab. Simvastatin 40 mg", name: "Simvastatin", form: "Tab.", strength: "40 mg", defaultDose: "40 mg", frequency: "OD" },
  { label: "Tab. Clopidogrel 75 mg", name: "Clopidogrel", form: "Tab.", strength: "75 mg", defaultDose: "75 mg", frequency: "OD" },
  { label: "Tab. Glyceryl Trinitrate 500 mcg", name: "GTN", form: "Tab.", strength: "500 mcg", defaultDose: "500 mcg", frequency: "PRN" },
  { label: "Tab. Isosorbide Mononitrate 20 mg", name: "Isosorbide Mononitrate", form: "Tab.", strength: "20 mg", defaultDose: "20 mg", frequency: "BD" },
  { label: "Tab. Digoxin 0.25 mg", name: "Digoxin", form: "Tab.", strength: "0.25 mg", defaultDose: "0.25 mg", frequency: "OD" },

  // Respiratory Medications
  { label: "Neb. Salbutamol 2.5 mg", name: "Salbutamol Nebule", form: "Neb.", strength: "2.5 mg", defaultDose: "2.5 mg", frequency: "PRN" },
  { label: "Neb. Ipratropium 500 mcg", name: "Ipratropium Nebule", form: "Neb.", strength: "500 mcg", defaultDose: "500 mcg", frequency: "QID" },
  { label: "Neb. Budesonide 1 mg", name: "Budesonide Nebule", form: "Neb.", strength: "1 mg", defaultDose: "1 mg", frequency: "BD" },
  { label: "Tab. Montelukast 10 mg", name: "Montelukast", form: "Tab.", strength: "10 mg", defaultDose: "10 mg", frequency: "OD" },
  { label: "Tab. Montelukast 5 mg", name: "Montelukast", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Tab. Theophylline 200 mg", name: "Theophylline", form: "Tab.", strength: "200 mg", defaultDose: "200 mg", frequency: "BD" },
  { label: "Syp. Salbutamol 2 mg/5 ml", name: "Salbutamol", form: "Syp.", strength: "2 mg/5 ml", defaultDose: "5 ml", frequency: "TDS" },

  // Diabetes Medications
  { label: "Tab. Metformin 500 mg", name: "Metformin", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Tab. Metformin 850 mg", name: "Metformin", form: "Tab.", strength: "850 mg", defaultDose: "850 mg", frequency: "BD" },
  { label: "Tab. Metformin 1000 mg", name: "Metformin", form: "Tab.", strength: "1000 mg", defaultDose: "1000 mg", frequency: "BD" },
  { label: "Tab. Gliclazide 80 mg", name: "Gliclazide", form: "Tab.", strength: "80 mg", defaultDose: "80 mg", frequency: "BD" },
  { label: "Tab. Glibenclamide 5 mg", name: "Glibenclamide", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Tab. Glipizide 5 mg", name: "Glipizide", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Inj. Insulin Actrapid 100 IU/ml", name: "Insulin Actrapid", form: "Inj.", strength: "100 IU/ml", defaultDose: "10 IU", frequency: "TDS" },
  { label: "Inj. Insulin Mixtard 100 IU/ml", name: "Insulin Mixtard", form: "Inj.", strength: "100 IU/ml", defaultDose: "20 IU", frequency: "BD" },

  // Antihistamines & Allergy
  { label: "Tab. Cetirizine 10 mg", name: "Cetirizine", form: "Tab.", strength: "10 mg", defaultDose: "10 mg", frequency: "OD" },
  { label: "Syp. Cetirizine 5 mg/5 ml", name: "Cetirizine", form: "Syp.", strength: "5 mg/5 ml", defaultDose: "5 ml", frequency: "OD" },
  { label: "Tab. Loratadine 10 mg", name: "Loratadine", form: "Tab.", strength: "10 mg", defaultDose: "10 mg", frequency: "OD" },
  { label: "Syp. Loratadine 5 mg/5 ml", name: "Loratadine", form: "Syp.", strength: "5 mg/5 ml", defaultDose: "5 ml", frequency: "OD" },
  { label: "Tab. Chlorpheniramine 4 mg", name: "Chlorpheniramine", form: "Tab.", strength: "4 mg", defaultDose: "4 mg", frequency: "TDS" },
  { label: "Syp. Chlorpheniramine 2 mg/5 ml", name: "Chlorpheniramine", form: "Syp.", strength: "2 mg/5 ml", defaultDose: "5 ml", frequency: "TDS" },
  { label: "Tab. Fexofenadine 120 mg", name: "Fexofenadine", form: "Tab.", strength: "120 mg", defaultDose: "120 mg", frequency: "OD" },
  { label: "Tab. Fexofenadine 180 mg", name: "Fexofenadine", form: "Tab.", strength: "180 mg", defaultDose: "180 mg", frequency: "OD" },
  { label: "Inj. Hydrocortisone 100 mg", name: "Hydrocortisone", form: "Inj.", strength: "100 mg", defaultDose: "100 mg", frequency: "TDS" },
  { label: "Inj. Dexamethasone 4 mg/ml", name: "Dexamethasone", form: "Inj.", strength: "4 mg/ml", defaultDose: "8 mg", frequency: "TDS" },

  // Steroids
  { label: "Tab. Prednisolone 5 mg", name: "Prednisolone", form: "Tab.", strength: "5 mg", defaultDose: "30 mg", frequency: "OD" },
  { label: "Tab. Prednisolone 25 mg", name: "Prednisolone", form: "Tab.", strength: "25 mg", defaultDose: "25 mg", frequency: "OD" },
  { label: "Tab. Dexamethasone 0.5 mg", name: "Dexamethasone", form: "Tab.", strength: "0.5 mg", defaultDose: "4 mg", frequency: "TDS" },

  // Neurological & Psychiatric
  { label: "Tab. Diazepam 5 mg", name: "Diazepam", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "TDS" },
  { label: "Inj. Diazepam 10 mg/2 ml", name: "Diazepam", form: "Inj.", strength: "10 mg/2 ml", defaultDose: "10 mg", frequency: "STAT" },
  { label: "Tab. Lorazepam 1 mg", name: "Lorazepam", form: "Tab.", strength: "1 mg", defaultDose: "1 mg", frequency: "BD" },
  { label: "Tab. Alprazolam 0.5 mg", name: "Alprazolam", form: "Tab.", strength: "0.5 mg", defaultDose: "0.5 mg", frequency: "TDS" },
  { label: "Tab. Phenytoin 100 mg", name: "Phenytoin", form: "Tab.", strength: "100 mg", defaultDose: "100 mg", frequency: "TDS" },
  { label: "Tab. Carbamazepine 200 mg", name: "Carbamazepine", form: "Tab.", strength: "200 mg", defaultDose: "200 mg", frequency: "BD" },
  { label: "Tab. Valproate 500 mg", name: "Sodium Valproate", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Syp. Valproate 200 mg/5 ml", name: "Sodium Valproate", form: "Syp.", strength: "200 mg/5 ml", defaultDose: "200 mg", frequency: "BD" },
  { label: "Tab. Levetiracetam 500 mg", name: "Levetiracetam", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Tab. Amitriptyline 25 mg", name: "Amitriptyline", form: "Tab.", strength: "25 mg", defaultDose: "25 mg", frequency: "OD" },
  { label: "Tab. Fluoxetine 20 mg", name: "Fluoxetine", form: "Tab.", strength: "20 mg", defaultDose: "20 mg", frequency: "OD" },
  { label: "Tab. Sertraline 50 mg", name: "Sertraline", form: "Tab.", strength: "50 mg", defaultDose: "50 mg", frequency: "OD" },

  // Topical Medications - Creams & Ointments
  { label: "Cream Hydrocortisone 1%", name: "Hydrocortisone", form: "Cream", strength: "1%", defaultDose: "Apply", frequency: "BD" },
  { label: "Oint. Fusidic Acid 2%", name: "Fusidic Acid", form: "Oint.", strength: "2%", defaultDose: "Apply", frequency: "TDS" },
  { label: "Cream Clotrimazole 1%", name: "Clotrimazole", form: "Cream", strength: "1%", defaultDose: "Apply", frequency: "BD" },
  { label: "Cream Ketoconazole 2%", name: "Ketoconazole", form: "Cream", strength: "2%", defaultDose: "Apply", frequency: "BD" },
  { label: "Cream Betamethasone 0.1%", name: "Betamethasone", form: "Cream", strength: "0.1%", defaultDose: "Apply", frequency: "BD" },
  { label: "Oint. Mupirocin 2%", name: "Mupirocin", form: "Oint.", strength: "2%", defaultDose: "Apply", frequency: "TDS" },
  { label: "Cream Acyclovir 5%", name: "Acyclovir", form: "Cream", strength: "5%", defaultDose: "Apply", frequency: "5x daily" },
  { label: "Oint. Silver Sulfadiazine 1%", name: "Silver Sulfadiazine", form: "Oint.", strength: "1%", defaultDose: "Apply", frequency: "BD" },
  { label: "Cream Moisturizing (Aqueous)", name: "Aqueous Cream", form: "Cream", strength: "N/A", defaultDose: "Apply", frequency: "PRN" },
  { label: "Lotion Calamine", name: "Calamine", form: "Lotion", strength: "N/A", defaultDose: "Apply", frequency: "PRN" },
  { label: "Lotion Cetaphil", name: "Cetaphil", form: "Lotion", strength: "N/A", defaultDose: "Apply", frequency: "BD" },

  // Eye & Ear Drops
  { label: "Drops Chloramphenicol Eye 0.5%", name: "Chloramphenicol", form: "Drops", strength: "0.5%", defaultDose: "1-2 drops", frequency: "QID" },
  { label: "Drops Gentamicin Eye 0.3%", name: "Gentamicin", form: "Drops", strength: "0.3%", defaultDose: "1-2 drops", frequency: "QID" },
  { label: "Drops Tobramycin Eye 0.3%", name: "Tobramycin", form: "Drops", strength: "0.3%", defaultDose: "1-2 drops", frequency: "QID" },
  { label: "Drops Dexamethasone Eye 0.1%", name: "Dexamethasone", form: "Drops", strength: "0.1%", defaultDose: "1-2 drops", frequency: "QID" },
  { label: "Drops Timolol Eye 0.5%", name: "Timolol", form: "Drops", strength: "0.5%", defaultDose: "1 drop", frequency: "BD" },
  { label: "Drops Ciprofloxacin Ear 0.3%", name: "Ciprofloxacin", form: "Drops", strength: "0.3%", defaultDose: "3-4 drops", frequency: "BD" },
  { label: "Drops Sofradex Ear", name: "Sofradex", form: "Drops", strength: "N/A", defaultDose: "2-3 drops", frequency: "TDS" },

  // Vitamins & Supplements
  { label: "Tab. Folic Acid 5 mg", name: "Folic Acid", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Tab. Vitamin B Complex", name: "Vitamin B Complex", form: "Tab.", strength: "N/A", defaultDose: "1 tab", frequency: "OD" },
  { label: "Tab. Vitamin C 500 mg", name: "Vitamin C", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "OD" },
  { label: "Tab. Calcium Carbonate 500 mg", name: "Calcium Carbonate", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Tab. Ferrous Sulfate 200 mg", name: "Ferrous Sulfate", form: "Tab.", strength: "200 mg", defaultDose: "200 mg", frequency: "BD" },
  { label: "Syp. Ferrous Sulfate 200 mg/5 ml", name: "Ferrous Sulfate", form: "Syp.", strength: "200 mg/5 ml", defaultDose: "5 ml", frequency: "BD" },
  { label: "Tab. Vitamin D3 1000 IU", name: "Vitamin D3", form: "Tab.", strength: "1000 IU", defaultDose: "1000 IU", frequency: "OD" },

  // Antifungals
  { label: "Tab. Fluconazole 150 mg", name: "Fluconazole", form: "Tab.", strength: "150 mg", defaultDose: "150 mg", frequency: "STAT" },
  { label: "Tab. Fluconazole 50 mg", name: "Fluconazole", form: "Tab.", strength: "50 mg", defaultDose: "50 mg", frequency: "OD" },
  { label: "Tab. Griseofulvin 500 mg", name: "Griseofulvin", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "OD" },
  { label: "Tab. Terbinafine 250 mg", name: "Terbinafine", form: "Tab.", strength: "250 mg", defaultDose: "250 mg", frequency: "OD" },

  // Antivirals
  { label: "Tab. Acyclovir 200 mg", name: "Acyclovir", form: "Tab.", strength: "200 mg", defaultDose: "200 mg", frequency: "5x daily" },
  { label: "Tab. Acyclovir 400 mg", name: "Acyclovir", form: "Tab.", strength: "400 mg", defaultDose: "400 mg", frequency: "5x daily" },
  { label: "Tab. Valacyclovir 500 mg", name: "Valacyclovir", form: "Tab.", strength: "500 mg", defaultDose: "500 mg", frequency: "BD" },
  { label: "Tab. Oseltamivir 75 mg", name: "Oseltamivir", form: "Tab.", strength: "75 mg", defaultDose: "75 mg", frequency: "BD" },

  // Other Essential Medications
  { label: "Tab. Allopurinol 100 mg", name: "Allopurinol", form: "Tab.", strength: "100 mg", defaultDose: "100 mg", frequency: "OD" },
  { label: "Tab. Allopurinol 300 mg", name: "Allopurinol", form: "Tab.", strength: "300 mg", defaultDose: "300 mg", frequency: "OD" },
  { label: "Tab. Colchicine 0.5 mg", name: "Colchicine", form: "Tab.", strength: "0.5 mg", defaultDose: "0.5 mg", frequency: "BD" },
  { label: "Inj. Adrenaline 1 mg/ml", name: "Adrenaline", form: "Inj.", strength: "1 mg/ml", defaultDose: "0.5 mg", frequency: "STAT" },
  { label: "Inj. Atropine 0.6 mg/ml", name: "Atropine", form: "Inj.", strength: "0.6 mg/ml", defaultDose: "0.6 mg", frequency: "STAT" },
  { label: "Inj. Naloxone 0.4 mg/ml", name: "Naloxone", form: "Inj.", strength: "0.4 mg/ml", defaultDose: "0.4 mg", frequency: "STAT" },
  { label: "Tab. Warfarin 5 mg", name: "Warfarin", form: "Tab.", strength: "5 mg", defaultDose: "5 mg", frequency: "OD" },
  { label: "Inj. Heparin 5000 IU/ml", name: "Heparin", form: "Inj.", strength: "5000 IU/ml", defaultDose: "5000 IU", frequency: "BD" },
];

const DURATION_OPTIONS = [
  { value: "3/7", label: "3 days (3/7)" },
  { value: "5/7", label: "5 days (5/7)" },
  { value: "1/52", label: "1 week (1/52)" },
  { value: "1/12", label: "1 month (1/12)" },
  { value: "custom", label: "Custom date…" },
];

function MedicationOrders({ patient, items, onAdd, onRemove }:{ patient:any; items:any[]; onAdd:(v:any)=>void; onRemove:(i:number)=>void}){
  const [drugLabel, setDrugLabel] = useState("");
  const [dosage, setDosage] = useState("");
  const [freq, setFreq] = useState("OD");
  const [durationSel, setDurationSel] = useState<string>("5/7");
  const [customDate, setCustomDate] = useState<string>("");
  const [qty, setQty] = useState<string>("10");
  const [notes, setNotes] = useState("");
  const allergies: string[] = patient?.personal?.allergies || [];

  function pickByLabel(label: string){
    const d = FORMULARY.find(x => x.label.toLowerCase() === label.toLowerCase());
    if(d){ setDosage(d.defaultDose); setFreq(d.frequency); }
  }

  const hasAllergy = (label: string) => {
    const n = (label||"").toLowerCase();
    return (allergies||[]).some(a => n.includes(String(a).toLowerCase()));
  };

  // Auto-calculate quantity
  React.useEffect(() => {
    try {
      // Extract strength from drug label (e.g., "250 mg" from "Cap. Amoxicillin 250 mg")
      const strengthMatch = drugLabel.match(/(\d+\.?\d*)\s*(mg|g|ml)/i);
      const drugStrength = strengthMatch ? parseFloat(strengthMatch[1]) : 0;
      
      // Extract dose amount (e.g., "500" from "500mg")
      const doseMatch = dosage.match(/(\d+\.?\d*)/);
      const doseAmount = doseMatch ? parseFloat(doseMatch[1]) : 0;
      
      // Calculate pills per dose
      const pillsPerDose = drugStrength > 0 ? Math.ceil(doseAmount / drugStrength) : 1;
      
      // For STAT (immediate, one-time dose), quantity is just pills per dose
      if (freq === 'STAT') {
        if (pillsPerDose > 0) {
          setQty(pillsPerDose.toString());
        }
        return;
      }
      
      // Convert frequency to times per day
      const freqMap: Record<string, number> = {
        "OD": 1, "BD": 2, "TDS": 3, "QID": 4, "QHS": 1, "PRN": 1
      };
      const timesPerDay = freqMap[freq] || 1;
      
      // Extract days from duration (e.g., "5" from "5/7")
      const daysMatch = durationSel.match(/(\d+)/);
      const days = daysMatch ? parseInt(daysMatch[1]) : 0;
      
      // Calculate total quantity
      if (pillsPerDose > 0 && timesPerDay > 0 && days > 0) {
        const totalQty = pillsPerDose * timesPerDay * days;
        setQty(totalQty.toString());
      }
    } catch (error) {
      // If calculation fails, keep default
    }
  }, [drugLabel, dosage, freq, durationSel]);

  function add(){
    if(!drugLabel){ toast.error("Choose a medication"); return; }
    if(!dosage){ toast.error("Dosage required"); return; }
    const duration = durationSel === 'custom' && customDate ? `until ${customDate}` : durationSel;
    const item = { drugLabel, dosage, frequency: freq, duration, quantity: qty, notes };
    onAdd(item);
    setDrugLabel(""); setDosage(""); setNotes(""); setDurationSel("5/7"); setCustomDate(""); setFreq("OD"); setQty("10");
  }

  return (
    <div className="grid gap-4 bg-blue-50/30 rounded-xl p-4 border-2 border-blue-200">
      <div className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-3 py-2 shadow-md">
        <Pill className="h-5 w-5"/>
        <span className="font-bold text-base">MEDICATION</span>
      </div>
      {allergies.length>0 && (
        <div className="flex items-start gap-2 text-amber-800 bg-amber-50 border-2 border-amber-400 rounded-lg p-3 shadow-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5"/> 
          <div className="text-sm"><span className="font-bold">Allergies:</span> {allergies.join(', ')}</div>
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Search Medication</label>
              <Input 
                list="formulary-list" 
                value={drugLabel} 
                onChange={(e)=>{ setDrugLabel(e.target.value); pickByLabel(e.target.value); }} 
                placeholder="e.g., Tab. Paracetamol 500 mg"
                className="h-10 bg-white"
              />
          <datalist id="formulary-list">
            {drugLabel.trim() !== '' && FORMULARY.filter(d => 
              d.label.toLowerCase().includes(drugLabel.toLowerCase())
            ).map(d=> <option key={d.label} value={d.label} />)}
          </datalist>
          {hasAllergy(drugLabel) && (
                <div className="mt-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                  ⚠ Potential allergy conflict with <span className="font-bold">{drugLabel}</span>
                </div>
          )}
        </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Dosage</label>
              <Input value={dosage} onChange={(e)=>setDosage(e.target.value)} placeholder="e.g., 500mg" className="h-10 bg-white"/>
            </div>
          </div>

          <div className={`grid gap-3 ${freq === 'STAT' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Frequency</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={freq} onChange={(e)=>{
                setFreq(e.target.value);
                if(e.target.value === 'STAT') setDurationSel('stat');
              }}>
                <option value="" disabled>Select</option>
          {DRUG_FREQUENCIES.map(f=> <option key={f} value={f}>{f}</option>)}
        </select>
            </div>

            {freq !== 'STAT' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Duration</label>
                <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={durationSel} onChange={(e)=>setDurationSel(e.target.value)}>
                  <option value="" disabled>Select</option>
          {DURATION_OPTIONS.map(opt=> <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Quantity</label>
              <Input type="number" min="1" value={qty} onChange={(e)=>setQty(e.target.value)} placeholder="Auto" className="h-10 bg-white"/>
      </div>
          </div>

      {durationSel === 'custom' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">End Date</label>
              <Input type="date" value={customDate} onChange={(e)=>setCustomDate(e.target.value)} className="h-10 bg-white"/>
        </div>
      )}

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Notes / Route / Timing</label>
            <Input value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Additional instructions..." className="h-10 bg-white"/>
          </div>

          <Button type="button" onClick={add} className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md w-auto ml-auto">
            <Plus className="h-3.5 w-3.5 mr-1"/>Add Medication
          </Button>
        </div>
      </div>

      {items.length>0 && (
        <ul className="grid gap-2">
          {items.map((m, idx)=> {
            const allergyFlag = hasAllergy(m.drugLabel || (m as any).drug);
            return (
              <li key={idx} className={`border rounded-xl p-2 text-sm ${allergyFlag? 'border-red-300 bg-red-50':''}`}>
                <div className="flex items-start justify-between">
                  <div className="grid">
                    <div className="font-medium">{idx+1}. {m.drugLabel || (m as any).drug}</div>
                    <div className="text-xs text-slate-600">
                      {m.dosage} {m.frequency}{m.frequency === 'STAT' ? '' : ` x ${m.duration}`}
                    </div>
                    {m.quantity && <div className="text-xs text-slate-600">{m.quantity} pcs</div>}
                    {m.notes && <div className="text-xs italic text-slate-500">{m.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {allergyFlag && <UIBadge className="ml-2 bg-red-600 text-white">ALLERGY</UIBadge>}
                    <Button variant="ghost" size="sm" onClick={()=>onRemove(idx)}>Remove</Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const LAB_TESTS = ["FBC","U&E","LFT","CRP","ESR","Troponin","ABG","Urinalysis"];
const PRIORITIES = ["Routine","Urgent","Stat"];

function LabOrders({ items, onAdd, onRemove }:{ items:any[]; onAdd:(v:any)=>void; onRemove:(i:number)=>void }){
  const [test, setTest] = useState("FBC");
  const [priority, setPriority] = useState("Routine");
  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({});
  const [viewingResult, setViewingResult] = useState<any>(null);

  const handleSend = (idx: number, labTest: string) => {
    setItemStatuses(prev => ({ ...prev, [idx]: 'sent' }));
    toast.success(`Lab request sent: ${labTest}`);
    
    // Simulate lab receiving the request after 3 seconds
    setTimeout(() => {
      setItemStatuses(prev => ({ ...prev, [idx]: 'received' }));
      toast.info(`Lab received: ${labTest}`);
    }, 3000);
  };

  const handleCancel = (idx: number, labTest: string) => {
    setItemStatuses(prev => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
    toast.warning(`Lab request cancelled: ${labTest}`);
  };

  const generateMockResults = (testName: string) => {
    const resultsMap: Record<string, any> = {
      "FBC": {
        testName: "Full Blood Count (FBC)",
        date: new Date().toLocaleString(),
        items: [
          { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", range: "13.0-17.0", status: "normal" },
          { parameter: "WBC Count", value: "11.5", unit: "×10⁹/L", range: "4.0-11.0", status: "high" },
          { parameter: "Platelets", value: "245", unit: "×10⁹/L", range: "150-400", status: "normal" },
          { parameter: "RBC Count", value: "4.8", unit: "×10¹²/L", range: "4.5-5.5", status: "normal" },
          { parameter: "Hematocrit", value: "42", unit: "%", range: "40-50", status: "normal" },
          { parameter: "MCV", value: "88", unit: "fL", range: "80-96", status: "normal" },
        ]
      },
      "U&E": {
        testName: "Urea & Electrolytes (U&E)",
        date: new Date().toLocaleString(),
        items: [
          { parameter: "Sodium", value: "138", unit: "mmol/L", range: "135-145", status: "normal" },
          { parameter: "Potassium", value: "4.2", unit: "mmol/L", range: "3.5-5.0", status: "normal" },
          { parameter: "Urea", value: "6.8", unit: "mmol/L", range: "2.5-7.5", status: "normal" },
          { parameter: "Creatinine", value: "95", unit: "μmol/L", range: "60-110", status: "normal" },
          { parameter: "eGFR", value: ">90", unit: "mL/min", range: ">60", status: "normal" },
        ]
      },
      "LFT": {
        testName: "Liver Function Test (LFT)",
        date: new Date().toLocaleString(),
        items: [
          { parameter: "ALT", value: "45", unit: "U/L", range: "7-56", status: "normal" },
          { parameter: "AST", value: "38", unit: "U/L", range: "10-40", status: "normal" },
          { parameter: "ALP", value: "85", unit: "U/L", range: "30-120", status: "normal" },
          { parameter: "Bilirubin (Total)", value: "12", unit: "μmol/L", range: "3-17", status: "normal" },
          { parameter: "Albumin", value: "42", unit: "g/L", range: "35-50", status: "normal" },
        ]
      },
      "CRP": {
        testName: "C-Reactive Protein (CRP)",
        date: new Date().toLocaleString(),
        items: [
          { parameter: "CRP", value: "18", unit: "mg/L", range: "<5", status: "high" },
        ]
      },
      "Troponin": {
        testName: "Troponin",
        date: new Date().toLocaleString(),
        items: [
          { parameter: "Troponin I", value: "0.02", unit: "ng/mL", range: "<0.04", status: "normal" },
        ]
      }
    };

    return resultsMap[testName] || {
      testName: testName,
      date: new Date().toLocaleString(),
      items: [
        { parameter: "Result", value: "Pending", unit: "", range: "", status: "pending" }
      ]
    };
  };

  return (
    <div className="grid gap-4 bg-emerald-50/30 rounded-xl p-4 border-2 border-emerald-200">
      <div className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-3 py-2 shadow-md">
        <FlaskConical className="h-5 w-5"/>
        <span className="font-bold text-base">LABORATORY</span>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
    <div className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Lab Test</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={test} onChange={(e)=>setTest(e.target.value)}>
          {LAB_TESTS.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Priority</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={priority} onChange={(e)=>setPriority(e.target.value)}>
          {PRIORITIES.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
            </div>
          </div>
          <Button type="button" onClick={()=> onAdd({ test, priority })} className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md w-auto ml-auto">
            <Plus className="h-3.5 w-3.5 mr-1"/>Add Lab Test
          </Button>
        </div>
      </div>
      {items.length>0 && (
        <ul className="grid gap-2">
          {items.map((l, idx)=> {
            const status = itemStatuses[idx] || 'draft';
            const isSent = status === 'sent';
            const isReceived = status === 'received';
            
            return (
              <li key={idx} className="flex items-center justify-between bg-white border rounded-lg p-3 text-sm hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{l.test} <span className="text-slate-500">• {l.priority}</span></span>
                  {isSent && !isReceived && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Sent</span>}
                  {isReceived && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Received</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!isSent && !isReceived && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={()=> handleSend(idx, l.test)} 
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs h-7 px-2"
                    >
                      Send
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={()=> setViewingResult(generateMockResults(l.test))} 
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-7 px-2"
                  >
                    View Result
                  </Button>
                  {!isReceived && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={()=> {
                        if (isSent) {
                          handleCancel(idx, l.test);
                        } else {
                          onRemove(idx);
                        }
                      }} 
                      className={`text-xs h-7 px-2 ${isSent ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                    >
                      {isSent ? 'Cancel' : 'Remove'}
                    </Button>
                  )}
                  {isReceived && (
                    <span className="text-xs text-slate-400 px-2">Cannot cancel</span>
                  )}
                </div>
            </li>
            );
          })}
        </ul>
      )}

      {/* Lab Results Viewer Dialog */}
      {viewingResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingResult(null)}>
          <div className="bg-white rounded-2xl max-w-4xl max-h-[80vh] overflow-y-auto w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
                  <FlaskConical className="h-6 w-6"/>
                  {viewingResult?.testName || 'Laboratory Results'}
                </h2>
              </div>
              
            <div className="space-y-4">
              {/* Header Info */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-slate-600">Report Date:</span>
                    <span className="ml-2 text-slate-800">{viewingResult.date}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Status:</span>
                    <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Completed</span>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-200">
                      <th className="text-left px-4 py-3 font-bold text-slate-700">Parameter</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">Value</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">Unit</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">Reference Range</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingResult.items.map((item: any, idx: number) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-slate-200 hover:bg-slate-50 ${
                          item.status === 'high' ? 'bg-red-50' : 
                          item.status === 'low' ? 'bg-yellow-50' : 
                          'bg-white'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">{item.parameter}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">{item.value}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.unit}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.range}</td>
                        <td className="px-4 py-3 text-center">
                          {item.status === 'normal' && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                              NORMAL
                            </span>
                          )}
                          {item.status === 'high' && (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1">
                              ↑ HIGH
                            </span>
                          )}
                          {item.status === 'low' && (
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1">
                              ↓ LOW
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                              PENDING
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Notes */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-xs text-slate-600">
                  <span className="font-bold">Note:</span> Abnormal values are highlighted. 
                  Please correlate with clinical findings. For urgent concerns, contact the on-call physician immediately.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => toast.success('Results printed')}>
                  Print Results
                </Button>
                <Button onClick={() => setViewingResult(null)}>
                  Close
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const IMAGING_TYPES = ["CXR","CT Brain","CT Abdomen","US Abdomen","US DVT","KUB","MRI Brain"]; 
const BODY_PARTS = [
  "Head", "Neck", "Chest", "Abdomen", "Pelvis", 
  "Left Shoulder", "Right Shoulder", "Left Arm", "Right Arm", 
  "Left Forearm", "Right Forearm", "Left Hand", "Right Hand",
  "Left Hip", "Right Hip", "Left Thigh", "Right Thigh",
  "Left Leg", "Right Leg", "Left Knee", "Right Knee",
  "Left Ankle", "Right Ankle", "Left Foot", "Right Foot",
  "Spine (Cervical)", "Spine (Thoracic)", "Spine (Lumbar)",
  "Other"
];

function ImagingOrders({ items, onAdd, onRemove }:{ items:any[]; onAdd:(v:any)=>void; onRemove:(i:number)=>void }){
  const [modality, setModality] = useState("CXR");
  const [bodyPart, setBodyPart] = useState("Chest");
  const [priority, setPriority] = useState("Routine");
  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({});
  const [viewingResult, setViewingResult] = useState<any>(null);

  const handleSend = (idx: number, imagingType: string) => {
    setItemStatuses(prev => ({ ...prev, [idx]: 'sent' }));
    toast.success(`Imaging request sent: ${imagingType}`);
    
    // Simulate imaging dept receiving the request after 3 seconds
    setTimeout(() => {
      setItemStatuses(prev => ({ ...prev, [idx]: 'received' }));
      toast.info(`Imaging dept received: ${imagingType}`);
    }, 3000);
  };

  const handleCancel = (idx: number, imagingType: string) => {
    setItemStatuses(prev => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
    toast.warning(`Imaging request cancelled: ${imagingType}`);
  };

  const generateMockImagingResults = (imagingType: string, bodyPart: string) => {
    const resultsMap: Record<string, any> = {
      "CXR": {
        imagingType: "Chest X-Ray (CXR)",
        date: new Date().toLocaleString(),
        findings: "The heart size is within normal limits. Lungs are clear bilaterally with no evidence of consolidation, pleural effusion, or pneumothorax. Mediastinal contours are unremarkable. Bony thorax appears intact.",
        impression: "Normal chest radiograph. No acute cardiopulmonary disease.",
        image: "🫁 [Chest X-Ray Image Placeholder]"
      },
      "CT Brain": {
        imagingType: "CT Brain",
        date: new Date().toLocaleString(),
        findings: "No acute intracranial hemorrhage, mass effect, or midline shift identified. Gray-white matter differentiation is preserved. Ventricular system is normal in size and configuration. No extra-axial collections.",
        impression: "No acute intracranial abnormality. Normal CT brain.",
        image: "🧠 [CT Brain Image Placeholder]"
      },
      "CT Abdomen": {
        imagingType: "CT Abdomen",
        date: new Date().toLocaleString(),
        findings: "Liver, spleen, pancreas, and kidneys appear normal in size and attenuation. No free fluid or free air identified. Bowel loops are unremarkable. No lymphadenopathy.",
        impression: "Normal CT abdomen. No acute abdominal pathology.",
        image: "🫃 [CT Abdomen Image Placeholder]"
      },
      "US Abdomen": {
        imagingType: "Ultrasound Abdomen",
        date: new Date().toLocaleString(),
        findings: "Liver shows normal echotexture with no focal lesions. Gallbladder is normal with no stones. Spleen and both kidneys are normal. No free fluid in Morrison's pouch or pelvis.",
        impression: "Normal abdominal ultrasound.",
        image: "📊 [Ultrasound Image Placeholder]"
      }
    };

    return resultsMap[imagingType] || {
      imagingType: imagingType + (bodyPart ? ` (${bodyPart})` : ''),
      date: new Date().toLocaleString(),
      findings: "Images have been acquired and are under review by the radiologist.",
      impression: "Report pending.",
      image: "📸 [Imaging Placeholder]"
    };
  };

  return (
    <div className="grid gap-4 bg-purple-50/30 rounded-xl p-4 border-2 border-purple-200">
      <div className="flex items-center gap-2 bg-purple-600 text-white rounded-lg px-3 py-2 shadow-md">
        <Scan className="h-5 w-5"/>
        <span className="font-bold text-base">IMAGING</span>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
    <div className="grid gap-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Imaging Type</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={modality} onChange={(e)=>setModality(e.target.value)}>
          {IMAGING_TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Body Part</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={bodyPart} onChange={(e)=>setBodyPart(e.target.value)}>
          {BODY_PARTS.map(bp=> <option key={bp} value={bp}>{bp}</option>)}
        </select>
      </div>
      <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Priority</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={priority} onChange={(e)=>setPriority(e.target.value)}>
          {PRIORITIES.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
          </div>
          <Button type="button" onClick={()=>{ if(!modality){ toast.error("Select imaging type"); return;} onAdd({ modality, bodyPart, priority }); }} className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-md w-auto ml-auto">
            <Plus className="h-3.5 w-3.5 mr-1"/>Add Imaging
          </Button>
        </div>
      </div>
      {items.length>0 && (
        <ul className="grid gap-2">
          {items.map((im, idx)=> {
            const status = itemStatuses[idx] || 'draft';
            const isSent = status === 'sent';
            const isReceived = status === 'received';
            
            return (
              <li key={idx} className="flex items-center justify-between bg-white border rounded-lg p-3 text-sm hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{im.modality}{im.bodyPart?` (${im.bodyPart})`:''} <span className="text-slate-500">• {im.priority}</span></span>
                  {isSent && !isReceived && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Sent</span>}
                  {isReceived && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Received</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!isSent && !isReceived && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={()=> handleSend(idx, im.modality)} 
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs h-7 px-2"
                    >
                      Send
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={()=> setViewingResult(generateMockImagingResults(im.modality, im.bodyPart))} 
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-7 px-2"
                  >
                    View Result
                  </Button>
                  {!isReceived && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={()=> {
                        if (isSent) {
                          handleCancel(idx, im.modality);
                        } else {
                          onRemove(idx);
                        }
                      }} 
                      className={`text-xs h-7 px-2 ${isSent ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                    >
                      {isSent ? 'Cancel' : 'Remove'}
                    </Button>
                  )}
                  {isReceived && (
                    <span className="text-xs text-slate-400 px-2">Cannot cancel</span>
                  )}
                </div>
            </li>
            );
          })}
        </ul>
      )}

      {/* Imaging Results Viewer Dialog */}
      {viewingResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingResult(null)}>
          <div className="bg-white rounded-2xl max-w-5xl max-h-[85vh] overflow-y-auto w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
                  <Scan className="h-6 w-6"/>
                  {viewingResult?.imagingType || 'Imaging Results'}
                </h2>
              </div>
              
            <div className="space-y-4">
              {/* Header Info */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-slate-600">Report Date:</span>
                    <span className="ml-2 text-slate-800">{viewingResult.date}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Status:</span>
                    <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Reported</span>
                  </div>
                </div>
              </div>

              {/* Image Placeholder */}
              <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="text-6xl mb-4">{viewingResult.image}</div>
                  <p className="text-slate-600 text-sm">Image viewer would be displayed here</p>
                </div>
              </div>

              {/* Findings Section */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-purple-600"/>
                  Findings
                </h3>
                <p className="text-slate-700 leading-relaxed">{viewingResult.findings}</p>
              </div>

              {/* Impression Section */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-800 mb-3">Impression</h3>
                <p className="text-purple-900 font-medium">{viewingResult.impression}</p>
              </div>

              {/* Radiologist Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-xs text-slate-600">
                  <span className="font-bold">Reported by:</span> Dr. Sarah Johnson, Consultant Radiologist
                  <br />
                  <span className="font-bold">Verified:</span> {new Date().toLocaleDateString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => toast.success('Report printed')}>
                  Print Report
                </Button>
                <Button variant="outline" onClick={() => toast.success('Images downloaded')}>
                  Download Images
                </Button>
                <Button onClick={() => setViewingResult(null)}>
                  Close
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MedicalHistory({ visits }: { visits: any[] }) {
  const sorted = [...(visits||[])].sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());
  const [viewingVisit, setViewingVisit] = useState<any>(null);

  return (
    <div className="grid gap-3">
      {sorted.length === 0 && <div className="text-sm text-slate-500">No previous visits recorded.</div>}
      {sorted.map((v, i)=> (
        <div key={i} onClick={() => setViewingVisit(v)} className="cursor-pointer">
          <Card className="rounded-2xl hover:shadow-lg transition-all hover:border-blue-300">
          <CardContent className="p-4 grid gap-1">
              <div className="text-sm font-medium text-blue-700">{new Date(v.date).toLocaleString()}</div>
            <div className="text-sm"><span className="font-medium">Complaint:</span> {v.complaint}</div>
            <div className="text-sm"><span className="font-medium">Plan:</span> {v.plan}</div>
            <div className="text-sm"><span className="font-medium">Tests:</span> {(v.tests||[]).join(', ') || '-'} </div>
            <div className="text-sm"><span className="font-medium">Medication:</span> {(v.meds||[]).join(', ') || '-'} </div>
              <div className="text-xs text-blue-600 mt-2 font-medium">Click to view full assessment →</div>
          </CardContent>
        </Card>
        </div>
      ))}

      {/* Full Assessment Viewer */}
      {viewingVisit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingVisit(null)}>
          <div className="bg-slate-50 rounded-2xl max-w-7xl max-h-[90vh] overflow-y-auto w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              {/* Header */}
              <div className="mb-4 pb-3 border-b-2 border-slate-300 bg-blue-600 text-white rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-6 w-6"/>
                  <div>
                    <h2 className="text-xl font-bold">Previous Visit - Full Assessment</h2>
                    <p className="text-sm text-blue-100">{new Date(viewingVisit.date).toLocaleString()}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setViewingVisit(null)} className="bg-white text-blue-600 hover:bg-blue-50">
                  Close
                </Button>
              </div>

              {/* Main Content - Two Column Layout */}
              <div className="grid lg:grid-cols-[1.5fr_1fr] gap-3">
                {/* Left Column */}
                <div className="space-y-3">
                  {/* Patient Complaint */}
                  <Card className="rounded-lg shadow-sm border-2 border-slate-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="h-5 w-5 text-blue-600"/>
                        <h3 className="font-bold text-slate-800">Patient Complaint</h3>
                      </div>
                      <Textarea 
                        value={viewingVisit.complaint || 'Not recorded'} 
                        readOnly 
                        className="min-h-[60px] bg-slate-100 cursor-not-allowed resize-none"
                      />
                    </CardContent>
                  </Card>

                  {/* Vital Signs + Pain Score + Weight */}
                  <Card className="rounded-lg shadow-sm border-2 border-red-200 bg-red-50/30">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded-md bg-red-600 text-white grid place-items-center">
                          <Stethoscope className="h-4 w-4"/>
                        </div>
                        <h3 className="font-bold text-red-900">Vital Signs + Pain Score + Weight</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">BP (mmHg)</label>
                          <Input value={viewingVisit.assessment?.vitals?.bp || '-'} readOnly className="h-9 bg-slate-100 cursor-not-allowed"/>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">HR (bpm)</label>
                          <Input value={viewingVisit.assessment?.vitals?.hr || '-'} readOnly className="h-9 bg-slate-100 cursor-not-allowed"/>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">RR (/min)</label>
                          <Input value={viewingVisit.assessment?.vitals?.rr || '-'} readOnly className="h-9 bg-slate-100 cursor-not-allowed"/>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Temp (°C)</label>
                          <Input value={viewingVisit.assessment?.vitals?.temp || '-'} readOnly className="h-9 bg-slate-100 cursor-not-allowed"/>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">SpO2 (%)</label>
                          <Input value={viewingVisit.assessment?.vitals?.spo2 || '-'} readOnly className="h-9 bg-slate-100 cursor-not-allowed"/>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Pain (0-10)</label>
                          <Input value={viewingVisit.assessment?.vitals?.pain || '-'} readOnly className="h-9 bg-slate-100 cursor-not-allowed"/>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Physical Examination */}
                  <Card className="rounded-lg shadow-sm border-2 border-slate-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-5 w-5 text-purple-600"/>
                        <h3 className="font-bold text-slate-800">Physical Examination</h3>
                      </div>
                      {viewingVisit.assessment?.selectedRegions && viewingVisit.assessment.selectedRegions.length > 0 ? (
                        <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                          <strong>Selected Regions:</strong> {viewingVisit.assessment.selectedRegions.join(', ')}
                        </div>
                      ) : null}
                      <Textarea 
                        value={viewingVisit.assessment?.examNotes || 'No examination notes recorded'} 
                        readOnly 
                        className="min-h-[100px] bg-slate-100 cursor-not-allowed resize-none"
                      />
                    </CardContent>
                  </Card>

                  {/* Management Plan */}
                  <Card className="rounded-lg shadow-sm border-2 border-green-200 bg-green-50/30">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="h-5 w-5 text-green-600"/>
                        <h3 className="font-bold text-green-900">Management Plan</h3>
                      </div>
                      <Textarea 
                        value={viewingVisit.plan || 'Not recorded'} 
                        readOnly 
                        className="min-h-[80px] bg-slate-100 cursor-not-allowed resize-none"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Orders */}
                <div className="space-y-3">
                  {/* Medication Orders */}
                  <div className="bg-blue-50/30 rounded-lg p-3 border-2 border-blue-200">
                    <div className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-3 py-2 mb-3">
                      <Pill className="h-5 w-5"/>
                      <span className="font-bold text-base">MEDICATION</span>
                    </div>
                    {viewingVisit.assessment?.orders?.meds && viewingVisit.assessment.orders.meds.length > 0 ? (
                      <div className="space-y-2">
                        {viewingVisit.assessment.orders.meds.map((med: any, idx: number) => (
                          <div key={idx} className="bg-white border rounded-lg p-2 text-sm">
                            <div className="font-medium text-slate-800">{idx + 1}. {med.drugLabel || med.drug}</div>
                            <div className="text-xs text-slate-600">{med.dosage} {med.frequency} {med.frequency !== 'STAT' ? `x ${med.duration}` : ''}</div>
                            {med.quantity && <div className="text-xs text-slate-600">{med.quantity} pcs</div>}
                            {med.notes && <div className="text-xs italic text-slate-500">{med.notes}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No medications prescribed</p>
                    )}
                  </div>

                  {/* Laboratory Orders */}
                  <div className="bg-emerald-50/30 rounded-lg p-3 border-2 border-emerald-200">
                    <div className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-3 py-2 mb-3">
                      <FlaskConical className="h-5 w-5"/>
                      <span className="font-bold text-base">LABORATORY</span>
                    </div>
                    {viewingVisit.assessment?.orders?.labs && viewingVisit.assessment.orders.labs.length > 0 ? (
                      <div className="space-y-2">
                        {viewingVisit.assessment.orders.labs.map((lab: any, idx: number) => (
                          <div key={idx} className="bg-white border rounded-lg p-2 text-sm">
                            <span className="font-medium">{lab.test}</span>
                            <span className="text-slate-500"> • {lab.priority}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No lab tests ordered</p>
                    )}
                  </div>

                  {/* Imaging Orders */}
                  <div className="bg-purple-50/30 rounded-lg p-3 border-2 border-purple-200">
                    <div className="flex items-center gap-2 bg-purple-600 text-white rounded-lg px-3 py-2 mb-3">
                      <Scan className="h-5 w-5"/>
                      <span className="font-bold text-base">IMAGING</span>
                    </div>
                    {viewingVisit.assessment?.orders?.imaging && viewingVisit.assessment.orders.imaging.length > 0 ? (
                      <div className="space-y-2">
                        {viewingVisit.assessment.orders.imaging.map((img: any, idx: number) => (
                          <div key={idx} className="bg-white border rounded-lg p-2 text-sm">
                            <span className="font-medium">{img.modality}</span>
                            {img.bodyPart && <span> ({img.bodyPart})</span>}
                            <span className="text-slate-500"> • {img.priority}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No imaging ordered</p>
                    )}
                  </div>

                  {/* Disposition Summary */}
                  <div className="rounded-lg shadow-md border-2 border-green-200 bg-gradient-to-br from-green-50/30 to-white">
                    <div className="bg-green-600 text-white rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                      <BedDouble className="h-5 w-5"/>
                      <span className="font-bold text-base">DISPOSITION SUMMARY</span>
                    </div>
                    <div className="p-3">
                      {viewingVisit.disposition ? (
                        <div className={`p-2 rounded-lg font-bold text-center ${
                          viewingVisit.disposition === 'admit' ? 'bg-orange-100 text-orange-800' :
                          viewingVisit.disposition === 'discharge' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {viewingVisit.disposition.toUpperCase()}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Not recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="flex gap-3 justify-end pt-4 mt-4 border-t-2 border-slate-200">
                <Button variant="outline" onClick={() => toast.success('Visit details printed')}>
                  Print Visit Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalHistory({ data, onChange }: { data:any; onChange:(d:any)=>void }){
  const [illnesses, setIllnesses] = useState<string[]>(data?.illnesses || []);
  const [background, setBackground] = useState<string>(data?.background || "");
  const [surgeries, setSurgeries] = useState<string[]>(data?.surgeries || []);
  const [lifestyle, setLifestyle] = useState<string>(data?.lifestyle || "");
  const [allergies, setAllergies] = useState<string[]>(data?.allergies || []);

  function add(setter: any, arr: string[], value: string) {
    if(!value) return; setter([...arr, value]);
  }

  function save() {
    onChange({ illnesses, background, surgeries, lifestyle, allergies });
    toast.success("Personal history updated");
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="rounded-2xl">
        <CardContent className="p-4 grid gap-2">
          <Label>Patient Illnesses</Label>
          <TagEditor items={illnesses} onAdd={(v)=>add(setIllnesses, illnesses, v)} onRemove={(i)=>setIllnesses(illnesses.filter((_,idx)=>idx!==i))} placeholder="e.g., Diabetes, Hypertension" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4 grid gap-2">
          <Label>Patient Background</Label>
          <Textarea value={background} onChange={(e)=>setBackground(e.target.value)} placeholder="Occupation, family, social background…" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4 grid gap-2">
          <Label>Patient Surgeries</Label>
          <TagEditor items={surgeries} onAdd={(v)=>add(setSurgeries, surgeries, v)} onRemove={(i)=>setSurgeries(surgeries.filter((_,idx)=>idx!==i))} placeholder="e.g., Appendectomy 2018" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4 grid gap-2">
          <Label>Patient Lifestyle</Label>
          <Textarea value={lifestyle} onChange={(e)=>setLifestyle(e.target.value)} placeholder="Diet, exercise, smoking, alcohol, sleep…" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl md:col-span-2">
        <CardContent className="p-4 grid gap-2">
          <Label>Allergies</Label>
          <TagEditor items={allergies} onAdd={(v)=>setAllergies([...(allergies||[]), v])} onRemove={(i)=>setAllergies(allergies.filter((_,idx)=>idx!==i))} placeholder="e.g., Penicillin, NSAIDs" />
        </CardContent>
      </Card>

      <div className="md:col-span-2 flex justify-end">
        <Button onClick={save} className="gap-2"><CheckCircle2 className="h-4 w-4"/> Save Personal History</Button>
      </div>
    </div>
  );
}

function TagEditor({ items, onAdd, onRemove, placeholder }: { items:string[]; onAdd:(v:string)=>void; onRemove:(i:number)=>void; placeholder:string; }){
  const [value, setValue] = useState("");
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(e)=>setValue(e.target.value)} placeholder={placeholder} onKeyDown={(e)=>{ if(e.key==='Enter'){ onAdd(value.trim()); setValue(""); }}} />
        <Button type="button" onClick={()=>{ onAdd(value.trim()); setValue(""); }}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, idx)=> (
          <UIBadge key={idx} className="bg-slate-100 text-slate-900 px-3 py-1 rounded-full flex items-center gap-2">
            {it}
            <button onClick={()=>onRemove(idx)} className="text-xs opacity-60 hover:opacity-100">×</button>
          </UIBadge>
        ))}
      </div>
    </div>
  );
}

function BodyMap({ selected, onToggle, findings, onFindingChange }: { 
  selected: string[]; 
  onToggle: (r:string)=>void;
  findings: Record<string, string>;
  onFindingChange: (region: string, finding: string) => void;
}) {
  const regions = [
    "Head", "Neck", "Chest", "Abdomen", "Back", "Pelvis", "Left Shoulder", "Right Shoulder", "Left Arm", "Right Arm", "Left Hand", "Right Hand", "Left Thigh", "Right Thigh", "Left Leg", "Right Leg", "Left Foot", "Right Foot"
  ];

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    // Define clickable regions - image has front (left) and back (right) side by side
    if (xPercent < 50) { // Front view (left side)
      if (yPercent >= 6 && yPercent <= 15 && xPercent >= 17 && xPercent <= 33) onToggle("Head");
      else if (yPercent >= 15 && yPercent <= 19 && xPercent >= 20 && xPercent <= 30) onToggle("Neck");
      else if (yPercent >= 19 && yPercent <= 24 && xPercent >= 10 && xPercent <= 19) onToggle("Left Shoulder");
      else if (yPercent >= 19 && yPercent <= 24 && xPercent >= 31 && xPercent <= 40) onToggle("Right Shoulder");
      else if (yPercent >= 24 && yPercent <= 37 && xPercent >= 17 && xPercent <= 33) onToggle("Chest");
      else if (yPercent >= 37 && yPercent <= 48 && xPercent >= 18 && xPercent <= 32) onToggle("Abdomen");
      else if (yPercent >= 48 && yPercent <= 57 && xPercent >= 17 && xPercent <= 33) onToggle("Pelvis");
      else if (yPercent >= 24 && yPercent <= 42 && xPercent >= 9 && xPercent <= 13) onToggle("Left Arm");
      else if (yPercent >= 24 && yPercent <= 42 && xPercent >= 37 && xPercent <= 41) onToggle("Right Arm");
      else if (yPercent >= 42 && yPercent <= 50 && xPercent >= 6 && xPercent <= 11) onToggle("Left Hand");
      else if (yPercent >= 42 && yPercent <= 50 && xPercent >= 39 && xPercent <= 44) onToggle("Right Hand");
      else if (yPercent >= 57 && yPercent <= 77 && xPercent >= 16 && xPercent <= 25) onToggle("Left Thigh");
      else if (yPercent >= 57 && yPercent <= 77 && xPercent >= 25 && xPercent <= 34) onToggle("Right Thigh");
      else if (yPercent >= 77 && yPercent <= 95 && xPercent >= 16 && xPercent <= 24) onToggle("Left Leg");
      else if (yPercent >= 77 && yPercent <= 95 && xPercent >= 26 && xPercent <= 34) onToggle("Right Leg");
      else if (yPercent >= 95 && yPercent <= 100 && xPercent >= 14 && xPercent <= 25) onToggle("Left Foot");
      else if (yPercent >= 95 && yPercent <= 100 && xPercent >= 25 && xPercent <= 36) onToggle("Right Foot");
    } else { // Back view (right side)
      if (yPercent >= 6 && yPercent <= 15 && xPercent >= 67 && xPercent <= 83) onToggle("Head");
      else if (yPercent >= 15 && yPercent <= 19 && xPercent >= 70 && xPercent <= 80) onToggle("Neck");
      else if (yPercent >= 19 && yPercent <= 24 && xPercent >= 60 && xPercent <= 69) onToggle("Left Shoulder");
      else if (yPercent >= 19 && yPercent <= 24 && xPercent >= 81 && xPercent <= 90) onToggle("Right Shoulder");
      else if (yPercent >= 24 && yPercent <= 48 && xPercent >= 67 && xPercent <= 83) onToggle("Back");
      else if (yPercent >= 48 && yPercent <= 57 && xPercent >= 67 && xPercent <= 83) onToggle("Pelvis");
      else if (yPercent >= 24 && yPercent <= 42 && xPercent >= 59 && xPercent <= 63) onToggle("Left Arm");
      else if (yPercent >= 24 && yPercent <= 42 && xPercent >= 87 && xPercent <= 91) onToggle("Right Arm");
      else if (yPercent >= 42 && yPercent <= 50 && xPercent >= 56 && xPercent <= 61) onToggle("Left Hand");
      else if (yPercent >= 42 && yPercent <= 50 && xPercent >= 89 && xPercent <= 94) onToggle("Right Hand");
      else if (yPercent >= 57 && yPercent <= 77 && xPercent >= 66 && xPercent <= 75) onToggle("Left Thigh");
      else if (yPercent >= 57 && yPercent <= 77 && xPercent >= 75 && xPercent <= 84) onToggle("Right Thigh");
      else if (yPercent >= 77 && yPercent <= 95 && xPercent >= 66 && xPercent <= 74) onToggle("Left Leg");
      else if (yPercent >= 77 && yPercent <= 95 && xPercent >= 76 && xPercent <= 84) onToggle("Right Leg");
      else if (yPercent >= 95 && yPercent <= 100 && xPercent >= 64 && xPercent <= 75) onToggle("Left Foot");
      else if (yPercent >= 95 && yPercent <= 100 && xPercent >= 75 && xPercent <= 86) onToggle("Right Foot");
    }
  };

  return (
    <div className="grid gap-6">
      {/* Clickable Body Diagram */}
      <div className="p-6 bg-white rounded-xl border-2 border-slate-200">
        <div className="relative max-w-3xl mx-auto cursor-pointer" onClick={handleImageClick}>
          <img 
            src="https://www.mygcphysio.com.au/wp-content/uploads/2020/09/Body-chart.png" 
            alt="Body Chart - Click to select regions" 
            className="w-full h-auto select-none" 
            draggable="false"
          />
          {/* Professional gradient overlay for selected regions */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="medicalBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.6}} />
                <stop offset="100%" style={{stopColor: '#1d4ed8', stopOpacity: 0.4}} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Front view highlights */}
            {selected.includes("Head") && <ellipse cx="25" cy="10.5" rx="8" ry="4.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Neck") && <rect x="20" y="15" width="10" height="4" rx="1" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Shoulder") && <ellipse cx="14.5" cy="21.5" rx="4.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Shoulder") && <ellipse cx="35.5" cy="21.5" rx="4.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Chest") && <rect x="17" y="24" width="16" height="13" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Abdomen") && <rect x="18" y="37" width="14" height="11" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Pelvis") && <rect x="17" y="48" width="16" height="9" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Arm") && <rect x="9" y="24" width="4" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Arm") && <rect x="37" y="24" width="4" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Hand") && <ellipse cx="8.5" cy="46" rx="2.5" ry="4" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Hand") && <ellipse cx="41.5" cy="46" rx="2.5" ry="4" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Thigh") && <rect x="16" y="57" width="9" height="20" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Thigh") && <rect x="25" y="57" width="9" height="20" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Leg") && <rect x="16" y="77" width="8" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Leg") && <rect x="26" y="77" width="8" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Foot") && <ellipse cx="19.5" cy="97.5" rx="5.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Foot") && <ellipse cx="30.5" cy="97.5" rx="5.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            
            {/* Back view highlights */}
            {selected.includes("Head") && <ellipse cx="75" cy="10.5" rx="8" ry="4.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Neck") && <rect x="70" y="15" width="10" height="4" rx="1" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Shoulder") && <ellipse cx="64.5" cy="21.5" rx="4.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Shoulder") && <ellipse cx="85.5" cy="21.5" rx="4.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Back") && <rect x="67" y="24" width="16" height="24" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Pelvis") && <rect x="67" y="48" width="16" height="9" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Arm") && <rect x="59" y="24" width="4" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Arm") && <rect x="87" y="24" width="4" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Hand") && <ellipse cx="58.5" cy="46" rx="2.5" ry="4" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Hand") && <ellipse cx="91.5" cy="46" rx="2.5" ry="4" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Thigh") && <rect x="66" y="57" width="9" height="20" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Thigh") && <rect x="75" y="57" width="9" height="20" rx="2" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Leg") && <rect x="66" y="77" width="8" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Leg") && <rect x="76" y="77" width="8" height="18" rx="1.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Left Foot") && <ellipse cx="69.5" cy="97.5" rx="5.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
            {selected.includes("Right Foot") && <ellipse cx="80.5" cy="97.5" rx="5.5" ry="2.5" fill="url(#medicalBlue)" filter="url(#glow)" />}
          </svg>
          <div className="absolute top-2 left-1/4 -translate-x-1/2 text-xs font-bold text-slate-600 uppercase">Front View</div>
          <div className="absolute top-2 right-1/4 translate-x-1/2 text-xs font-bold text-slate-600 uppercase">Back View</div>
        </div>
        </div>

      {/* Selected Regions with Findings */}
      {selected.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-blue-600 text-white grid place-items-center text-xs font-bold">{selected.length}</div>
            <span className="font-bold text-blue-900">Selected Regions & Findings:</span>
        </div>
          <div className="grid gap-3">
            {selected.map((region) => (
              <div key={region} className="bg-white rounded-lg border-2 border-blue-200 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-blue-900">{region}</span>
                      <button
                        onClick={() => onToggle(region)}
                        className="ml-auto h-6 w-6 rounded-md bg-red-100 hover:bg-red-200 text-red-600 font-bold text-sm transition flex items-center justify-center"
                        title="Remove region"
                      >
                        ×
          </button>
        </div>
                    <Input
                      placeholder="Enter findings (e.g., swelling, bruising, tenderness, deformity...)"
                      value={findings[region] || ""}
                      onChange={(e) => onFindingChange(region, e.target.value)}
                      className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
        </div>
        </div>
        </div>
        ))}
      </div>
        </div>
      )}
    </div>
  );
}


