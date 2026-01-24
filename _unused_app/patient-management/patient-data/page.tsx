"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Users, TrendingUp, Calendar, Phone, Mail, MapPin } from "lucide-react";

export default function PatientDataPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Patient Data Management</h1>
          <p className="text-slate-600">Comprehensive patient records, demographics, and medical history</p>
        </div>

        {/* Search and Actions */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Search by patient name, IC number, or MRN..." 
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus className="h-5 w-5 mr-2" />
                Register New Patient
              </Button>
              <Button variant="outline" className="h-12 px-6">
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-slate-900">2,847</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">All time registered</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">New This Month</p>
                  <p className="text-3xl font-bold text-green-600">87</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Active Patients</p>
                  <p className="text-3xl font-bold text-purple-600">156</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Currently admitted</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Updated Today</p>
                  <p className="text-3xl font-bold text-orange-600">34</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Records modified</p>
            </CardContent>
          </Card>
        </div>

        {/* Patient List */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Patient Directory</h3>
              <div className="flex items-center gap-3">
                <select className="px-4 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>All Patients</option>
                  <option>Active</option>
                  <option>Discharged</option>
                  <option>Outpatient</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { 
                  mrn: 'MRN-2025-0042', 
                  name: 'Ahmad bin Ali', 
                  ic: '950101-01-5678', 
                  age: 30, 
                  gender: 'Male',
                  phone: '012-3456789',
                  address: 'Kuala Lumpur',
                  lastVisit: '10/10/2025',
                  status: 'Outpatient'
                },
                { 
                  mrn: 'MRN-2025-0038', 
                  name: 'Siti Aminah binti Hassan', 
                  ic: '881215-03-4567', 
                  age: 37, 
                  gender: 'Female',
                  phone: '019-8765432',
                  address: 'Selangor',
                  lastVisit: '12/10/2025',
                  status: 'Admitted'
                },
                { 
                  mrn: 'MRN-2025-0035', 
                  name: 'Kumar Rajesh a/l Subramaniam', 
                  ic: '920504-14-1234', 
                  age: 33, 
                  gender: 'Male',
                  phone: '016-2345678',
                  address: 'Penang',
                  lastVisit: '08/10/2025',
                  status: 'Outpatient'
                },
                { 
                  mrn: 'MRN-2025-0029', 
                  name: 'Lee Mei Ling', 
                  ic: '890830-10-9876', 
                  age: 36, 
                  gender: 'Female',
                  phone: '013-9876543',
                  address: 'Johor',
                  lastVisit: '12/10/2025',
                  status: 'Outpatient'
                },
                { 
                  mrn: 'MRN-2025-0021', 
                  name: 'Fatimah Zahra binti Abdullah', 
                  ic: '910203-06-5432', 
                  age: 34, 
                  gender: 'Female',
                  phone: '017-5432109',
                  address: 'Negeri Sembilan',
                  lastVisit: '11/10/2025',
                  status: 'Admitted'
                },
              ].map((patient, idx) => (
                <Card key={idx} className="border border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">
                              {patient.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-900">{patient.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                              <span className="font-semibold text-blue-600">{patient.mrn}</span>
                              <span>•</span>
                              <span>{patient.ic}</span>
                              <span>•</span>
                              <span>{patient.age} years, {patient.gender}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 ml-[72px]">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {patient.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {patient.address}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Last visit: {patient.lastVisit}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          patient.status === 'Admitted' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {patient.status}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View Record</Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-slate-600">Showing 1-5 of 2,847 patients</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">...</Button>
                <Button variant="outline" size="sm">570</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

