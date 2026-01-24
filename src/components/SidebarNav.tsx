import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { IconHome, IconDashboard, IconBox, IconReceipt, IconTruck, IconFile, IconAlert, IconArrows, IconBeaker, IconChart, IconCog, IconMoney, IconMaintenance, IconUsers } from '@/components/ui/Icons';

type Props = { collapsed?: boolean };

export default function SidebarNav({ collapsed = false }: Props) {
  const location = useLocation();
  const pathname = location.pathname;
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [department, setDepartment] = useState<string>('');

  useEffect(() => {
    setMounted(true);

    // Get department from localStorage first (more reliable), then cookie as fallback
    const getDepartment = () => {
      if (typeof document !== 'undefined') {
        const storedDept = localStorage.getItem('department');
        if (storedDept) return storedDept;

        const cookieValue = document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1];
        if (cookieValue) return decodeURIComponent(cookieValue);
      }
      return '';
    };

    const dept = getDepartment();
    setDepartment(dept);

    // Restore expanded items from localStorage
    if (typeof window !== 'undefined') {
      const savedExpandedItems = localStorage.getItem('sidebar-expanded-items');
      if (savedExpandedItems) {
        try {
          const parsed = JSON.parse(savedExpandedItems);
          setExpandedItems(parsed);
        } catch (e) {
          console.warn('Failed to parse saved expanded items:', e);
        }
      }
    }
  }, []);

  // Save expanded items whenever they change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems));
    }
  }, [expandedItems, mounted]);

  // Save department to localStorage
  useEffect(() => {
    if (mounted && department && typeof window !== 'undefined') {
      const currentDept = localStorage.getItem('department');
      if (currentDept !== department) {
        localStorage.setItem('department', department);
      }
    }
  }, [department, mounted]);

  // Listen for storage changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'department' && e.newValue) {
          setDepartment(e.newValue);
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  function toggleExpanded(item: string) {
    setExpandedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  }

  function item(href: string, icon: React.ReactNode, label: string, hasSubItems = false, parentKey = '') {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    const base = `flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} rounded-xl px-3 py-2 transition-all duration-200 cursor-pointer group`;
    const inactive = 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 text-slate-700 hover:shadow-sm hover:scale-[1.02]';
    const activeCls = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-500/20 scale-[1.02]';

    if (hasSubItems) {
      const isExpanded = expandedItems.includes(parentKey);
      if (collapsed) {
        // In collapsed mode, render a simple link with icon only
        return (
          <Link to={href} className={`${base} ${active ? activeCls : inactive}`}>
            {icon}
          </Link>
        );
      }
      return (
        <div>
          <div
            className={`${base} ${active ? activeCls : inactive} cursor-pointer`}
            onClick={() => toggleExpanded(parentKey)}
          >
            {icon}
            {!collapsed && <span>{label}</span>}
            <svg
              className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          {!collapsed && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {/* Sub-items will be rendered here */}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link to={href} className={`${base} ${active ? activeCls : inactive}`}>
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  }

  function subItem(href: string, label: string) {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    const base = `flex items-center ${collapsed ? 'justify-center' : 'gap-2'} rounded-lg px-3 py-1.5 transition-all duration-200 text-sm group`;
    const inactive = 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 text-slate-600 hover:shadow-sm hover:scale-[1.01]';
    const activeCls = 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50 shadow-sm scale-[1.01] font-semibold';

    if (collapsed) return null;

    return (
      <Link to={href} className={`${base} ${active ? activeCls : inactive}`}>
        {!collapsed && <span className="ml-4">{label}</span>}
      </Link>
    );
  }

  return (
    <nav className={`py-2 space-y-2 text-sm ${collapsed ? 'px-2' : 'px-3'}`}>
      {/* Dashboard */}
      <div className="space-y-1.5">
        {collapsed ? (
          <div className="h-6" />
        ) : (
          <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 bg-gradient-to-r from-slate-100/50 to-blue-100/30 rounded-lg border border-slate-200/30">Main</div>
        )}
        {item('/', <IconHome />, 'Dashboard')}
      </div>

      {/* Patient Management - Universal menu for all departments except Administrator */}
      {mounted && department !== 'Administrator' && (
        <div className="space-y-1.5">
          {item('/patient-management', <IconUsers />, 'Patient Management', true, 'patient-management')}
          {expandedItems.includes('patient-management') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/patient-management/patient-visit', 'Patient Visit')}
              {subItem('/patient-management/patient-data', 'Patient Data')}
            </div>
          )}
        </div>
      )}

      {/* Emergency & Trauma */}
      {mounted && department === 'Emergency & Trauma' && (
        <>
          <div className="space-y-1.5">
            {item('/distribution', <IconTruck />, 'Distribution', true, 'distribution')}
            {expandedItems.includes('distribution') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/distribution/request', 'Request')}
                {subItem('/distribution/issue', 'Issue')}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog-etu')}
            {expandedItems.includes('catalog-etu') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/drug-catalog', 'Drug Catalog')}
                {subItem('/non-drug-catalog', 'Non Drug Catalog')}
                {/* ... other catalogs ... */}
              </div>
            )}
          </div>
          {/* ... other ETU items ... */}
        </>
      )}

      {/* Pathology & Laboratory */}
      {mounted && (department === 'Pathology' || department === 'Laboratory') && (
        <>
          <div className="space-y-1.5">
            {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog-lab')}
            {expandedItems.includes('catalog-lab') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/drug-catalog', 'Drug Catalog')}
                {subItem('/non-drug-catalog', 'Non Drug Catalog')}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            {item('/lab/samples', <IconBeaker />, 'Sample Collection')}
          </div>
        </>
      )}

      {/* General Ward */}
      {mounted && department === 'General Ward' && (
        <>
          <div className="space-y-1.5">
            {item('/distribution', <IconTruck />, 'Distribution', true, 'distribution-general-ward')}
            {expandedItems.includes('distribution-general-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/distribution/request', 'Request')}
                {subItem('/distribution/issue', 'Issue')}
              </div>
            )}
          </div>
          {/* ... other GW items ... */}
        </>
      )}

      {/* Office Admin */}
      {mounted && department === 'Office Admin' && (
        <div className="space-y-1.5">
          {item('/office-admin', <IconCog />, 'Office Administration')}
          {item('/pharmacy/financial', <IconMoney />, 'Financial Management', true, 'waran')}
          {expandedItems.includes('waran') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/pharmacy/financial/budget', 'Financial Overview')}
              {subItem('/pharmacy/financial/warrant', 'Warrant')}
              {subItem('/pharmacy/financial/appl', 'APPL')}
              {subItem('/pharmacy/financial/cc', 'Cost Centre')}
              {subItem('/pharmacy/financial/forecast', 'Forecasting')}
            </div>
          )}
        </div>
      )}

      {/* Inventory */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Pharmacy Sub Store' || department === 'Office Admin') && (
        <div className="space-y-1.5">
          {item('/inventory', <IconBox />, 'Inventory', true, 'inventory')}
          {expandedItems.includes('inventory') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {department !== 'Office Admin' && subItem('/inventory/drug', 'Drug')}
              {department !== 'Office Admin' && subItem('/inventory/non-drug', 'Non Drug')}
              {/* ... other inventory ... */}
            </div>
          )}
        </div>
      )}

      {/* Procurement - Pharmacy Logistic or Office Admin */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Office Admin') && (
        <div className="space-y-1.5">
          {item('/pharmacy/procurement', <IconReceipt />, 'Procurement', true, 'procurement')}
          {expandedItems.includes('procurement') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/pharmacy/procurement/orders', 'Purchase Order')}
              {subItem('/pharmacy/procurement/lpo', 'Letter of Purchase Order')}
              {subItem('/pharmacy/procurement/tracking', 'Order Tracking')}
              {subItem('/pharmacy/procurement/receiving', 'Receiving')}
              {subItem('/pharmacy/procurement/payments', 'Payment')}
              {subItem('/pharmacy/procurement/penalties', 'Penalty')}
              {subItem('/pharmacy/procurement/lou', 'LOU')}
            </div>
          )}
        </div>
      )}

      {/* Compliance - Pharmacy Logistic */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Pharmacy Sub Store') && (
        <div className="space-y-1.5">
          {item('/compliance', <IconAlert />, 'Compliance & Risk', true, 'compliance')}
          {expandedItems.includes('compliance') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/bad-stock', 'Defective Stock')}
              {subItem('/near-expiry', 'Near-Expiry Items')}
            </div>
          )}
        </div>
      )}

      {/* System */}
      {mounted && (department === 'Office Admin' || department === 'Pharmacy Logistic') && (
        <div className="space-y-1.5">
          {item('/system', <IconCog />, 'System', true, 'system')}
          {expandedItems.includes('system') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/reports', 'Reports')}
              {subItem('/logs', 'Logs')}
              {subItem('/settings', 'Settings')}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
