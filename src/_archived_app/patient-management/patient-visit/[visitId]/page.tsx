"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import ETUDashboard from "@/features/emergency/routes/ETUDashboard";

export default function PatientVisitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.visitId as string;

  // Mock data - in real app, fetch based on visitId
  const patientData = {
    id: visitId,
    name: 'Ahmad bin Ali',
    ic: '950101-01-5678',
    type: 'Day Care',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Visit List
              </Button>
              <div className="h-8 w-px bg-white/30" />
              <div>
                <h1 className="text-3xl font-bold text-white">{patientData.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-blue-100 text-sm">Visit ID: {patientData.id}</span>
                  <span className="text-blue-100">•</span>
                  <span className="text-blue-100 text-sm">IC: {patientData.ic}</span>
                  <span className="text-blue-100">•</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {patientData.type}
                  </span>
                </div>
              </div>
            </div>
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              <Printer className="h-5 w-5 mr-2" />
              Print Report
            </Button>
          </div>
        </div>
      </div>

      {/* ETU Dashboard Component - Centralized Assessment */}
      <ETUDashboard />
    </div>
  );
}
