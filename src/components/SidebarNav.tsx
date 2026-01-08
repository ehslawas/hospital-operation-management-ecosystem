"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconHome, IconDashboard, IconBox, IconReceipt, IconTruck, IconFile, IconAlert, IconArrows, IconBeaker, IconChart, IconCog, IconMoney, IconMaintenance, IconUsers } from '@/components/ui/Icons';

type Props = { collapsed?: boolean };

export default function SidebarNav({ collapsed = false }: Props) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [department, setDepartment] = useState<string>('');
  
  useEffect(() => { 
    setMounted(true);
    
    // Get department from localStorage first (more reliable), then cookie as fallback
    const getDepartment = () => {
      if (typeof document !== 'undefined') {
        // Try localStorage first (more reliable during hydration)
        const storedDept = localStorage.getItem('department');
        if (storedDept) {
          return storedDept;
        }
        
        // Fallback to cookie
        const cookieValue = document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1];
        if (cookieValue) {
          return decodeURIComponent(cookieValue);
        }
      }
      return '';
    };
    
    const dept = getDepartment();
    console.log('Department loaded:', dept); // Debug log
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

  // Save department to localStorage as backup (if not already there)
  useEffect(() => {
    if (mounted && department && typeof window !== 'undefined') {
      const currentDept = localStorage.getItem('department');
      if (currentDept !== department) {
        localStorage.setItem('department', department);
      }
    }
  }, [department, mounted]);

  // Listen for storage changes to handle department updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'department' && e.newValue) {
          console.log('Department changed via storage:', e.newValue);
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
          <Link href={href} className={`${base} ${active ? activeCls : inactive}`}>
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
      <Link href={href} className={`${base} ${active ? activeCls : inactive}`}>
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  }

  function subItem(href: string, label: string, hasSubItems = false, parentKey = '') {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    const base = `flex items-center ${collapsed ? 'justify-center' : 'gap-2'} rounded-lg px-3 py-1.5 transition-all duration-200 text-sm group`;
    const inactive = 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 text-slate-600 hover:shadow-sm hover:scale-[1.01]';
    const activeCls = 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50 shadow-sm scale-[1.01] font-semibold';
    
    if (hasSubItems) {
      const isExpanded = expandedItems.includes(parentKey);
      if (collapsed) return null;
      return (
        <div>
          <div 
            className={`${base} ${active ? activeCls : inactive} cursor-pointer`}
            onClick={() => toggleExpanded(parentKey)}
          >
            {!collapsed && <span className="ml-4">{label}</span>}
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
        {!collapsed && <span className="ml-4">{label}</span>}
      </Link>
    );
  }

  // Debug log for department
  if (mounted) {
    console.log('Rendering sidebar for department:', department);
  }

  return (
    <nav className={`py-2 space-y-2 text-sm ${collapsed ? 'px-2' : 'px-3'}`} suppressHydrationWarning>
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
      
      {/* Emergency & Trauma - for emergency department */}
      {mounted && department === 'Emergency & Trauma' && (
        <>
          {/* Distribution */}
          <div className="space-y-1.5">
            {item('/distribution', <IconTruck />, 'Distribution', true, 'distribution')}
            {expandedItems.includes('distribution') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/distribution/request', 'Request')}
                {subItem('/distribution/issue', 'Issue')}
              </div>
            )}
          </div>

          {/* Catalog */}
          <div className="space-y-1.5">
            {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog-etu')}
            {expandedItems.includes('catalog-etu') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/drug-catalog', 'Drug Catalog')}
                {subItem('/non-drug-catalog', 'Non Drug Catalog')}
                {subItem('/supplier-catalog', 'Supplier Catalog')}
                {subItem('/contract-catalog', 'Contract Catalog')}
                {subItem('/mof-catalog', 'MOF Catalog')}
                {subItem('/kkm-hospital-catalog', 'KKM Hospital Catalog')}
                {subItem('/kkm-clinic-catalog', 'KKM Clinic Catalog')}
              </div>
            )}
          </div>

          {/* Reports */}
          <div className="space-y-1.5">
            {item('/emergency/reports', <IconChart />, 'Reports')}
          </div>

          {/* System */}
          <div className="space-y-1.5">
            {item('/system', <IconCog />, 'System', true, 'system-etu')}
            {expandedItems.includes('system-etu') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/logs', 'Logs')}
                {subItem('/settings', 'Settings')}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Laboratory - for laboratory department */}
      {mounted && department === 'Laboratory' && (
        <div className="space-y-1.5">
          {item('/laboratory', <IconBeaker />, 'Laboratory Services')}
        </div>
      )}
      
      {/* Radiology - for radiology department */}
      {mounted && department === 'Radiology' && (
        <div className="space-y-1.5">
          {item('/radiology', <IconChart />, 'Radiology')}
        </div>
      )}
      
      {/* Maternity Ward - for maternity department */}
      {mounted && department === 'Maternity Ward' && (
        <div className="space-y-1.5">
          {item('/maternity', <IconAlert />, 'Maternity Ward')}
        </div>
      )}
      
      {/* General Ward - for general ward department */}
      {mounted && department === 'General Ward' && (
        <>
          {/* Distribution */}
          <div className="space-y-1.5">
            {item('/distribution', <IconTruck />, 'Distribution', true, 'distribution-general-ward')}
            {expandedItems.includes('distribution-general-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/distribution/request', 'Request')}
                {subItem('/distribution/issue', 'Issue')}
              </div>
            )}
          </div>

          {/* Catalog */}
          <div className="space-y-1.5">
            {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog-general-ward')}
            {expandedItems.includes('catalog-general-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/drug-catalog', 'Drug Catalog')}
                {subItem('/non-drug-catalog', 'Non Drug Catalog')}
              </div>
            )}
          </div>

          {/* Reports */}
          <div className="space-y-1.5">
            {item('/general-ward/reports', <IconChart />, 'Reports')}
          </div>

          {/* System */}
          <div className="space-y-1.5">
            {item('/system', <IconCog />, 'System', true, 'system-general-ward')}
            {expandedItems.includes('system-general-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/logs', 'Logs')}
                {subItem('/settings', 'Settings')}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Maternity Ward - for maternity department */}
      {mounted && department === 'Maternity Ward' && (
        <>
          {/* Distribution */}
          <div className="space-y-1.5">
            {item('/distribution', <IconTruck />, 'Distribution', true, 'distribution-maternity-ward')}
            {expandedItems.includes('distribution-maternity-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/distribution/request', 'Request')}
                {subItem('/distribution/issue', 'Issue')}
              </div>
            )}
          </div>

          {/* Catalog */}
          <div className="space-y-1.5">
            {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog-maternity-ward')}
            {expandedItems.includes('catalog-maternity-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/drug-catalog', 'Drug Catalog')}
                {subItem('/non-drug-catalog', 'Non Drug Catalog')}
                {subItem('/supplier-catalog', 'Supplier Catalog')}
                {subItem('/contract-catalog', 'Contract Catalog')}
                {subItem('/mof-catalog', 'MOF Catalog')}
                {subItem('/kkm-hospital-catalog', 'KKM Hospital Catalog')}
                {subItem('/kkm-clinic-catalog', 'KKM Clinic Catalog')}
              </div>
            )}
          </div>

          {/* Reports */}
          <div className="space-y-1.5">
            {item('/maternity-ward/reports', <IconChart />, 'Reports')}
          </div>

          {/* System */}
          <div className="space-y-1.5">
            {item('/system', <IconCog />, 'System', true, 'system-maternity-ward')}
            {expandedItems.includes('system-maternity-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/logs', 'Logs')}
                {subItem('/settings', 'Settings')}
              </div>
            )}
          </div>
        </>
      )}

      {/* Paediatric Ward - for paediatric department */}
      {mounted && department === 'Paediatric Ward' && (
        <>
          {/* Distribution */}
          <div className="space-y-1.5">
            {item('/distribution', <IconTruck />, 'Distribution', true, 'distribution-paediatric-ward')}
            {expandedItems.includes('distribution-paediatric-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/distribution/request', 'Request')}
                {subItem('/distribution/issue', 'Issue')}
              </div>
            )}
          </div>

          {/* Catalog */}
          <div className="space-y-1.5">
            {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog-paediatric-ward')}
            {expandedItems.includes('catalog-paediatric-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/drug-catalog', 'Drug Catalog')}
                {subItem('/non-drug-catalog', 'Non Drug Catalog')}
                {subItem('/supplier-catalog', 'Supplier Catalog')}
                {subItem('/contract-catalog', 'Contract Catalog')}
                {subItem('/mof-catalog', 'MOF Catalog')}
                {subItem('/kkm-hospital-catalog', 'KKM Hospital Catalog')}
                {subItem('/kkm-clinic-catalog', 'KKM Clinic Catalog')}
              </div>
            )}
          </div>

          {/* Reports */}
          <div className="space-y-1.5">
            {item('/paediatric-ward/reports', <IconChart />, 'Reports')}
          </div>

          {/* System */}
          <div className="space-y-1.5">
            {item('/system', <IconCog />, 'System', true, 'system-paediatric-ward')}
            {expandedItems.includes('system-paediatric-ward') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/logs', 'Logs')}
                {subItem('/settings', 'Settings')}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Front Desk - for reception department */}
      {mounted && department === 'Front Desk' && (
        <div className="space-y-1.5">
          {item('/front-desk', <IconHome />, 'Front Desk', true, 'frontdesk')}
          {expandedItems.includes('frontdesk') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/front-desk/patient-management', 'Patient Management')}
              {subItem('/front-desk/visit-management', 'Visit Management')}
              {subItem('/front-desk/no-show-management', 'No Show Management')}
              {subItem('/front-desk/reports', 'Reports')}
            </div>
          )}
        </div>
      )}
      
      {/* Haemodialysis - for haemodialysis department */}
      {mounted && department === 'Haemodialysis' && (
        <div className="space-y-1.5">
          {item('/haemodialysis', <IconBeaker />, 'Haemodialysis')}
        </div>
      )}
      
      {/* Pharmacy Counter - for pharmacy counter department */}
      {mounted && department === 'Pharmacy Counter' && (
        <>
          {/* Outpatient Services */}
          <div className="space-y-1.5">
            {item('/dispensing/outpatient', <IconHome />, 'Outpatient Services', true, 'pc-outpatient')}
            {expandedItems.includes('pc-outpatient') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
                {subItem('/dispensing/outpatient', 'Outpatient Counter')}
                {subItem('/dispensing/vas', 'SPUB & VAS')}
              </div>
            )}
          </div>

          {/* Inpatient Services */}
          <div className="space-y-1.5">
            {item('/dispensing/inpatient', <IconBeaker />, 'Inpatient Services', true, 'pc-inpatient')}
            {expandedItems.includes('pc-inpatient') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-green-200/50 pl-3.5">
                {subItem('/dispensing/inpatient/medrec', 'Medication Reconciliation')}
                {subItem('/dispensing/inpatient/screening', 'Order Screening')}
                {subItem('/dispensing/inpatient/uod', 'Unit-of-Dose (UOD)')}
                {subItem('/dispensing/inpatient/ward-stock', 'Ward Stock & Imprest')}
                {subItem('/dispensing/inpatient/stat', 'STAT Orders')}
                {subItem('/dispensing/inpatient', 'Discharge (TTO)')}
              </div>
            )}
          </div>

          {/* Clinical Services */}
          <div className="space-y-1.5">
            {item('/dispensing/clinical/tdm', <IconBeaker />, 'Clinical Services', true, 'pc-clinical')}
            {expandedItems.includes('pc-clinical') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-purple-200/50 pl-3.5">
                {subItem('/dispensing/clinical/tdm', 'TDM')}
                {subItem('/dispensing/clinical/ams', 'AMS')}
                {subItem('/dispensing/clinical/ham', 'High-Risk Medicines')}
                {subItem('/dispensing/clinical/iv-admix', 'IV Admixture/TPN')}
                {subItem('/dispensing/counseling', 'Counseling')}
              </div>
            )}
          </div>

          {/* Inventory & CD */}
          <div className="space-y-1.5">
            {item('/dispensing/inventory', <IconBox />, 'Inventory & CD', true, 'pc-inventory')}
            {expandedItems.includes('pc-inventory') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-yellow-200/50 pl-3.5">
                {subItem('/dispensing/inventory/dd-register', 'DD/CD Register')}
                {subItem('/dispensing/inventory/cold-chain', 'Cold Chain')}
                {subItem('/dispensing/inventory', 'Stock Management')}
              </div>
            )}
          </div>

          {/* Quality & Admin */}
          <div className="space-y-1.5">
            {item('/dispensing/settings', <IconCog />, 'Quality & Admin', true, 'pc-admin')}
            {expandedItems.includes('pc-admin') && (
              <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-red-200/50 pl-3.5">
                {subItem('/dispensing/quality', 'Quality & Safety')}
                {subItem('/dispensing/checklist', 'Master Checklist')}
                {subItem('/dispensing/settings', 'Settings')}
                {subItem('/dispensing/help', 'Help')}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Office Administration */}
      {mounted && department === 'Office Admin' && (
        <div className="space-y-1.5">
          {item('/office-admin', <IconCog />, 'Office Administration')}
          {item('/waran', <IconMoney />, 'Financial Management', true, 'waran')}
          {expandedItems.includes('waran') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/waran/budget-overview', 'Financial Overview')}
              {subItem('/waran/budget-allocation', 'Budgetary Allocation')}
              {subItem('/waran/appl-budget', 'Annual Procurement Plan (APPL)')}
              {subItem('/waran/contract-budget', 'Cost Centre (CC/DP)')}
              {subItem('/waran/financial-forecasting', 'Financial Forecasting')}
            </div>
          )}
        </div>
      )}
      
      {/* Inventory - primary for logistics/substore (also visible for Office Admin) */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Pharmacy Sub Store' || department === 'Office Admin') && (
        <div className="space-y-1.5">
          {item('/inventory', <IconBox />, 'Inventory', true, 'inventory')}
          {expandedItems.includes('inventory') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {/* Hide all submenus for Office Admin except Medical Oxygen */}
              {department !== 'Office Admin' && subItem('/inventory/drug', 'Drug')}
              {department !== 'Office Admin' && subItem('/inventory/non-drug', 'Non Drug')}
              {department !== 'Office Admin' && subItem('/buffer-level', 'Buffer Level')}
              {department !== 'Office Admin' && subItem('/inventory/item-movement', 'Item Movement')}
              {subItem('/inventory/medical-oxygen', 'Medical Oxygen')}
            </div>
          )}
        </div>
      )}

      {/* Financial Management - for pharmacy logistics */}
      {mounted && department === 'Pharmacy Logistic' && (
        <div className="space-y-1.5">
          {item('/waran', <IconMoney />, 'Financial Management', true, 'waran')}
          {expandedItems.includes('waran') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/waran/budget-overview', 'Financial Overview')}
              {subItem('/waran/budget-allocation', 'Budgetary Allocation')}
              {subItem('/waran/appl-budget', 'Annual Procurement Plan (APPL)')}
              {subItem('/waran/contract-budget', 'Cost Centre (CC/DP)')}
              {subItem('/waran/financial-forecasting', 'Financial Forecasting')}
            </div>
          )}
        </div>
      )}

      {/* Procurement - for logistics/admin */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Office Admin') && (
        <div className="space-y-1.5">
          {item('/procurement', <IconReceipt />, 'Procurement', true, 'procurement')}
          {expandedItems.includes('procurement') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/purchase-orders', 'Purchase Orders')}
              {subItem('/lpo-management', 'LPO Oversight')}
              {subItem('/delivery-orders', 'Delivery Oversight')}
              {subItem('/receiving-oversight', 'Receiving Oversight')}
              {subItem('/payment-management', 'Payment Oversight')}
              {subItem('/order-tracking', 'Order Tracking')}
            </div>
          )}
        </div>
      )}

      {/* Distribution - for pharmacy logistics and sub store */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Pharmacy Sub Store') && (
        <div className="space-y-1.5">
          {item('/distribution', <IconTruck />, 'Distribution', true, 'distribution-pharmacy')}
          {expandedItems.includes('distribution-pharmacy') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/issuing', 'Intra Facility Transfer')}
              {subItem('/borrowing', 'Inter Facility Transfer')}
            </div>
          )}
        </div>
      )}

      {/* Compliance & Risk - logistics focus (also visible for Sub Store) */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Pharmacy Sub Store') && (
        <div className="space-y-1.5">
          {item('/compliance', <IconAlert />, 'Compliance & Risk', true, 'compliance')}
          {expandedItems.includes('compliance') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/lou', 'LOU Oversight')}
              {department === 'Pharmacy Logistic' && subItem('/penalties', 'Penalty Oversight')}
              {subItem('/bad-stock', 'Defective Stock')}
              {subItem('/near-expiry', 'Near-Expiry Items')}
              {subItem('/slow-moving', 'Slow-Moving Stock')}
            </div>
          )}
        </div>
      )}

      {/* Catalog - logistics/admin (also visible for Sub Store) */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Office Admin' || department === 'Pharmacy Sub Store') && (
        <div className="space-y-1.5">
          {item('/catalog', <IconBeaker />, 'Catalog', true, 'catalog')}
          {expandedItems.includes('catalog') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/drug-catalog', 'Drug Catalog')}
              {subItem('/non-drug-catalog', 'Non Drug Catalog')}
              {subItem('/supplier-catalog', 'Supplier Catalog')}
              {subItem('/contract-catalog', 'Contract Catalog')}
              {subItem('/mof-catalog', 'MOF Catalog')}
              {subItem('/kkm-hospital-catalog', 'KKM Hospital Catalog')}
              {subItem('/kkm-clinic-catalog', 'KKM Clinic Catalog')}
            </div>
          )}
        </div>
      )}

      {/* Maintenance - logistics (also visible for Sub Store) */}
      {mounted && (department === 'Pharmacy Logistic' || department === 'Pharmacy Sub Store') && (
        <div className="space-y-1.5">
          {item('/maintenance', <IconMaintenance />, 'Maintenance', true, 'maintenance')}
          {expandedItems.includes('maintenance') && (
            <div className="ml-2 mt-1.5 space-y-1 border-l-2 border-blue-200/50 pl-3.5">
              {subItem('/maintenance/unit-catalog-list', 'Unit Catalog List')}
              {subItem('/maintenance/stock-location', 'Stock Location')}
              {subItem('/stock-verification', 'Stock Verification')}
            </div>
          )}
        </div>
      )}

      {/* System - admin and pharmacy logistics */}
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



