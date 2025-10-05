import Link from 'next/link';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { IconBeaker } from '@/components/ui/Icons';
import SidebarNav from '@/components/SidebarNav';
import ClientOnly from '@/components/ClientOnly';

async function getSessionInfo(): Promise<{ showLogistics: boolean; roles: string[]; user: string; department: string }>{
	const jar = await cookies();
	const roles = (jar.get('roles')?.value || '').split(',').map((r) => r.trim()).filter(Boolean);
	const user = decodeURIComponent(jar.get('user')?.value || 'Guest');
	const department = decodeURIComponent(jar.get('department')?.value || 'General');
	const showLogistics = roles.includes('pharmacy_logistics') || roles.includes('admin');
	return { showLogistics, roles, user, department };
}

export async function AppShell({ children }: { children: ReactNode }) {
	const { showLogistics, roles, user, department } = await getSessionInfo();
	const initial = (user || 'G').trim().charAt(0).toUpperCase();
	return (
		<div className="min-h-screen bg-[rgb(245,248,252)]" suppressHydrationWarning>
			<aside className="hidden lg:block fixed left-0 top-0 w-64 h-screen border-r border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50">
				<div className="h-full flex flex-col overflow-y-auto" suppressHydrationWarning>
					<div className="px-4 h-14 flex items-center gap-2 font-semibold tracking-tight text-slate-800" suppressHydrationWarning>
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-600 text-white">
							<IconBeaker size={16} />
						</span>
						<span>Pharmacy Inventory & Logistics System (PILS)</span>
					</div>
					<div className="px-3 pb-2" suppressHydrationWarning>
						<ClientOnly>
						<div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
							<div className="flex items-center gap-3">
								<div className="h-8 w-8 shrink-0 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-semibold">{initial}</div>
								<div className="min-w-0">
									<div className="truncate text-sm font-semibold text-slate-900">{user}</div>
									<div className="truncate text-[11px] text-slate-500">{department}</div>
								</div>
							</div>
							{roles.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1">
									{roles.map((r)=> (
										<span key={r} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">{r}</span>
									))}
								</div>
							)}
						</div>
						</ClientOnly>
					</div>
					<SidebarNav showLogistics={showLogistics} />
					<div className="mt-auto p-3 text-xs text-slate-500" suppressHydrationWarning>
						<Link href="/dev/login?role=pharmacy_logistics" className="hover:underline" suppressHydrationWarning>Grant logistics</Link>
						<span className="px-1">·</span>
						<Link href="/dev/login?role=admin" className="hover:underline" suppressHydrationWarning>Grant admin</Link>
						<div className="mt-3" suppressHydrationWarning>
							<Link href="/dev/logout?redirect=/" className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50" suppressHydrationWarning>Logout</Link>
						</div>
					</div>
				</div>
			</aside>
			<div className="min-h-screen lg:ml-64" suppressHydrationWarning>
				<header className="fixed top-0 right-0 left-64 h-14 border-b border-slate-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 flex items-center px-4 z-40" suppressHydrationWarning>
					<div className="text-sm font-semibold text-slate-800" suppressHydrationWarning>Pharmacy Inventory & Logistics System (PILS)</div>
					<div className="ml-auto flex items-center gap-3" suppressHydrationWarning>
						<input className="hidden md:block rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-200" placeholder="Search..." suppressHydrationWarning />
						<ClientOnly>
						<div className="hidden md:flex items-center gap-2 text-xs">
							<span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{user}</span>
							<span className="rounded-md bg-cyan-50 px-2 py-1 text-cyan-700">{department}</span>
							{roles.map((r) => (
								<span key={r} className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{r}</span>
							))}
						</div>
						</ClientOnly>
						<div className="h-7 w-7 rounded-full bg-cyan-600/90" suppressHydrationWarning />
					</div>
				</header>
				<main className="pt-14 p-4 md:p-6">
					{children}
				</main>
			</div>
		</div>
	);
}
