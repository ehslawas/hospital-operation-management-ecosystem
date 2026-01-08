import Link from 'next/link';
import { cookies } from 'next/headers';

async function hasLogisticsAccess(): Promise<boolean> {
  const jar = await cookies();
  const roles = (jar.get('roles')?.value || '').split(',').map((r) => r.trim());
  return roles.includes('pharmacy_logistics') || roles.includes('admin');
}

export default async function Nav() {
  const canSeeLogistics = await hasLogisticsAccess();

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-12 items-center gap-6">
          <Link href="/" className="text-sm font-semibold">Hospital</Link>
          <div className="flex-1 flex items-center gap-4 text-sm text-gray-700">
            {canSeeLogistics && (
              <Link href="/pharmacy/logistics" className="hover:text-black">Pharmacy Logistics</Link>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/dev/login?role=pharmacy_logistics" className="text-gray-500 hover:text-gray-700">Grant logistics</Link>
            <Link href="/dev/login?role=admin" className="text-gray-500 hover:text-gray-700">Grant admin</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}


