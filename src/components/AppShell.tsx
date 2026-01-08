'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import SidebarNav from '@/components/SidebarNav';
import ClientOnly from '@/components/ClientOnly';

interface SessionInfo {
	roles: string[];
	user: string;
	department: string;
}

function getSessionInfo(): SessionInfo {
	if (typeof document === 'undefined') {
		return { roles: [], user: 'Guest', department: 'General' };
	}
	
	const roles = (document.cookie
		.split('; ')
		.find(row => row.startsWith('roles='))?.split('=')[1] || '')
		.split(',')
		.map((r) => r.trim())
		.filter(Boolean);
	
	const user = decodeURIComponent(
		document.cookie
			.split('; ')
			.find(row => row.startsWith('user='))?.split('=')[1] || 'Guest'
	);
	
	const department = decodeURIComponent(
		document.cookie
			.split('; ')
			.find(row => row.startsWith('department='))?.split('=')[1] || 'General'
	);
	
	return { roles, user, department };
}

export function AppShell({ children }: { children: ReactNode }) {
	const [sessionInfo, setSessionInfo] = useState<SessionInfo>({ roles: [], user: 'Guest', department: 'General' });
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mounted, setMounted] = useState(false);
	
	useEffect(() => {
		setSessionInfo(getSessionInfo());
		setMounted(true);
	}, []);
	
	const { roles, user, department } = sessionInfo;
	const initial = (user || 'G').trim().charAt(0).toUpperCase();
	
	return (
		<div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20" suppressHydrationWarning>
			{/* Mobile Menu Overlay with fade animation */}
			{mobileMenuOpen && (
				<div 
					className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in" 
					onClick={() => setMobileMenuOpen(false)}
					suppressHydrationWarning
				/>
			)}
			
    		{/* Sidebar with slide animation */}
			<aside className={`fixed left-0 top-0 h-screen border-r border-slate-200/60 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 z-50 shadow-2xl shadow-slate-900/5 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${sidebarCollapsed ? 'w-20 lg:w-20' : 'w-72 lg:w-72'}`} suppressHydrationWarning>
				<div className="h-full flex flex-col overflow-y-auto" suppressHydrationWarning>
					{/* Modern Header with Gradient */}
					<div className="px-4 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
						{sidebarCollapsed ? (
							<div className="flex items-center justify-center animate-scale-in">
								<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg ring-1 ring-white/20 transition-transform hover:scale-110">
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
									</svg>
								</span>
							</div>
						) : (
							<div className="flex items-center gap-3 animate-slide-in-left">
								<span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg ring-1 ring-white/20 transition-transform hover:scale-110">
									<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
									</svg>
								</span>
								<div className="text-white">
									<div className="text-lg font-bold tracking-tight">HOME</div>
									<div className="text-xs text-blue-100 font-medium">Hospital Operation & Management Ecosystem</div>
								</div>
							</div>
						)}
					</div>
					{/* Collapsible toggle for desktop */}
					<div className="hidden lg:flex items-center justify-end px-2 py-1">
						<button 
							onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
							className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
							title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						>
							<svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? 'M4 12h16m-6-6l6 6-6 6' : 'M20 12H4m6-6l-6 6 6 6'} />
							</svg>
						</button>
					</div>
					<SidebarNav collapsed={sidebarCollapsed} />
					{/* Modern Footer with fade-in */}
					<div className="mt-auto p-4 border-t border-slate-200/60 bg-gradient-to-t from-slate-50/50 to-transparent" suppressHydrationWarning>
						<div className="space-y-3">
							{!sidebarCollapsed && (
								<div className="flex gap-2 text-xs animate-fade-in">
									<Link href="/dev/login?role=pharmacy_logistics" className="text-slate-500 hover:text-blue-600 transition-all duration-200 font-medium hover:scale-105" suppressHydrationWarning>Grant logistics</Link>
									<span className="text-slate-300">·</span>
									<Link href="/dev/login?role=admin" className="text-slate-500 hover:text-blue-600 transition-all duration-200 font-medium hover:scale-105" suppressHydrationWarning>Grant admin</Link>
								</div>
							)}
							<button 
								onClick={() => {
									// Clear localStorage
									try {
										localStorage.clear();
									} catch (e) {
										console.error('Error clearing localStorage:', e);
									}
									// Redirect to logout route which will clear cookies
									window.location.href = '/logout';
								}}
								className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 border border-slate-300/50 px-4 py-2.5 text-slate-700 font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]" suppressHydrationWarning>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								{!sidebarCollapsed && 'Logout'}
							</button>
						</div>
					</div>
				</div>
			</aside>
			<div className={`h-screen overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`} suppressHydrationWarning>
				{/* Modern Header with slide-in animation */}
				<header className={`sticky top-0 right-0 left-0 h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 flex items-center px-4 md:px-6 z-40 shadow-sm transition-all duration-300 ${mounted ? 'animate-slide-in-top' : ''}`}>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-4">
							{/* Mobile Menu Button */}
							<button 
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
								suppressHydrationWarning
							>
								<svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
							<div className="text-base md:text-lg font-bold text-slate-800 tracking-tight">Dashboard</div>
							<div className="hidden xl:block text-sm text-slate-500">Welcome back, {user}</div>
						</div>
						<div className="flex items-center gap-2 md:gap-4">
							{/* Modern Search - Hidden on very small screens */}
							<div className="relative hidden md:block">
								<input 
									className="w-40 lg:w-64 rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md" 
									placeholder="Search..." 
									suppressHydrationWarning 
								/>
								<svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
							<ClientOnly>
							<div className="hidden xl:flex items-center gap-3 animate-fade-in">
								<span className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1.5 text-xs font-semibold text-blue-800 border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">{user}</span>
								<span className="rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">{department}</span>
							</div>
							</ClientOnly>
							<div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg ring-2 ring-white/50 hover:scale-110 transition-transform duration-200 cursor-pointer" suppressHydrationWarning />
						</div>
					</div>
				</header>
				<main className={`${mounted ? 'animate-fade-in' : ''}`}>
					{children}
				</main>
			</div>
		</div>
	);
}
