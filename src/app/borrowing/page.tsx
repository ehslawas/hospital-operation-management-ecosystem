'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconArrowRight, IconArrowLeft, IconPackage, IconClipboardList, IconEye, IconPlus, IconSearch, IconFilter, IconX } from '@/components/ui/Icons';
import BorrowingReviewModal from '@/components/BorrowingReviewModal';

interface InterFacilityRequest {
  id: string;
  transferNumber: string;
  type: 'OUTGOING' | 'INCOMING';
  transferCategory: 'STOCK' | 'LOAN';
  fromFacility: string;
  toFacility: string;
  requestedBy: string;
  requestedAt: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED' | 'RETURNED' | 'PARTIALLY_RETURNED';
  items: TransferItem[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  expectedReturnDate?: string; // For loans
  actualReturnDate?: string; // For loans
  rejectionReason?: string;
  priority?: string;
}

interface TransferItem {
  id: string;
  itemName: string;
  drugCode: string;
  category: 'DRUG' | 'NON_DRUG';
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED';
  notes?: string;
}

export default function InterFacilityTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'outgoing' | 'incoming' | 'drafts' | 'tracking'>('overview');
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; request: InterFacilityRequest | null }>({ isOpen: false, request: null });
  const [returnQuantities, setReturnQuantities] = useState<{ [itemId: string]: number }>({});
  const [processedReturns, setProcessedReturns] = useState<{ [requestId: string]: { [itemId: string]: number } }>({});
  const [tempReturnQuantities, setTempReturnQuantities] = useState<{ [itemId: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [showRatingOptions, setShowRatingOptions] = useState(false);

  const openDetailModal = (request: InterFacilityRequest) => {
    setDetailModal({ isOpen: true, request });
    setCurrentPage(1); // Reset to first page when opening modal
    setShowRatingOptions(false); // Reset rating options
    // Initialize temp quantities with current return quantities for this request
    const currentReturns: { [itemId: string]: number } = {};
    request.items.forEach(item => {
      currentReturns[item.id] = returnQuantities[item.id] || 0;
    });
    setTempReturnQuantities(currentReturns);
  };

  const closeDetailModal = () => {
    setDetailModal({ isOpen: false, request: null });
    setShowRatingOptions(false); // Reset rating options
    // Reset temp quantities when closing without processing
    setTempReturnQuantities({});
  };
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'REJECTED' | 'RETURNED' | 'PARTIALLY_RETURNED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'STOCK' | 'LOAN'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
  const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | 'DRUG' | 'NON_DRUG'>('ALL');
  const [transferRequests, setTransferRequests] = useState<InterFacilityRequest[]>([]);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [kpiModal, setKpiModal] = useState<{ isOpen: boolean; status: 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | null }>({ isOpen: false, status: null });
  const [reviewModalIF, setReviewModalIF] = useState<{ isOpen: boolean; draft: InterFacilityRequest | null; rejectReason: string }>({ isOpen: false, draft: null, rejectReason: '' });

  useEffect(() => {
    setIsClient(true);
    // Mock data - in real app, this would come from API
    const mockTransfers = generateMockTransfers();
    setTransferRequests(mockTransfers);
    
    // Initialize return quantities with realistic test scenarios
    const testReturns: { [itemId: string]: number } = {};
    
    // Get all loan requests to set up varied scenarios
    const allLoans = mockTransfers.filter(r => r.transferCategory === 'LOAN' && (r.status === 'ISSUED' || r.status === 'APPROVED'));
    
    // Set up specific test scenarios with actual loan IDs
    allLoans.forEach((loan, loanIndex) => {
      // Use specific loan IDs to ensure varied scenarios
      if (loan.id.includes('outbound-loan-1') || loan.id.includes('outbound-loan-2')) {
        // AWAITING RETURN - no returns
        // Don't set any return quantities
      } else if (loan.id.includes('outbound-loan-3') || loan.id.includes('outbound-loan-4')) {
        // RETURN COMPLETE - all items fully returned
          loan.items.forEach((item) => {
          testReturns[item.id] = item.quantity;
          });
      } else if (loan.id.includes('outbound-loan-5') || loan.id.includes('outbound-loan-6')) {
        // PARTIALLY RETURN - mixed scenarios
          loan.items.forEach((item, itemIndex) => {
            if (itemIndex === 0) {
              // First item: Fully returned
            testReturns[item.id] = item.quantity;
          } else if (itemIndex === 1 && loan.items.length > 1) {
            // Second item: 60% returned
            testReturns[item.id] = Math.floor(item.quantity * 0.6);
          } else if (itemIndex === 2 && loan.items.length > 2) {
            // Third item: 40% returned
            testReturns[item.id] = Math.floor(item.quantity * 0.4);
          }
          // Other items: Not returned (0)
        });
      } else if (loan.id.includes('outbound-loan-7')) {
        // AWAITING RETURN - no returns
        // Don't set any return quantities
      } else {
        // For any other loans, create mixed scenarios
        if (loanIndex % 3 === 0) {
          // AWAITING RETURN
        } else if (loanIndex % 3 === 1) {
          // PARTIALLY RETURN
          loan.items.forEach((item, itemIndex) => {
            if (itemIndex === 0) {
              testReturns[item.id] = item.quantity;
            } else if (itemIndex === 1 && loan.items.length > 1) {
              testReturns[item.id] = Math.floor(item.quantity * 0.5);
            }
          });
        } else {
          // RETURN COMPLETE
          loan.items.forEach((item) => {
            testReturns[item.id] = item.quantity;
          });
        }
      }
    });
    
    setReturnQuantities(testReturns);
  }, []);

  // Sync filters based on view param in URL
  useEffect(() => {
    if (!isClient) return;
    const view = searchParams.get('view');
    setActiveView(view);
    switch (view) {
      case 'pending-review':
        setStatusFilter('PENDING_REVIEW');
        setTypeFilter('ALL');
        setDirectionFilter('ALL');
        break;
      case 'pending-approval':
        setStatusFilter('PENDING_APPROVAL');
        setTypeFilter('ALL');
        setDirectionFilter('ALL');
        break;
      case 'ready-to-issue':
        setStatusFilter('APPROVED');
        setTypeFilter('ALL');
        setDirectionFilter('ALL');
        break;
      case 'issued':
        setStatusFilter('ISSUED');
        setTypeFilter('ALL');
        setDirectionFilter('ALL');
        break;
      case 'loan-inbound':
        setStatusFilter('ALL');
        setTypeFilter('LOAN');
        setDirectionFilter('INCOMING');
        break;
      case 'loan-outbound':
        setStatusFilter('ALL');
        setTypeFilter('LOAN');
        setDirectionFilter('OUTGOING');
        break;
      default:
        setStatusFilter('ALL');
        setTypeFilter('ALL');
        setDirectionFilter('ALL');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isClient]);

  const generateMockTransfers = (): InterFacilityRequest[] => {
    const facilities = ['Main Hospital', 'Clinic A', 'Clinic B', 'Emergency Center', 'Surgery Center'];
    const staff = ['Dr. Sarah Ahmad', 'Nurse John Lim', 'Pharm. Maria Tan', 'Tech. Ahmad Rahman'];
    const statuses: InterFacilityRequest['status'][] = ['DRAFT', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'REJECTED', 'RETURNED'];
    const categories: InterFacilityRequest['transferCategory'][] = ['STOCK', 'LOAN'];

    const results: InterFacilityRequest[] = [];

    // Seed 5 Pending Review (15+ items each)
    for (let i = 0; i < 5; i++) {
      const isOutgoing = i % 2 === 0;
      const fromFacility = facilities[Math.floor(Math.random() * facilities.length)];
      const toFacility = facilities.filter(f => f !== fromFacility)[Math.floor(Math.random() * (facilities.length - 1))];
      const category = categories[Math.floor(Math.random() * categories.length)];
      results.push({
        id: `transfer-${String(results.length + 1).padStart(3, '0')}`,
        transferNumber: `IFT-2024-${String(results.length + 1).padStart(3, '0')}`,
        type: isOutgoing ? 'OUTGOING' : 'INCOMING',
        transferCategory: category,
        fromFacility: isOutgoing ? fromFacility : toFacility,
        toFacility: isOutgoing ? toFacility : fromFacility,
        requestedBy: staff[Math.floor(Math.random() * staff.length)],
        requestedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING_REVIEW',
        items: generateMockItems(16 + Math.floor(Math.random() * 6)),
        notes: Math.random() < 0.5 ? 'Urgent transfer required for patient care' : undefined,
        expectedReturnDate: category === 'LOAN' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      });
    }

    // Add some transfers with RECEIVED and IN_TRANSIT statuses for tracking
    const trackingStatuses: InterFacilityRequest['status'][] = ['RECEIVED', 'IN_TRANSIT', 'ISSUED'];
    for (let i = 0; i < 6; i++) {
      const isOutgoing = i % 2 === 0;
      const fromFacility = facilities[Math.floor(Math.random() * facilities.length)];
      const toFacility = facilities.filter(f => f !== fromFacility)[Math.floor(Math.random() * (facilities.length - 1))];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = trackingStatuses[Math.floor(Math.random() * trackingStatuses.length)];
      
      results.push({
        id: `tracking-${String(i + 1).padStart(3, '0')}`,
        transferNumber: `IFT-2024-TRK${String(i + 1).padStart(3, '0')}`,
        type: isOutgoing ? 'OUTGOING' : 'INCOMING',
        transferCategory: category,
        fromFacility: isOutgoing ? fromFacility : toFacility,
        toFacility: isOutgoing ? toFacility : fromFacility,
        requestedBy: staff[Math.floor(Math.random() * staff.length)],
        requestedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: status,
        items: generateMockItems(3 + Math.floor(Math.random() * 4)),
        notes: Math.random() < 0.3 ? 'Track transfer status' : undefined,
        expectedReturnDate: category === 'LOAN' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      });
    }

    // Seed 3 Pending Approval
    for (let i = 0; i < 3; i++) {
      const isOutgoing = i % 2 === 1;
      const fromFacility = facilities[Math.floor(Math.random() * facilities.length)];
      const toFacility = facilities.filter(f => f !== fromFacility)[Math.floor(Math.random() * (facilities.length - 1))];
      const category = categories[Math.floor(Math.random() * categories.length)];
      results.push({
        id: `transfer-${String(results.length + 1).padStart(3, '0')}`,
        transferNumber: `IFT-2024-${String(results.length + 1).padStart(3, '0')}`,
        type: isOutgoing ? 'OUTGOING' : 'INCOMING',
        transferCategory: category,
        fromFacility: isOutgoing ? fromFacility : toFacility,
        toFacility: isOutgoing ? toFacility : fromFacility,
        requestedBy: staff[Math.floor(Math.random() * staff.length)],
        requestedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING_APPROVAL',
        items: generateMockItems(3 + Math.floor(Math.random() * 5)),
        notes: Math.random() < 0.4 ? 'Please expedite due to low stock at receiving facility' : undefined,
        expectedReturnDate: category === 'LOAN' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      });
    }

    // Seed at least 5 completed (Approved/Rejected) with realistic data
    const seed: Array<Partial<InterFacilityRequest> & { status: InterFacilityRequest['status'] }> = [
      { status: 'APPROVED' },
      { status: 'REJECTED', rejectionReason: 'Requested quantity exceeds available stock. Please adjust and resubmit.' },
      { status: 'APPROVED' },
      { status: 'REJECTED', rejectionReason: 'Incomplete documentation from sending facility.' },
      { status: 'APPROVED' },
    ];

    seed.forEach((preset, i) => {
      const isOutgoing = i % 2 === 0;
      const fromFacility = facilities[Math.floor(Math.random() * facilities.length)];
      const toFacility = facilities.filter(f => f !== fromFacility)[Math.floor(Math.random() * (facilities.length - 1))];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const itemCount = i === 0 ? 6 : Math.floor(Math.random() * 3) + 2; // first seeded has >5 items
      results.push({
        id: `transfer-${String(results.length + 1).padStart(3, '0')}`,
        transferNumber: `IFT-2024-${String(results.length + 1).padStart(3, '0')}`,
        type: isOutgoing ? 'OUTGOING' : 'INCOMING',
        transferCategory: category,
        fromFacility: isOutgoing ? fromFacility : toFacility,
        toFacility: isOutgoing ? toFacility : fromFacility,
        requestedBy: staff[Math.floor(Math.random() * staff.length)],
        requestedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: preset.status,
        items: generateMockItems(itemCount),
        notes: Math.random() < 0.3 ? 'Urgent transfer required for patient care' : undefined,
        approvedBy: preset.status === 'APPROVED' ? 'Head Pharmacist' : undefined,
        approvedAt: preset.status === 'APPROVED' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        expectedReturnDate: category === 'LOAN' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        rejectionReason: preset.status === 'REJECTED' ? (preset.rejectionReason as string) : undefined,
      });
    });

    // Add specific inbound loans for testing - varied statuses for Incoming tab
    const inboundLoans = [
      { status: 'APPROVED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PENDING' },
      { status: 'ISSUED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PENDING' },
      { status: 'APPROVED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PARTIALLY_RETURNED' },
      { status: 'ISSUED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'COMPLETED' },
      { status: 'APPROVED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PENDING' },
      { status: 'ISSUED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PARTIALLY_RETURNED' },
      { status: 'APPROVED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'COMPLETED' }
    ];

    inboundLoans.forEach((loan, i) => {
      const fromFacility = facilities[Math.floor(Math.random() * facilities.length)];
      const toFacility = 'Main Hospital'; // Always to Main Hospital for inbound
      results.push({
        id: `inbound-loan-${i + 1}`,
        transferNumber: `IFT-2024-IN${String(i + 1).padStart(3, '0')}`,
        type: 'INCOMING',
        transferCategory: loan.category,
        fromFacility: fromFacility,
        toFacility: toFacility,
        requestedBy: staff[Math.floor(Math.random() * staff.length)],
        requestedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: loan.status,
        items: generateMockItems(3 + Math.floor(Math.random() * 4)),
        notes: 'Inbound loan request',
        expectedReturnDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });

    // Add specific outbound loans for testing - varied statuses for Outgoing tab
    const outboundLoans = [
      { status: 'ISSUED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PENDING' },
      { status: 'APPROVED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PENDING' },
      { status: 'ISSUED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'COMPLETED' },
      { status: 'APPROVED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'COMPLETED' },
      { status: 'ISSUED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PENDING' },
      { status: 'APPROVED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'COMPLETED' },
      { status: 'ISSUED' as InterFacilityRequest['status'], category: 'LOAN' as InterFacilityRequest['transferCategory'], paymentStatus: 'PENDING' }
    ];

    outboundLoans.forEach((loan, i) => {
      const fromFacility = 'Main Hospital'; // Always from Main Hospital for outbound
      const toFacility = facilities.filter(f => f !== fromFacility)[Math.floor(Math.random() * (facilities.length - 1))];
      results.push({
        id: `outbound-loan-${i + 1}`,
        transferNumber: `IFT-2024-OUT${String(i + 1).padStart(3, '0')}`,
        type: 'OUTGOING',
        transferCategory: loan.category,
        fromFacility: fromFacility,
        toFacility: toFacility,
        requestedBy: staff[Math.floor(Math.random() * staff.length)],
        requestedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: loan.status,
        items: generateMockItems(3 + Math.floor(Math.random() * 4)),
        notes: 'Outbound loan request',
        expectedReturnDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });

    // Fill up to 12 with mixed statuses
    const remaining = Math.max(0, 20 - results.length);
    for (let j = 0; j < remaining; j++) {
      const isOutgoing = j % 2 === 0;
      const fromFacility = facilities[Math.floor(Math.random() * facilities.length)];
      const toFacility = facilities.filter(f => f !== fromFacility)[Math.floor(Math.random() * (facilities.length - 1))];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      results.push({
        id: `transfer-${String(results.length + 1).padStart(3, '0')}`,
        transferNumber: `IFT-2024-${String(results.length + 1).padStart(3, '0')}`,
        type: isOutgoing ? 'OUTGOING' : 'INCOMING',
        transferCategory: category,
        fromFacility: isOutgoing ? fromFacility : toFacility,
        toFacility: isOutgoing ? toFacility : fromFacility,
        requestedBy: staff[Math.floor(Math.random() * staff.length)],
        requestedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status,
        items: generateMockItems(Math.floor(Math.random() * 3) + 1),
        notes: Math.random() < 0.3 ? 'Urgent transfer required for patient care' : undefined,
        approvedBy: status === 'APPROVED' ? 'Head Pharmacist' : undefined,
        approvedAt: status === 'APPROVED' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        expectedReturnDate: category === 'LOAN' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        rejectionReason: status === 'REJECTED' ? 'Insufficient stock at source facility.' : undefined,
      });
    }

    return results;
  };

  const generateMockItems = (count?: number): TransferItem[] => {
    const items = [
      { name: 'Paracetamol 500mg', code: 'PAR-500', category: 'DRUG' as const, unit: 'tablets' },
      { name: 'Ibuprofen 400mg', code: 'IBU-400', category: 'DRUG' as const, unit: 'tablets' },
      { name: 'Gauze Pad 4x4', code: 'GAU-4X4', category: 'NON_DRUG' as const, unit: 'pads' },
      { name: 'Insulin Syringe 1ml', code: 'INS-1ML', category: 'NON_DRUG' as const, unit: 'units' },
      { name: 'Amoxicillin 250mg', code: 'AMX-250', category: 'DRUG' as const, unit: 'capsules' },
    ];
    
    const numItems = count ?? (Math.floor(Math.random() * 3) + 1);
    return Array.from({ length: numItems }, (_, i) => {
      const item = items[Math.floor(Math.random() * items.length)];
      const quantity = Math.floor(Math.random() * 50) + 10;
      
      return {
        id: `item-${i + 1}`,
        itemName: item.name,
        drugCode: item.code,
        category: item.category,
        quantity: quantity,
        unit: item.unit,
        batchNumber: `B2024${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        condition: Math.random() < 0.9 ? 'GOOD' : Math.random() < 0.5 ? 'DAMAGED' : 'EXPIRED',
        notes: Math.random() < 0.2 ? 'Handle with care' : undefined,
      };
    });
  };

  const filteredRequests = transferRequests.filter(request => {
    const matchesSearch = request.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.fromFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Overview tab shows only completed requests, unless navigating via specific KPI view
    const statusAllowed = activeTab === 'overview' && !activeView
      ? (request.status === 'APPROVED' || request.status === 'REJECTED')
      : true;
    // If user applies a specific status filter on other tabs
    const matchesStatus = statusFilter === 'ALL' ? true : request.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || request.transferCategory === typeFilter;
    const matchesDirection = directionFilter === 'ALL' || request.type === directionFilter;
    const matchesItemType = itemTypeFilter === 'ALL' || 
      (itemTypeFilter === 'DRUG' && request.items.some(item => item.category === 'DRUG')) ||
      (itemTypeFilter === 'NON_DRUG' && request.items.every(item => item.category === 'NON_DRUG'));
    
    return matchesSearch && statusAllowed && matchesStatus && matchesType && matchesDirection && matchesItemType;
  });

  const updateStatus = (id: string, status: InterFacilityRequest['status']) => {
    setTransferRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleReturnQuantityChange = (itemId: string, quantity: number, maxQuantity?: number) => {
    // Ensure return quantity never exceeds issued quantity
    const validQuantity = Math.max(0, Math.min(quantity, maxQuantity || quantity));
    setTempReturnQuantities(prev => ({
      ...prev,
      [itemId]: validQuantity
    }));
  };

  const processReturn = () => {
    if (!detailModal.request) return;
    
    const request = detailModal.request;
    
    // Store the processed return quantities for this request from temp quantities
    const requestReturns: { [itemId: string]: number } = {};
    request.items.forEach(item => {
      requestReturns[item.id] = tempReturnQuantities[item.id] || 0;
    });
    
    setProcessedReturns(prev => ({
      ...prev,
      [request.id]: requestReturns
    }));
    
    const hasPartialReturns = request.items.some(item => {
      const returnedQty = tempReturnQuantities[item.id] || 0;
      return returnedQty > 0 && returnedQty < item.quantity;
    });
    
    const hasFullReturns = request.items.every(item => {
      const returnedQty = tempReturnQuantities[item.id] || 0;
      return returnedQty === item.quantity;
    });
    
    let newStatus: 'RETURNED' | 'PARTIALLY_RETURNED';
    if (hasFullReturns) {
      newStatus = 'RETURNED';
    } else {
      newStatus = 'PARTIALLY_RETURNED';
    }
    
    setTransferRequests(prev => 
      prev.map(req => 
        req.id === request.id ? { 
          ...req, 
          status: newStatus,
          actualReturnDate: new Date().toISOString()
        } : req
      )
    );
    
    setDetailModal({ isOpen: false, request: null });
    setTempReturnQuantities({});
  };

  const saveReviewedRequest = (updated: InterFacilityRequest) => {
    setTransferRequests(prev => prev.map(r => r.id === updated.id ? { ...updated } : r));
  };

  const advanceStatus = (request: InterFacilityRequest) => {
    switch (request.status) {
      case 'DRAFT':
        updateStatus(request.id, 'PENDING_REVIEW');
        break;
      case 'PENDING_REVIEW':
        updateStatus(request.id, 'PENDING_APPROVAL');
        break;
      case 'PENDING_APPROVAL':
        updateStatus(request.id, 'APPROVED');
        break;
      case 'APPROVED':
        updateStatus(request.id, 'ISSUED');
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status: InterFacilityRequest['status']) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
      PENDING_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
      PENDING_APPROVAL: 'bg-blue-100 text-blue-700 border-blue-200',
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
      APPROVED: 'bg-blue-100 text-blue-700 border-blue-200',
      ISSUED: 'bg-green-100 text-green-700 border-green-200',
      IN_TRANSIT: 'bg-purple-100 text-purple-700 border-purple-200',
      RECEIVED: 'bg-green-100 text-green-700 border-green-200',
      REJECTED: 'bg-red-100 text-red-700 border-red-200',
      RETURNED: 'bg-slate-100 text-slate-700 border-slate-200',
      PARTIALLY_RETURNED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Function to calculate return status based on actual return quantities
  const calculateReturnStatus = (request: InterFacilityRequest): 'COMPLETED' | 'PARTIALLY_RETURNED' | 'PENDING' => {
    if (request.transferCategory !== 'LOAN' || (request.status !== 'APPROVED' && request.status !== 'ISSUED')) {
      return 'PENDING'; // Not a loan or not ready for returns
    }

    const totalItems = request.items.length;
    let fullyReturnedItems = 0;
    let partiallyReturnedItems = 0;
    let notReturnedItems = 0;

    request.items.forEach(item => {
      const returnedQty = returnQuantities[item.id] || 0;
      
      if (returnedQty === 0) {
        notReturnedItems++;
      } else if (returnedQty === item.quantity) {
        fullyReturnedItems++;
      } else {
        partiallyReturnedItems++;
      }
    });

    // Apply the correct logic
    if (fullyReturnedItems === totalItems) {
      return 'COMPLETED'; // ALL items fully returned
    } else if (fullyReturnedItems > 0 || partiallyReturnedItems > 0) {
      return 'PARTIALLY_RETURNED'; // SOME items returned (fully or partially)
    } else {
      return 'PENDING'; // NO items returned
    }
  };

  const getTypeIcon = (type: InterFacilityRequest['type']) => {
    return type === 'OUTGOING' ? <IconArrowRight className="h-4 w-4" /> : <IconArrowLeft className="h-4 w-4" />;
  };

  const getCategoryColor = (category: InterFacilityRequest['transferCategory']) => {
    return category === 'STOCK' ? 'text-blue-600' : 'text-orange-600';
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/40" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Inter-Facility Management</h1>
            <p className="text-slate-600 text-sm">Comprehensive management of drug and non-drug transfers between facilities</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/borrowing/transfer"
              className="px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-semibold flex items-center gap-2"
            >
              <IconPlus className="h-4 w-4" />
              New Transfer
            </Link>
            <Link
              href="/borrowing/receive"
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
            >
              <IconPackage className="h-4 w-4" />
              Receive Items
            </Link>
          </div>
      </div>

        {/* KPI Summary: Review/Approval/Issue */}
        {(() => {
          const pendingReview = transferRequests.filter(r => r.status === 'PENDING_REVIEW').length;
          const pendingApproval = transferRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
          const readyToIssue = transferRequests.filter(r => r.status === 'APPROVED').length;
          const issued = transferRequests.filter(r => r.status === 'ISSUED').length;

          const card = (label: string, value: number, gradient: string, onClick: () => void) => (
            <button onClick={onClick} className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] w-full text-left overflow-hidden">
              <div className="absolute top-3 right-3 z-10">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              <div className="p-4">
                <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">{label}</p>
                  <p className="text-3xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{value}</p>
                  <p className="text-xs text-slate-500">Open queue</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50/0 to-slate-50/0 group-hover:from-slate-50/50 group-hover:to-slate-50/30 transition-all duration-200 pointer-events-none"></div>
            </button>
          );

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {card('Pending Review', pendingReview, 'bg-gradient-to-br from-blue-500 to-cyan-600', () => setKpiModal({ isOpen: true, status: 'PENDING_REVIEW' }))}
              {card('Pending Approval', pendingApproval, 'bg-gradient-to-br from-indigo-500 to-purple-600', () => setKpiModal({ isOpen: true, status: 'PENDING_APPROVAL' }))}
              {card('Ready to Issue', readyToIssue, 'bg-gradient-to-br from-green-500 to-emerald-600', () => setKpiModal({ isOpen: true, status: 'APPROVED' }))}
              {card('Issued', issued, 'bg-gradient-to-br from-slate-600 to-gray-700', () => setKpiModal({ isOpen: true, status: 'ISSUED' }))}
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="sticky top-0 z-10">
          <div className="inline-flex rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: <IconEye className="h-4 w-4" /> },
                { id: 'outgoing', label: 'Outgoing', icon: <IconArrowRight className="h-4 w-4" /> },
                { id: 'incoming', label: 'Incoming', icon: <IconArrowLeft className="h-4 w-4" /> },
                { id: 'drafts', label: 'Drafts', icon: <IconClipboardList className="h-4 w-4" /> },
                { id: 'tracking', label: 'All Track Order', icon: <IconClipboardList className="h-4 w-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-cyan-500 text-cyan-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-4">
          {/* Tab Content */}
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden">
            <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <IconSearch className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search transfers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="ALL">All Status</option>
                      <option value="ISSUED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="ALL">All Types</option>
                      <option value="STOCK">Stock</option>
                      <option value="LOAN">Loan</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={itemTypeFilter}
                      onChange={(e) => setItemTypeFilter(e.target.value as any)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="ALL">All Items</option>
                      <option value="DRUG">Drug</option>
                      <option value="NON_DRUG">Non-Drug</option>
                    </select>
                  </div>
                </div>

                {/* Transfer List */}
                <div className="space-y-3">
                  {filteredRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(request.type)}
                              <span className="font-semibold text-slate-800">{request.transferNumber}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(request.transferCategory)}`}>
                              {request.transferCategory}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">From:</span> {request.fromFacility}
                            </div>
                            <div>
                              <span className="font-medium">To:</span> {request.toFacility}
                            </div>
                            <div>
                              <span className="font-medium">Requested by:</span> {request.requestedBy}
            </div>
            <div>
                              <span className="font-medium">Items:</span> {request.items.length} items
            </div>
            <div>
                              <span className="font-medium">Date:</span> <span suppressHydrationWarning>{new Date(request.requestedAt).toLocaleDateString()}</span>
                            </div>
                            {request.expectedReturnDate && (
                              <div>
                                <span className="font-medium">Expected Return:</span> <span suppressHydrationWarning>{new Date(request.expectedReturnDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          
                          {request.notes && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                              <p className="text-sm text-slate-600"><span className="font-medium">Notes:</span> {request.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {request.status === 'DRAFT' && (
                            <button
                              onClick={() => advanceStatus(request)}
                              className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
                            >
                              Submit for Review
                            </button>
                          )}
                          {request.status === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => advanceStatus(request)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Send for Approval
                            </button>
                          )}
                          {request.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => advanceStatus(request)}
                                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateStatus(request.id, 'REJECTED')}
                                className="px-3 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {/* No actions for APPROVED or REJECTED on Inter-Facility list */}
                          <button
                            onClick={() => openDetailModal(request)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <IconEye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'outgoing' && (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">Outbound Loan Payments</h3>
                    <p className="text-slate-500 text-sm">Track payment status for loans provided to other facilities</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600">
                      {transferRequests.filter(r => r.transferCategory === 'LOAN' && r.type === 'OUTGOING' && (r.status === 'ISSUED' || r.status === 'APPROVED')).length} active loans
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <IconSearch className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search facilities, requesters..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 min-w-[250px]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending Return</option>
                    <option value="PARTIALLY_RETURNED">Partial Return</option>
                    <option value="COMPLETED">Return Complete</option>
                  </select>
                  <select
                    value={itemTypeFilter}
                    onChange={(e) => setItemTypeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="ALL">All Items</option>
                    <option value="DRUG">Drug</option>
                    <option value="NON_DRUG">Non-Drug</option>
                  </select>
                </div>

                {/* Request List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {transferRequests
                    .filter(r => r.transferCategory === 'LOAN' && r.type === 'OUTGOING' && (r.status === 'ISSUED' || r.status === 'APPROVED'))
                    .filter(r => {
                      // Calculate actual return status based on return quantities
                      const paymentStatus = calculateReturnStatus(r);
                      
                      if (statusFilter !== 'ALL' && paymentStatus !== statusFilter) return false;
                      if (searchTerm && !r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                          !r.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) &&
                          !r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                      // Apply item type filter
                      const matchesItemType = itemTypeFilter === 'ALL' || 
                        (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                        (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                      if (!matchesItemType) return false;
                      return true;
                    })
                    .length === 0 ? (
              <div className="text-center py-12">
                <IconArrowRight className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Outbound Loans</h3>
                      <p className="text-slate-500">No completed loans awaiting payment at the moment</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {transferRequests
                        .filter(r => r.transferCategory === 'LOAN' && r.type === 'OUTGOING' && (r.status === 'ISSUED' || r.status === 'APPROVED'))
                        .filter(r => {
                          // Calculate actual return status based on return quantities
                          const paymentStatus = calculateReturnStatus(r);
                          
                          if (statusFilter !== 'ALL' && paymentStatus !== statusFilter) return false;
                          if (searchTerm && !r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                              !r.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) &&
                              !r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                          // Apply item type filter
                          const matchesItemType = itemTypeFilter === 'ALL' || 
                            (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                            (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                          if (!matchesItemType) return false;
                          return true;
                        })
                        .map((request) => {
                          // Calculate actual return status based on return quantities
                          const paymentStatus = calculateReturnStatus(request);
                          return (
                            <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                                    <IconArrowRight className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-slate-900">{request.transferNumber}</h4>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        paymentStatus === 'PARTIALLY_RETURNED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {paymentStatus === 'COMPLETED' ? 'Return Complete' : 
                                         paymentStatus === 'PARTIALLY_RETURNED' ? 'Partial Return' :
                                         'Pending Return'}
                                      </span>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                                        OUTBOUND LOAN
                                      </span>
                                    </div>
                                    <div className="text-sm text-slate-600 mb-1">
                                      Loaned to: <span className="font-medium">{request.toFacility}</span>
                                    </div>
                                    <div className="text-sm text-slate-600 mb-1">
                                      Requested by: <span className="font-medium">{request.requestedBy}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {request.items.length} items • <span suppressHydrationWarning>{new Date(request.requestedAt).toLocaleDateString()}</span> • {request.priority} priority
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openDetailModal(request)}
                                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <IconEye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openDetailModal(request)}
                                    className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                      paymentStatus === 'COMPLETED' 
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : paymentStatus === 'PARTIALLY_RETURNED'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-pink-600 text-white hover:bg-pink-700'
                                    }`}
                                  >
                                    {paymentStatus === 'COMPLETED' ? 'Return Complete' : 
                                     paymentStatus === 'PARTIALLY_RETURNED' ? 'Partial Return' :
                                     'Awaiting Return'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'incoming' && (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Inbound Loan Payments</h3>
                    <p className="text-slate-500">Track payment status for loans we borrowed from other facilities</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600">
                      {transferRequests.filter(r => r.transferCategory === 'LOAN' && r.type === 'INCOMING' && (r.status === 'APPROVED' || r.status === 'ISSUED')).length} active loans
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <IconSearch className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search facilities, requesters..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 min-w-[250px]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending Payment</option>
                    <option value="PARTIALLY_RETURNED">Partially Returned</option>
                    <option value="COMPLETED">Payment Complete</option>
                  </select>
                  <select
                    value={itemTypeFilter}
                    onChange={(e) => setItemTypeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="ALL">All Items</option>
                    <option value="DRUG">Drug</option>
                    <option value="NON_DRUG">Non-Drug</option>
                  </select>
                </div>

                {/* Request List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {transferRequests
                    .filter(r => r.transferCategory === 'LOAN' && r.type === 'INCOMING' && (r.status === 'APPROVED' || r.status === 'ISSUED'))
                    .filter(r => {
                      // Calculate actual return status based on return quantities
                      const paymentStatus = calculateReturnStatus(r);
                      
                      if (statusFilter !== 'ALL' && paymentStatus !== statusFilter) return false;
                      if (searchTerm && !r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                          !r.fromFacility.toLowerCase().includes(searchTerm.toLowerCase()) &&
                          !r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                      // Apply item type filter
                      const matchesItemType = itemTypeFilter === 'ALL' || 
                        (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                        (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                      if (!matchesItemType) return false;
                      return true;
                    })
                    .length === 0 ? (
              <div className="text-center py-12">
                <IconArrowLeft className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Inbound Loans</h3>
                      <p className="text-slate-500">No completed loans awaiting payment at the moment</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {transferRequests
                        .filter(r => r.transferCategory === 'LOAN' && r.type === 'INCOMING' && (r.status === 'APPROVED' || r.status === 'ISSUED'))
                        .filter(r => {
                          // Calculate payment status based on PROCESSED returns, not just input quantities
                          // Calculate actual return status based on return quantities
                          const paymentStatus = calculateReturnStatus(r);
                          
                          if (statusFilter !== 'ALL' && paymentStatus !== statusFilter) return false;
                          if (searchTerm && !r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                              !r.fromFacility.toLowerCase().includes(searchTerm.toLowerCase()) &&
                              !r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                          // Apply item type filter
                          const matchesItemType = itemTypeFilter === 'ALL' || 
                            (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                            (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                          if (!matchesItemType) return false;
                          return true;
                        })
                        .map((request) => {
                          // Calculate actual return status based on return quantities
                          const paymentStatus = calculateReturnStatus(request);
                          return (
                            <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
                                    <IconArrowLeft className="h-6 w-6" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-slate-900">{request.transferNumber}</h4>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        paymentStatus === 'PARTIALLY_RETURNED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {paymentStatus === 'COMPLETED' ? 'Payment Complete' : 
                                         paymentStatus === 'PARTIALLY_RETURNED' ? 'Partially Returned' :
                                         'Pending Payment'}
                                      </span>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                        INBOUND LOAN
                                      </span>
                                    </div>
                                    <div className="text-sm text-slate-600 mb-1">
                                      Borrowed from: <span className="font-medium">{request.fromFacility}</span>
                                    </div>
                                    <div className="text-sm text-slate-600 mb-1">
                                      Requested by: <span className="font-medium">{request.requestedBy}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {request.items.length} items • <span suppressHydrationWarning>{new Date(request.requestedAt).toLocaleDateString()}</span> • {request.priority} priority
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openDetailModal(request)}
                                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <IconEye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openDetailModal(request)}
                                    className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                      paymentStatus === 'COMPLETED' 
                                        ? 'bg-green-600 text-white hover:bg-green-700' 
                                        : paymentStatus === 'PARTIALLY_RETURNED'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-orange-600 text-white hover:bg-orange-700'
                                    }`}
                                  >
                                    {paymentStatus === 'COMPLETED' ? 'Payment Complete' : 
                                     paymentStatus === 'PARTIALLY_RETURNED' ? 'Partial Return' :
                                     'Pay Back'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'drafts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700">Draft Transfers</h3>
                    <p className="text-slate-500">Manage incomplete transfer and receive requests</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                      <IconPlus className="h-4 w-4 inline mr-2" />
                      New Draft
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <IconSearch className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search transfers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 min-w-[250px]"
                    />
                  </div>
                  <select
                    value={itemTypeFilter}
                    onChange={(e) => setItemTypeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="ALL">All Items</option>
                    <option value="DRUG">Drug</option>
                    <option value="NON_DRUG">Non-Drug</option>
                  </select>
                </div>

                {/* Draft List */}
                <div className="space-y-3">
                  {transferRequests.filter(r => {
                    if (r.status !== 'DRAFT') return false;
                    
                    // Apply search filter
                    const matchesSearch = !searchTerm || 
                      r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.fromFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    // Apply item type filter
                    const matchesItemType = itemTypeFilter === 'ALL' || 
                      (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                      (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                    
                    return matchesSearch && matchesItemType;
                  }).length === 0 ? (
                    <div className="text-center py-12">
                      <IconClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Draft Transfers</h3>
                      <p className="text-slate-500">Create a new transfer or receive request to get started</p>
                    </div>
                  ) : (
                    transferRequests
                      .filter(r => {
                        if (r.status !== 'DRAFT') return false;
                        
                        // Apply search filter
                        const matchesSearch = !searchTerm || 
                          r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.fromFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
                        
                        // Apply item type filter
                        const matchesItemType = itemTypeFilter === 'ALL' || 
                          (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                          (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                        
                        return matchesSearch && matchesItemType;
                      })
                      .map((request) => (
                        <div key={request.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                                  DRAFT
                                </span>
                                <span className="text-sm font-medium text-slate-600">
                                  {request.transferNumber}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.type === 'OUTGOING' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {request.type === 'OUTGOING' ? 'Transfer' : 'Receive'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.transferCategory === 'STOCK' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {request.transferCategory}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                                <div>
                                  <span className="font-medium">From:</span> {request.fromFacility}
                                </div>
                                <div>
                                  <span className="font-medium">To:</span> {request.toFacility}
                                </div>
                                <div>
                                  <span className="font-medium">Requested by:</span> {request.requestedBy}
                                </div>
                                <div>
                                  <span className="font-medium">Items:</span> {request.items.length} items
            </div>
            <div>
                                  <span className="font-medium">Created:</span> <span suppressHydrationWarning>{new Date(request.requestedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                Continue
                              </button>
                              <button className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm">
                                Submit
                              </button>
                              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <IconX className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'tracking' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700">All Track Order</h3>
                    <p className="text-slate-500">Monitor all transfer orders and progress</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <IconSearch className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search transfers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 min-w-[250px]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending Receipt</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="RECEIVED">Received</option>
                  </select>
                  <select
                    value={itemTypeFilter}
                    onChange={(e) => setItemTypeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="ALL">All Items</option>
                    <option value="DRUG">Drug</option>
                    <option value="NON_DRUG">Non-Drug</option>
                  </select>
                </div>

                {/* Tracking Content */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {transferRequests
                    .filter(r => r.transferCategory === 'STOCK' || (r.transferCategory === 'LOAN' && r.status === 'ISSUED'))
                    .filter(r => {
                      if (statusFilter !== 'ALL') {
                        let transferStatus = 'PENDING';
                        if (r.status === 'RECEIVED') {
                          transferStatus = 'RECEIVED';
                        } else if (r.status === 'IN_TRANSIT') {
                          transferStatus = 'IN_TRANSIT';
                        } else if (r.status === 'ISSUED') {
                          transferStatus = 'PENDING';
                        }
                        if (transferStatus !== statusFilter) return false;
                      }
                      if (searchTerm && !r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                          !r.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) &&
                          !r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                      // Apply item type filter
                      const matchesItemType = itemTypeFilter === 'ALL' || 
                        (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                        (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                      if (!matchesItemType) return false;
                      return true;
                    })
                    .length === 0 ? (
              <div className="text-center py-12">
                <IconClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Transfers Found</h3>
                        <p className="text-slate-500">No transfers match your current filters</p>
              </div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {transferRequests
                          .filter(r => r.transferCategory === 'STOCK' || (r.transferCategory === 'LOAN' && r.status === 'ISSUED'))
                          .filter(r => {
                            if (statusFilter !== 'ALL') {
                              let transferStatus = 'PENDING';
                              if (r.status === 'RECEIVED') {
                                transferStatus = 'RECEIVED';
                              } else if (r.status === 'IN_TRANSIT') {
                                transferStatus = 'IN_TRANSIT';
                              } else if (r.status === 'ISSUED') {
                                transferStatus = 'PENDING';
                              }
                              if (transferStatus !== statusFilter) return false;
                            }
                            if (searchTerm && !r.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
                                !r.toFacility.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                !r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                            // Apply item type filter
                            const matchesItemType = itemTypeFilter === 'ALL' || 
                              (itemTypeFilter === 'DRUG' && r.items.some(item => item.category === 'DRUG')) ||
                              (itemTypeFilter === 'NON_DRUG' && r.items.every(item => item.category === 'NON_DRUG'));
                            if (!matchesItemType) return false;
                            return true;
                          })
                          .slice(0, 5)
                          .map((request) => {
                            let transferStatus = 'PENDING';
                            let statusColor = 'bg-amber-100 text-amber-700';
                            let statusText = 'Pending Receipt';
                            
                            if (request.status === 'RECEIVED') {
                              transferStatus = 'RECEIVED';
                              statusColor = 'bg-green-100 text-green-700';
                              statusText = 'Received';
                            } else if (request.status === 'IN_TRANSIT') {
                              transferStatus = 'IN_TRANSIT';
                              statusColor = 'bg-blue-100 text-blue-700';
                              statusText = 'In Transit';
                            }

                            return (
                              <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                                      request.type === 'OUTGOING' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'
                                    }`}>
                                      {getTypeIcon(request.type)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-semibold text-slate-900">{request.transferNumber}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                          {statusText}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                          request.transferCategory === 'LOAN' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                          {request.transferCategory === 'LOAN' ? 'LOAN' : 'STOCK TRANSFER'}
                                        </span>
                                      </div>
                                      <div className="text-sm text-slate-600">
                                        {request.type === 'OUTGOING' ? (
                                          <>Transferred to: <span className="font-medium">{request.toFacility}</span></>
                                        ) : (
                                          <>Transferred from: <span className="font-medium">{request.fromFacility}</span></>
                                        )}
                                      </div>
                                      <div className="text-sm text-slate-500">
                                        Requested by: <span className="font-medium">{request.requestedBy}</span> • {request.items.length} items • {new Date(request.requestedAt).toLocaleDateString()} • priority
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => openDetailModal(request)}
                                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                      title="View Details"
                                    >
                                      <IconEye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => openDetailModal(request)}
                                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                        transferStatus === 'RECEIVED'
                                          ? 'bg-green-600 text-white hover:bg-green-700'
                                          : transferStatus === 'IN_TRANSIT'
                                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                                          : 'bg-amber-600 text-white hover:bg-amber-700'
                                      }`}
                                    >
                                      {'Track Order'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                </div>
              </div>
            )}
            </div>
        </div>
        {/* Details Modal */}
        {detailModal.isOpen && detailModal.request && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" suppressHydrationWarning>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-auto overflow-hidden border border-gray-300" suppressHydrationWarning>
              {/* Professional Header */}
              <div className="bg-gray-50 border-b border-gray-300 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-700 rounded-md flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                <div>
                      <h3 className="text-xl font-semibold text-gray-900" suppressHydrationWarning>{detailModal.request.transferNumber}</h3>
                      <p className="text-sm text-gray-600 mt-1" suppressHydrationWarning>{detailModal.request.fromFacility} → {detailModal.request.toFacility}</p>
                </div>
              </div>
                  <button 
                    onClick={closeDetailModal} 
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  </div>
                  </div>
              <div className="p-4 space-y-4">
                {/* Professional Overview Table */}
                <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-300 px-4 py-3">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Request Details</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    <div className="grid grid-cols-4 divide-x divide-gray-200">
                      <div className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</div>
                        <div className="text-sm font-semibold text-gray-900 mt-1" suppressHydrationWarning>{detailModal.request.transferCategory}</div>
                        <div className="text-xs text-gray-600" suppressHydrationWarning>({detailModal.request.type})</div>
                  </div>
                      <div className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested By</div>
                        <div className="text-sm font-semibold text-gray-900 mt-1" suppressHydrationWarning>{detailModal.request.requestedBy}</div>
                </div>
                      <div className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested At</div>
                        <div className="text-sm font-semibold text-gray-900 mt-1" suppressHydrationWarning>{new Date(detailModal.request.requestedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
                        <div className="text-sm font-semibold text-gray-900 mt-1" suppressHydrationWarning>{detailModal.request.status.replace('_', ' ')}</div>
                  </div>
                </div>
                  </div>
                </div>
                {/* Professional Items Section */}
                <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-300 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Items ({detailModal.request.items.length})</h4>
                      {detailModal.request.transferCategory === 'LOAN' && (detailModal.request.status === 'ISSUED' || detailModal.request.status === 'APPROVED') && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit quantities for return tracking
                  </div>
                )}
                  </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Packaging</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Batch/Exp</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Issued</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Usage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Return</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailModal.request.items
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((item, index) => {
                          // Generate consistent mock data based on item ID to avoid hydration issues
                          const seed = item.id.charCodeAt(0) + item.id.length + index;
                          const mockBalance = Math.floor((seed * 7) % 5000) + 1000;
                          const mockBatch = `B${Math.floor((seed * 13) % 9000) + 1000}`;
                          const mockExpiry = new Date();
                          mockExpiry.setFullYear(mockExpiry.getFullYear() + Math.floor((seed * 5) % 3) + 1);
                          mockExpiry.setMonth(mockExpiry.getMonth() + Math.floor((seed * 11) % 12));
                          const mockAvgUsage = Math.floor((seed * 3) % 500) + 100;
                          const packSizes = [10, 20, 30, 50, 100, 250, 500, 1000];
                          const packSize = packSizes[Math.floor((seed * 17) % packSizes.length)];
                          
                          // Format unit for packaging display
                          const getPackUnit = (unit: string) => {
                            if (unit === 'tablets') return 'tab';
                            if (unit === 'vials') return 'vial';
                            if (unit === 'ampoules' || unit === 'amps') return 'amp';
                            if (unit === 'capsules') return 'cap';
                            if (unit === 'injections') return 'inj';
                            if (unit === 'units') return 'unit';
                            if (unit === 'pairs') return 'pair';
                            if (unit === 'pads') return 'pad';
                            return unit;
                          };

                          const isLoan = detailModal.request?.transferCategory === 'LOAN';
                          const canEditReturn = isLoan && (detailModal.request?.status === 'ISSUED' || detailModal.request?.status === 'APPROVED');
                          const returnedQty = canEditReturn ? (tempReturnQuantities[item.id] || 0) : 0;
                          
                          // Check if this item has been processed as returned
                          const processedReturnData = processedReturns[detailModal.request?.id || ''];
                          const processedQty = processedReturnData?.[item.id] || 0;
                          const currentReturnQty = tempReturnQuantities[item.id] || 0;
                          const isPartiallyReturned = currentReturnQty > 0 && currentReturnQty < item.quantity;
                          const isFullyReturned = currentReturnQty === item.quantity && currentReturnQty > 0;
                          
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className={`h-2 w-2 rounded-full mr-3 ${
                                    item.category === 'DRUG' ? 'bg-blue-500' : 'bg-green-500'
                                  }`}></div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-500">{item.drugCode}</span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{item.category}</span>
                                    </div>
                                    {(isPartiallyReturned || isFullyReturned) && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                        isFullyReturned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {isFullyReturned ? '✓ Fully Returned' : '⚠ Partially Returned'}
                                      </span>
                )}
              </div>
              </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900" suppressHydrationWarning>
                                pack of {packSize} {getPackUnit(item.unit)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div suppressHydrationWarning>{mockBatch}</div>
                                <div className="text-xs text-gray-500" suppressHydrationWarning>{mockExpiry.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' })}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div suppressHydrationWarning>{mockBalance.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">{item.unit}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div>{item.quantity}</div>
                                <div className="text-xs text-gray-500">{item.unit}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div suppressHydrationWarning>{mockAvgUsage.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">/month</div>
                              </td>
                              <td className="px-4 py-3">
                                {canEditReturn ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={tempReturnQuantities[item.id] || 0}
                                        onChange={(e) => handleReturnQuantityChange(item.id, parseInt(e.target.value) || 0, item.quantity)}
                                        className={`w-16 px-2 py-1 border rounded text-center text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                          currentReturnQty === item.quantity && currentReturnQty > 0
                                            ? 'border-green-500 bg-green-50' 
                                            : currentReturnQty > 0
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300'
                                        }`}
                                        min="0"
                                        max={item.quantity}
                                        placeholder="0"
                                      />
                                      <span className="text-sm text-gray-600">/ {item.quantity}</span>
                                      {currentReturnQty === item.quantity && currentReturnQty > 0 && (
                                        <span className="text-green-600 text-lg">✓</span>
                                      )}
                                    </div>
                                    <div className={`text-xs ${
                                      currentReturnQty === item.quantity && currentReturnQty > 0
                                        ? 'text-green-600 font-medium' 
                                        : currentReturnQty > 0
                                        ? 'text-blue-600'
                                        : 'text-gray-500'
                                    }`}>
                                      {currentReturnQty === 0 ? 'Not returned' : 
                                       currentReturnQty === item.quantity && currentReturnQty > 0 ? '✓ Fully returned' : 
                                       currentReturnQty === item.quantity ? 'Ready to process' :
                                       `${currentReturnQty} of ${item.quantity} returned`}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-900">
                                    <div className={`flex items-center gap-2 font-medium ${
                                      currentReturnQty === item.quantity && currentReturnQty > 0
                                        ? 'text-green-600' 
                                        : currentReturnQty > 0
                                        ? 'text-blue-600'
                                        : 'text-gray-900'
                                    }`}>
                                      {currentReturnQty}/{item.quantity}
                                      {currentReturnQty === item.quantity && currentReturnQty > 0 && (
                                        <span className="text-green-600 text-lg">✓</span>
                                      )}
                                    </div>
                                    <div className={`text-xs ${
                                      currentReturnQty === item.quantity && currentReturnQty > 0
                                        ? 'text-green-600 font-medium' 
                                        : currentReturnQty > 0
                                        ? 'text-blue-600'
                                        : 'text-gray-500'
                                    }`}>
                                      {!canEditReturn ? 'Loan not approved' :
                                       currentReturnQty === 0 ? 'Not returned' : 
                                       currentReturnQty === item.quantity && currentReturnQty > 0 ? '✓ Fully returned' : 
                                       currentReturnQty === item.quantity ? 'Ready to process' :
                                       `${currentReturnQty} of ${item.quantity} returned`}
            </div>
          </div>
        )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
              </div>
                </div>
                
                {/* Compact Footer Section */}
                <div className="bg-white border-t border-gray-200">
                  <div className="flex items-center justify-between px-4 py-2">
                    {/* Left: Order Receive + Rating Options */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowRatingOptions(!showRatingOptions)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6l3-3 3 3V1" />
                        </svg>
                        Order Receive
                      </button>
                      
                      {/* Rating Notification Options */}
                      {showRatingOptions && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              alert('Email notification sent to customer for service rating!');
                              setShowRatingOptions(false);
                            }}
                            className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded hover:bg-blue-100 border border-blue-200 transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            Email
                          </button>
                          <button
                            onClick={() => {
                              alert('WhatsApp notification sent to customer for service rating!');
                              setShowRatingOptions(false);
                            }}
                            className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded hover:bg-green-100 border border-green-200 transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Pagination */}
                    {(detailModal.request?.items.length || 0) > itemsPerPage && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, detailModal.request?.items.length || 0)}-{Math.min(currentPage * itemsPerPage, detailModal.request?.items.length || 0)} of {detailModal.request?.items.length || 0}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ‹
                        </button>
                        <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded">
                          {currentPage}/{Math.ceil((detailModal.request?.items.length || 0) / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(Math.ceil((detailModal.request?.items.length || 0) / itemsPerPage), currentPage + 1))}
                          disabled={currentPage >= Math.ceil((detailModal.request?.items.length || 0) / itemsPerPage)}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes Section */}
                {(detailModal.request.status === 'REJECTED' && detailModal.request.rejectionReason) || detailModal.request.notes ? (
                  <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-300 px-4 py-3">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Additional Information</h4>
                    </div>
                    <div className="p-4 space-y-4">
                      {detailModal.request.status === 'REJECTED' && detailModal.request.rejectionReason && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Rejection Reason</div>
                          <p className="text-sm text-gray-900 bg-red-50 border border-red-200 rounded-md p-3">{detailModal.request.rejectionReason}</p>
                          </div>
                      )}
                      {detailModal.request.notes && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notes</div>
                          <p className="text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md p-3">{detailModal.request.notes}</p>
                        </div>
                      )}
                        </div>
                      </div>
                ) : null}
                    </div>
              
              {/* Professional Footer */}
              <div className="bg-gray-50 border-t border-gray-300 px-6 py-4 flex justify-end gap-3">
                {detailModal.request.transferCategory === 'LOAN' && (detailModal.request.status === 'ISSUED' || detailModal.request.status === 'APPROVED') && 
                 Object.values(tempReturnQuantities).some(qty => qty > 0) && (
                  <button 
                    onClick={processReturn}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Process Return
                  </button>
                )}
                <button 
                  onClick={closeDetailModal} 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* KPI Queue Modal */}
        {kpiModal.isOpen && kpiModal.status && (
          <BorrowingReviewModal
            isOpen={kpiModal.isOpen}
            onClose={() => setKpiModal({ isOpen: false, status: null })}
            requests={transferRequests.filter(r => 
              r.status === 'PENDING_REVIEW' || 
              r.status === 'PENDING_APPROVAL' || 
              r.status === 'APPROVED' || 
              r.status === 'ISSUED' || 
              r.status === 'REJECTED'
            ) as any}
            status={kpiModal.status}
            onUpdateRequest={(requestId, updates) => updateStatus(requestId, updates.status!)}
          />
        )}
        {/* Inter-Facility Review Modal */}
        {reviewModalIF.isOpen && reviewModalIF.draft && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-full max-w-5xl mx-4 overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl">
              <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-indigo-50 border-b border-white/60 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Review Request – {reviewModalIF.draft.transferNumber}</h3>
                <button onClick={() => setReviewModalIF({ isOpen: false, draft: null, rejectReason: '' })} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white/70 rounded-xl">✕</button>
              </div>
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div><span className="font-medium">From:</span> {reviewModalIF.draft.fromFacility}</div>
                  <div><span className="font-medium">To:</span> {reviewModalIF.draft.toFacility}</div>
                  <div><span className="font-medium">Type:</span> {reviewModalIF.draft.transferCategory} ({reviewModalIF.draft.type})</div>
                  <div><span className="font-medium">Requested by:</span> {reviewModalIF.draft.requestedBy}</div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50/60 border-b text-sm font-semibold text-slate-700">Items ({reviewModalIF.draft.items.length})</div>
                  <div className="max-h-[50vh] overflow-auto divide-y">
                    {reviewModalIF.draft.items.map((it, idx) => (
                      <div key={it.id} className="px-4 py-3 text-sm grid grid-cols-12 gap-3 items-center bg-white/80">
                        <div className="col-span-5 font-medium text-slate-800">{it.itemName}</div>
                        <div className="col-span-2 text-slate-600">{it.drugCode}</div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min={0}
                            value={it.quantity}
                            onChange={(e) => {
                              const q = Math.max(0, parseInt(e.target.value || '0'));
                              setReviewModalIF((prev) => prev.draft ? { ...prev, draft: { ...prev.draft, items: prev.draft.items.map((x,i)=> i===idx ? { ...x, quantity: q } : x) } } : prev);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                        </div>
                        <div className="col-span-2 text-slate-600">{it.unit}</div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => setReviewModalIF((prev) => prev.draft ? { ...prev, draft: { ...prev.draft, items: prev.draft.items.filter((_,i)=> i!==idx) } } : prev)}
                            className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {reviewModalIF.draft.items.length === 0 && (
                      <div className="px-4 py-6 text-center text-slate-500">No items remaining.</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason (optional)</label>
                  <textarea value={reviewModalIF.rejectReason} onChange={(e)=> setReviewModalIF(prev=> ({ ...prev, rejectReason: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-300 focus:border-rose-300" rows={3} placeholder="Provide reason if rejecting..." />
                </div>
              </div>
              <div className="px-6 py-4 bg-white/70 border-t border-white/60 flex justify-between">
                <button
                  onClick={() => {
                    // Reject
                    if (reviewModalIF.draft) {
                      saveReviewedRequest({ ...reviewModalIF.draft, status: 'REJECTED', rejectionReason: reviewModalIF.rejectReason || 'Rejected during review' });
                      setKpiModal({ isOpen: true, status: 'PENDING_REVIEW' });
                    }
                    setReviewModalIF({ isOpen: false, draft: null, rejectReason: '' });
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 border border-rose-200"
                >
                  Reject
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setReviewModalIF({ isOpen: false, draft: null, rejectReason: '' })} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200">Cancel</button>
                  <button
                    onClick={() => {
                      if (reviewModalIF.draft) {
                        saveReviewedRequest({ ...reviewModalIF.draft, status: 'PENDING_APPROVAL' });
                        setKpiModal({ isOpen: true, status: 'PENDING_REVIEW' });
                      }
                      setReviewModalIF({ isOpen: false, draft: null, rejectReason: '' });
                    }}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 shadow-sm"
                  >
                    Send for Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}