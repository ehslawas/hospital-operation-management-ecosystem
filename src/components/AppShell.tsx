// @ts-nocheck
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
		<div className="h-screen overflow-hidden bg-slate-950 text-slate-100" suppressHydrationWarning>
			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div 
					className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden animate-fade-in" 
					onClick={() => setMobileMenuOpen(false)}
					suppressHydrationWarning
				/>
			)}
			
			{/* Sidebar with slide animation */}
			<aside className={`fixed left-0 top-0 h-screen border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl z-50 shadow-2xl shadow-slate-950/50 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-72 lg:w-72`} suppressHydrationWarning>
				<div className="h-full flex flex-col overflow-y-auto custom-scrollbar" suppressHydrationWarning>
					{/* Header */}
					<div className="px-4 py-4 bg-slate-900 border-b border-slate-800 shadow-lg">
						{sidebarCollapsed ? (
							<div className="flex items-center justify-center animate-scale-in">
								<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg transition-transform hover:scale-110">
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
									</svg>
								</span>
							</div>
						) : (
							<div className="flex items-center gap-3 animate-slide-in-left">
								<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg transition-transform hover:scale-110">
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
									</svg>
								</span>
								<div className="text-white">
									<div className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">H.O.M.E.</div>
									<div className="text-[10px] text-slate-400 font-medium truncate">Hospital Operation Ecosystem</div>
								</div>
							</div>
						)}
					</div>

					<div className="lg:hidden flex items-center justify-end px-2 py-1">
						<button 
							onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
							className="p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 hover:scale-110 active:scale-95"
							title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						>
							<svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? 'M4 12h16m-6-6l6 6-6 6' : 'M20 12H4m6-6l-6 6 6 6'} />
							</svg>
						</button>
					</div>

					<SidebarNav collapsed={sidebarCollapsed} />

					{/* Modern Footer */}
					<div className="mt-auto p-4 border-t border-slate-800/80 bg-slate-950/60" suppressHydrationWarning>
						<div className="space-y-3">
							{!sidebarCollapsed && (
								<div className="flex gap-2 text-xs animate-fade-in">
									<Link href="/dev/login?role=pharmacy_logistics" className="text-slate-400 hover:text-teal-400 transition-all duration-200 font-medium hover:scale-105" suppressHydrationWarning>Grant logistics</Link>
									<span className="text-slate-600">·</span>
									<Link href="/dev/login?role=admin" className="text-slate-400 hover:text-teal-400 transition-all duration-200 font-medium hover:scale-105" suppressHydrationWarning>Grant admin</Link>
								</div>
							)}
							<button 
								onClick={() => {
									try {
										localStorage.clear();
									} catch (e) {
										console.error('Error clearing localStorage:', e);
									}
									window.location.href = '/logout';
								}}
								className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2.5 text-slate-300 hover:text-white font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]" suppressHydrationWarning>
								<svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								{!sidebarCollapsed && 'Logout'}
							</button>
						</div>
					</div>
				</div>
			</aside>

			<div className={`h-screen overflow-y-auto transition-all duration-300 lg:ml-72`} suppressHydrationWarning>
				{/* Top Header */}
				<header className={`sticky top-0 right-0 left-0 h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl flex items-center px-4 md:px-6 z-40 shadow-xl ${mounted ? 'animate-slide-in-top' : ''}`}>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-4">
							<button 
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 hover:scale-110 active:scale-95 text-slate-400"
								suppressHydrationWarning
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
							<div className="text-base md:text-lg font-bold text-white tracking-tight">Dashboard</div>
							<div className="hidden xl:block text-sm text-slate-400">Welcome back, {user}</div>
						</div>
						<div className="flex items-center gap-2 md:gap-4">
							<div className="relative hidden md:block">
								<input 
									className="w-40 lg:w-64 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/40 transition-all duration-200 shadow-sm" 
									placeholder="Search..." 
									suppressHydrationWarning 
								/>
								<svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
							<ClientOnly>
								<div className="hidden xl:flex items-center gap-3 animate-fade-in">
									<span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/25 shadow-sm">{user}</span>
									<span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/25 shadow-sm">{department}</span>
								</div>
							</ClientOnly>
							<div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg ring-2 ring-teal-500/30 hover:scale-110 transition-transform duration-200 cursor-pointer" suppressHydrationWarning />
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
