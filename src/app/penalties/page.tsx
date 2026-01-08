export default function PenaltiesPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold text-slate-800">Late Receiving & Penalties</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Supplier Performance</h2>
          <button className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700">Log Penalty</button>
        </div>
        <div className="mt-4 text-sm text-slate-500">Late receiving and penalties will appear here.</div>
      </div>
    </div>
  );
}



