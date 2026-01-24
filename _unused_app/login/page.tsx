'use client';

import React, { useState, useEffect, Suspense } from "react";
import { getLandingPathForDepartment } from '@/lib/department';
import { useRouter, useSearchParams } from 'next/navigation';


function LoginPageContent() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL parameters for quick login
  useEffect(() => {
    const role = searchParams.get('role');
    const user = searchParams.get('user');
    const department = searchParams.get('department');
    
    if (role && user && department) {
      // Auto-login with provided credentials
      handleQuickLogin(role, user, department);
    }
  }, [searchParams]);

  const handleQuickLogin = async (role: string, user: string, department: string) => {
    setLoading(true);
    
    try {
      // Only allow super admin quick login
      if (user === 'hosplawas' && role === 'super_admin') {
        // Set authentication data in localStorage (more reliable than cookies)
        localStorage.setItem('user', user);
        localStorage.setItem('department', department);
        localStorage.setItem('roles', role);
        localStorage.setItem('isAuthenticated', 'true');
        
        // Also set cookies as backup
        const cookieOptions = 'path=/; SameSite=Lax; max-age=86400; secure=false';
        document.cookie = `user=${encodeURIComponent(user)}; ${cookieOptions}`;
        document.cookie = `department=${encodeURIComponent(department)}; ${cookieOptions}`;
        document.cookie = `roles=${role}; ${cookieOptions}`;
        
        // Immediate redirect - send to department landing
        const redirect = searchParams.get('redirect') || getLandingPathForDepartment(department);
        router.push(redirect);
      } else {
        console.error('Unauthorized quick login attempt');
        setLoading(false);
        alert('Access Denied. Unauthorized access.');
      }
    } catch (error) {
      console.error('Quick login failed:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Super admin access only
      if (employeeId.trim() === 'hosplawas' && password.trim() === 'lawas2025' && department.trim()) {
        // Set authentication data in localStorage (more reliable than cookies)
        localStorage.setItem('user', employeeId);
        localStorage.setItem('department', department);
        localStorage.setItem('roles', 'super_admin,admin');
        localStorage.setItem('isAuthenticated', 'true');
        
        // Also set cookies as backup
        const cookieOptions = 'path=/; SameSite=Lax; max-age=86400; secure=false';
        document.cookie = `user=${encodeURIComponent(employeeId)}; ${cookieOptions}`;
        document.cookie = `department=${encodeURIComponent(department)}; ${cookieOptions}`;
        document.cookie = `roles=super_admin,admin; ${cookieOptions}`;
        
        // Immediate redirect to department landing
        router.push(getLandingPathForDepartment(department));
      } else {
        alert('Access Denied. Invalid credentials.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Access Denied. System error.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full" suppressHydrationWarning>

      <main className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 py-12">
        <section className="w-full max-w-md relative">

          <div className="rounded-3xl border-2 border-white/70 bg-white/25 backdrop-blur-xl shadow-2xl shadow-blue-500/20 p-8 relative overflow-hidden" suppressHydrationWarning>
            {/* Subtle glassmorphism, overlays removed for transparency */}
            
            {/* Medical-themed logo container */}
            <div className="relative z-10 mx-auto w-32 h-32 rounded-2xl ring-4 ring-blue-300/60 overflow-visible bg-gradient-to-br from-white/98 to-blue-100/90 backdrop-blur-sm grid place-items-center p-2 shadow-xl" suppressHydrationWarning>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/9/94/Jata_MalaysiaV2.svg"
                alt="Jata Negara Malaysia"
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain drop-shadow-xl hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Heading */}
            <header className="relative z-10 mt-6 text-center space-y-3">
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-lg">
                Welcome Back
              </h1>
              <p className="text-sm text-slate-700 font-semibold">
                Sign in to <span className="font-bold text-blue-600 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">HOME</span>
                <br />
                <span className="text-slate-600 font-medium">Hospital Operation &amp; Management Ecosystem</span>
              </p>
            </header>

            {/* Form */}
            <form className="relative z-10 mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* Employee ID */}
              <div className="space-y-2" suppressHydrationWarning>
                <label htmlFor="employeeId" className="block text-sm font-bold text-slate-800">
                  Employee ID
                </label>
                <div className="relative" suppressHydrationWarning>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full rounded-xl border-2 border-blue-300 bg-white/20 backdrop-blur-md px-4 py-3 text-slate-800 placeholder-slate-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-300 hover:shadow-xl"
                    required
                  />
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-5 text-slate-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M4.5 20.25a7.5 7.5 0 1115 0v.75H4.5v-.75z" />
                  </svg>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2" suppressHydrationWarning>
                <label htmlFor="password" className="block text-sm font-bold text-slate-800">
                  Password
                </label>
                <div className="relative" suppressHydrationWarning>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border-2 border-blue-300 bg-white/20 backdrop-blur-md px-4 py-3 text-slate-800 placeholder-slate-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-300 hover:shadow-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-blue-600 hover:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {showPassword ? (
                      // eye-off icon
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.657 6.91 18.25 12 18.25c1.51 0 2.88-.22 4.092-.62M9.53 9.53A3.75 3.75 0 0012 15.75a3.74 3.74 0 002.47-.92" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.47 14.47L9.53 9.53M6.28 6.28l11.44 11.44M20.02 15.777A10.475 10.475 0 0022.066 12C20.774 8.343 17.09 5.75 12 5.75c-.69 0-1.35.05-1.98.15" />
                      </svg>
                    ) : (
                      // eye icon
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.75 12 4.75c4.64 0 8.577 2.76 9.964 6.928.07.206.07.438 0 .644C20.577 16.49 16.64 19.25 12 19.25c-4.64 0-8.577-2.76-9.964-6.928z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2" suppressHydrationWarning>
                <label htmlFor="department" className="block text-sm font-bold text-slate-800">
                  Department
                </label>
                <div className="relative" suppressHydrationWarning>
                  <select
                    id="department"
                    name="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border-2 border-blue-300 bg-white/20 backdrop-blur-md px-4 py-3 text-slate-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-300 hover:shadow-xl appearance-none"
                    required
                  >
                    <option value="" className="text-slate-500">Select your department</option>
                    <option value="Administrator">🛡️ Administrator (System Control)</option>
                    <option value="Pharmacy Logistic">Pharmacy Logistic</option>
                    <option value="Pharmacy Sub Store">Pharmacy Sub Store</option>
                    <option value="Pharmacy Counter">Pharmacy Counter</option>
                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                    <option value="General Ward">General Ward</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Haemodialysis">Haemodialysis</option>
                    <option value="Paediatric Ward">Paediatric Ward</option>
                    <option value="Maternity Ward">Maternity Ward</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Office Admin">Office Admin</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between text-sm" suppressHydrationWarning>
                <label className="flex items-center gap-2 select-none text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    className="rounded border-blue-400 text-blue-500 focus:ring-blue-400/50 bg-blue-50"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <a className="font-bold text-blue-600 hover:text-cyan-600 transition-colors duration-200 hover:scale-105" href="#">
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 px-6 py-4 font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 disabled:opacity-60 disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-cyan-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" suppressHydrationWarning></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 opacity-20 animate-pulse" suppressHydrationWarning></div>
                <span className="relative z-10 inline-flex items-center justify-center gap-3">
                  <svg
                    className={`size-5 ${loading ? "animate-spin" : "group-hover:translate-x-2 group-hover:scale-110"} transition-all duration-300`}
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M11.25 3.75l7.5 7.5-7.5 7.5M3.75 3.75h7.5v15h-7.5V3.75z" />
                  </svg>
                  {loading ? "Signing in…" : "Sign In"}
                </span>
              </button>
            </form>

            {/* Footer */}
            <footer className="relative z-10 mt-8 text-center text-xs text-slate-500">
              <p>© 2025 HOME — Hospital Operation &amp; Management Ecosystem</p>
              <p className="mt-1">For official use in Malaysian Government Hospitals</p>
            </footer>
          </div>

          <p className="mt-6 text-center text-xs text-black">
            Need access? Contact your System Admin.
          </p>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-background" suppressHydrationWarning>
      <div className="relative z-10" suppressHydrationWarning>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" suppressHydrationWarning></div>
          </div>
        }>
          <LoginPageContent />
        </Suspense>
      </div>
    </div>
  );
}