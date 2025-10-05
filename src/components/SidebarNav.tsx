"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconHome, IconDashboard, IconBox, IconReceipt, IconTruck, IconFile, IconAlert, IconArrows, IconBeaker, IconChart, IconCog, IconMoney, IconMaintenance } from '@/components/ui/Icons';

type Props = { showLogistics: boolean };

export default function SidebarNav({ showLogistics }: Props) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  useEffect(() => { setMounted(true); }, []);

  function toggleExpanded(item: string) {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  }

  function item(href: string, icon: React.ReactNode, label: string, hasSubItems = false, parentKey = '') {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    const base = 'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer';
    const inactive = 'hover:bg-cyan-50 hover:text-cyan-700 text-slate-700';
    const activeCls = 'bg-cyan-600/10 text-cyan-700 border border-cyan-200';
    
    if (hasSubItems) {
      const isExpanded = expandedItems.includes(parentKey);
      return (
        <div>
          <div 
            className={`${base} ${active ? activeCls : inactive}`}
            onClick={() => toggleExpanded(parentKey)}
          >
            {icon}
            <span>{label}</span>
            <svg 
              className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {/* Sub-items will be rendered here */}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <Link href={href} className={`${base} ${active ? activeCls : inactive}`}>
        {icon}
        <span>{label}</span>
      </Link>
    );
  }

  function subItem(href: string, label: string, hasSubItems = false, parentKey = '') {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    const base = 'flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors text-sm';
    const inactive = 'hover:bg-cyan-50 hover:text-cyan-700 text-slate-600';
    const activeCls = 'bg-cyan-600/10 text-cyan-700 border border-cyan-200';
    
    if (hasSubItems) {
      const isExpanded = expandedItems.includes(parentKey);
      return (
        <div>
          <div 
            className={`${base} ${active ? activeCls : inactive} cursor-pointer`}
            onClick={() => toggleExpanded(parentKey)}
          >
            <span className="ml-4">{label}</span>
            <svg 
              className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      );
    }
    
    return (
      <Link href={href} className={`${base} ${active ? activeCls : inactive}`}>
        <span className="ml-4">{label}</span>
      </Link>
    );
  }

  if (!mounted) return null;

  return (
    <nav className="px-2 py-2 space-y-1 text-sm text-slate-700" suppressHydrationWarning>
      {/* Dashboard */}
      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Main</div>
      {item('/', <IconHome />, 'Dashboard')}
      {showLogistics && item('/pharmacy/logistics', <IconDashboard />, 'Logistics Dashboard')}
      
      {/* Financial Management */}
      {item('/waran', <IconMoney />, 'Financial Management', true, 'waran')}
      {expandedItems.includes('waran') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/waran/budget-overview', 'Financial Overview')}
          {subItem('/waran/budget-allocation', 'Budgetary Allocation')}
          {subItem('/waran/appl-budget', 'Annual Procurement Plan (APPL)')}
          {subItem('/waran/contract-budget', 'Cost Centre (CC/DP)')}
          {subItem('/waran/financial-forecasting', 'Financial Forecasting')}
        </div>
      )}
      
      {/* Inventory */}
      {item('/inventory', <IconBox />, 'Inventory', true, 'inventory')}
      {expandedItems.includes('inventory') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/inventory/drug', 'Drug')}
          {subItem('/inventory/non-drug', 'Non Drug')}
          {subItem('/buffer-level', 'Buffer Level')}
          {subItem('/inventory/item-movement', 'Item Movement')}
          {subItem('/inventory/medical-oxygen', 'Medical Oxygen')}
        </div>
      )}

      {/* Procurement */}
      {item('/procurement', <IconReceipt />, 'Procurement', true, 'procurement')}
      {expandedItems.includes('procurement') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/purchase-orders', 'Purchase Orders')}
          {subItem('/lpo-management', 'LPO Oversight')}
          {subItem('/delivery-orders', 'Delivery Oversight')}
          {subItem('/receiving-oversight', 'Receiving Oversight')}
          {subItem('/payment-management', 'Payment Oversight')}
          {subItem('/order-tracking', 'Order Tracking')}
        </div>
      )}

      {/* Distribution */}
      {item('/distribution', <IconArrows />, 'Distribution', true, 'distribution')}
      {expandedItems.includes('distribution') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/issuing', 'Intra-Facility Management')}
          {subItem('/borrowing', 'Inter-Facility Management')}
        </div>
      )}

      {/* Compliance & Risk */}
      {item('/compliance', <IconAlert />, 'Compliance & Risk', true, 'compliance')}
      {expandedItems.includes('compliance') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/lou', 'LOU Oversight')}
          {subItem('/penalties', 'Penalty Oversight')}
          {subItem('/bad-stock', 'Defective Stock')}
          {subItem('/near-expiry', 'Near-Expiry Items')}
          {subItem('/slow-moving', 'Slow-Moving Stock')}
        </div>
      )}

      {/* Catalog */}
      {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog')}
      {expandedItems.includes('catalog') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/drug-catalog', 'Drug Catalog')}
          {subItem('/non-drug-catalog', 'Non Drug Catalog')}
          {subItem('/supplier-catalog', 'Supplier Catalog')}
          {subItem('/contract-catalog', 'Contract Catalog')}
          {subItem('/mof-catalog', 'MOF Catalog')}
          {subItem('/kkm-hospital-catalog', 'KKM Hospital Catalog')}
          {subItem('/kkm-clinic-catalog', 'KKM Clinic Catalog')}
        </div>
      )}

      {/* Maintenance */}
      {item('/maintenance', <IconMaintenance />, 'Maintenance', true, 'maintenance')}
      {expandedItems.includes('maintenance') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/maintenance/unit-catalog-list', 'Unit Catalog List')}
          {subItem('/maintenance/stock-location', 'Stock Location')}
          {subItem('/stock-verification', 'Stock Verification')}
        </div>
      )}

      {/* System */}
      {item('/system', <IconCog />, 'System', true, 'system')}
      {expandedItems.includes('system') && (
        <div className="ml-4 mt-1 space-y-1">
          {subItem('/reports', 'Reports')}
          {subItem('/logs', 'Logs')}
          {subItem('/settings', 'Settings')}
        </div>
      )}
    </nav>
  );
}


