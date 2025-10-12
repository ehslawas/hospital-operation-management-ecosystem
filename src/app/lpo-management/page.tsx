'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconPlus, IconSearch, IconFilter, IconEye, IconEdit, IconTrash, IconCheck, IconX, IconClock, IconTruck, IconMoney, IconCreditCard, IconReceipt, IconRefresh, IconDownload, IconUpload } from '@/components/ui/Icons';

interface LPO {
  id: string;
  lpoNumber: string; // This will be empty initially, filled after upload
  ePerolehanRef: string;
  supplier: string;
  supplierContact: string;
  createdDate: string;
  expectedDelivery: string;
  status: 'RELEASED' | 'PENDING' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  paymentType: 'APPL' | 'CC' | 'DP';
  items: LPOItem[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  ePerolehanStatus?: 'PENDING' | 'PROCESSING' | 'RELEASED' | 'ERROR';
  lastSyncDate?: string;
  category?: 'DRUG' | 'NON_DRUG' | 'VACCINE' | 'UNKNOWN';
  department?: string;
  needsReview?: boolean;
  uploadedFileName?: string; // New field to store uploaded file name
}

interface LPOItem {
  id: string;
  itemName: string;
  itemCode: string;
  category: 'DRUG' | 'NON_DRUG' | 'VACCINE';
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  specifications?: string;
}

export default function LPOOversightPage() {
  const [isClient, setIsClient] = useState(false);
  const [department, setDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [ePerolehanFilter, setEPerolehanFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [voteCodeFilter, setVoteCodeFilter] = useState('all');
  const [voteActivityFilter, setVoteActivityFilter] = useState('all');
  const [uploadingLPOId, setUploadingLPOId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [showCategorizeModal, setShowCategorizeModal] = useState(false);
  const [uncategorizedLPOs, setUncategorizedLPOs] = useState<LPO[]>([]);
  const [categorizationRules, setCategorizationRules] = useState({
    drugKeywords: ['paracetamol', 'ibuprofen', 'amoxicillin', 'medicine', 'drug', 'pharmaceutical'],
    nonDrugKeywords: ['syringe', 'bandage', 'equipment', 'supplies', 'medical', 'surgical'],
    vaccineKeywords: ['vaccine', 'immunization', 'injection', 'serum'],
    departmentKeywords: {
      'Emergency': ['emergency', 'urgent', 'critical'],
      'Pharmacy': ['pharmacy', 'dispensing', 'medication'],
      'Surgery': ['surgery', 'surgical', 'operation'],
      'Laboratory': ['lab', 'laboratory', 'test', 'diagnostic'],
      'Radiology': ['xray', 'radiology', 'imaging', 'scan']
    }
  });

  // Mock data for LPOs - converted to state for dynamic updates
  const [lpos, setLpos] = useState<LPO[]>(() => {
    const generateMockLPOs = (): LPO[] => {
      const suppliers = [
        'MedSupply Solutions Sdn Bhd',
        'PharmaCorp Malaysia',
        'MedTech Supplies',
        'Healthcare Plus Sdn Bhd',
        'Medical Equipment Co',
        'Pharmaceutical Distributors',
        'HealthCare Solutions',
        'MediCorp Malaysia',
        'BioMedical Supplies',
        'Advanced Medical Systems'
      ];
      
      const paymentTypes: ('APPL' | 'CC' | 'DP')[] = ['APPL', 'CC', 'DP'];
      const statuses: ('RELEASED' | 'PENDING' | 'CANCELLED')[] = ['RELEASED', 'PENDING', 'CANCELLED'];
      const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const categories: ('DRUG' | 'NON_DRUG' | 'VACCINE')[] = ['DRUG', 'NON_DRUG', 'VACCINE'];
      
      const mockLPOs: LPO[] = [];
      
      for (let i = 1; i <= 50; i++) {
        const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        
        mockLPOs.push({
          id: i.toString(),
          lpoNumber: status === 'RELEASED' ? `LPO-2024-${i.toString().padStart(3, '0')}` : '',
          ePerolehanRef: `EP-2024-${i.toString().padStart(3, '0')}`,
          supplier,
          supplierContact: `+60 3-${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
          createdDate: new Date(2024, 0, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
          expectedDelivery: new Date(2024, 0, Math.floor(Math.random() * 30) + 15).toISOString().split('T')[0],
          status,
          totalAmount: Math.floor(Math.random() * 50000) + 1000,
          currency: 'MYR',
          paymentType,
          priority,
          createdBy: `User ${i}`,
          ePerolehanStatus: status === 'RELEASED' ? 'RELEASED' : 'PENDING',
          lastSyncDate: new Date().toISOString(),
          uploadedFileName: status === 'RELEASED' ? `LPO-2024-${i.toString().padStart(3, '0')}.pdf` : undefined,
          items: [
            {
              id: `${i}-1`,
              itemName: `Item ${i}`,
              itemCode: `ITEM-${i.toString().padStart(3, '0')}`,
              category,
              quantity: Math.floor(Math.random() * 100) + 10,
              receivedQuantity: 0,
              unitPrice: Math.floor(Math.random() * 100) + 1,
              totalPrice: 0,
              unit: 'units'
            }
          ]
        });
      }
      
      return mockLPOs;
    };
    
    return generateMockLPOs();
  });

  const suppliers = ['all', ...Array.from(new Set(lpos.map(lpo => lpo.supplier)))];
  const statuses = ['all', 'RELEASED', 'PENDING', 'CANCELLED'];
  const ePerolehanStatuses = ['all', ...Array.from(new Set(lpos.map(lpo => lpo.ePerolehanStatus).filter(Boolean)))];
  const categories = ['all', 'DRUG', 'NON_DRUG', 'VACCINE', 'UNKNOWN'];
  const departments = ['all', 'Emergency', 'Pharmacy', 'Surgery', 'Laboratory', 'Radiology', 'GENERAL'];

  const filteredLPOs = lpos.filter(lpo => {
    const matchesSearch = lpo.lpoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lpo.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lpo.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lpo.ePerolehanRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lpo.status === statusFilter;
    
    // Vote Code filtering
    const lpoVoteCode = lpo.paymentType === 'APPL' ? '990102' : '080702';
    const matchesVoteCode = voteCodeFilter === 'all' || lpoVoteCode === voteCodeFilter;
    
    // Vote Activity filtering
    const lpoActivityCode = lpo.items.some(item => item.category === 'DRUG') ? '27401' : 
                           lpo.items.some(item => item.category === 'NON_DRUG') ? '27499' : 
                           lpo.items.some(item => item.category === 'VACCINE') ? '27404' : '27401';
    const matchesVoteActivity = voteActivityFilter === 'all' || lpoActivityCode === voteActivityFilter;

    return matchesSearch && matchesStatus && matchesVoteCode && matchesVoteActivity;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLPOs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLPOs = filteredLPOs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, voteCodeFilter, voteActivityFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RELEASED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RELEASED': return <IconTruck className="h-4 w-4" />;
      case 'PENDING': return <IconClock className="h-4 w-4" />;
      case 'CANCELLED': return <IconX className="h-4 w-4" />;
      default: return <IconClock className="h-4 w-4" />;
    }
  };

  const getEPerolehanStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'RELEASED': return 'bg-green-100 text-green-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'APPL': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CC': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DP': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentTypeIcon = (paymentType: string) => {
    switch (paymentType) {
      case 'APPL': return <IconMoney className="h-4 w-4" />;
      case 'CC': return <IconCreditCard className="h-4 w-4" />;
      case 'DP': return <IconReceipt className="h-4 w-4" />;
      default: return <IconMoney className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-600';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSyncEPerolehan = async () => {
    setIsSyncing(true);
    
    try {
      // Method 1: API Integration (if available)
      // const response = await fetch('/api/eperolehan/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action: 'sync_lpos' })
      // });
      
      // Method 2: File Upload Integration
      // const fileInput = document.createElement('input');
      // fileInput.type = 'file';
      // fileInput.accept = '.csv,.xlsx';
      // fileInput.onchange = (e) => {
      //   const file = e.target.files[0];
      //   processEPerolehanFile(file);
      // };
      // fileInput.click();
      
      // Method 3: Manual Data Entry
      // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      alert('LPOs synced successfully!');
      
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
    setIsSyncing(false);
    setShowSyncModal(false);
    }
  };

  const handleLPOUpload = async (lpoId: string, file: File) => {
    setUploadingLPOId(lpoId);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update the LPO with uploaded file name and change status to RELEASED
    setLpos(prevLpos => prevLpos.map(lpo => {
      if (lpo.id === lpoId) {
        return {
          ...lpo,
          lpoNumber: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          uploadedFileName: file.name,
          status: 'RELEASED' as const
        };
      }
      return lpo;
    }));
    
    console.log('LPO uploaded:', { lpoId, fileName: file.name });
    
    setUploadingLPOId(null);
  };

  const handleViewFile = (lpo: LPO) => {
    if (lpo.uploadedFileName) {
      // In a real application, this would open the PDF file
      // For now, we'll show an alert with file details
      alert(`Viewing PDF: ${lpo.uploadedFileName}\n\nLPO: ${lpo.lpoNumber}\nSupplier: ${lpo.supplier}\nAmount: ${lpo.currency} ${lpo.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}\n\nIn a real application, this would open the PDF document in a new tab or PDF viewer.`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      if (bulkUploadMode) {
        setUploadedFiles(Array.from(files));
      } else {
        setUploadedFile(files[0]);
      }
    }
  };

  const categorizeLPO = (lpo: LPO) => {
    const itemNames = lpo.items.map(item => item.itemName.toLowerCase()).join(' ');
    const supplierName = lpo.supplier.toLowerCase();
    const notes = (lpo.notes || '').toLowerCase();
    const searchText = `${itemNames} ${supplierName} ${notes}`;

    // Auto-categorize by item type
    let category = 'UNKNOWN';
    if (categorizationRules.drugKeywords.some(keyword => searchText.includes(keyword))) {
      category = 'DRUG';
    } else if (categorizationRules.nonDrugKeywords.some(keyword => searchText.includes(keyword))) {
      category = 'NON_DRUG';
    } else if (categorizationRules.vaccineKeywords.some(keyword => searchText.includes(keyword))) {
      category = 'VACCINE';
    }

    // Auto-categorize by department
    let department = 'GENERAL';
    for (const [dept, keywords] of Object.entries(categorizationRules.departmentKeywords)) {
      if (keywords.some(keyword => searchText.includes(keyword))) {
        department = dept;
        break;
      }
    }

    return {
      ...lpo,
      category: category as 'DRUG' | 'NON_DRUG' | 'VACCINE' | 'UNKNOWN',
      department,
      needsReview: category === 'UNKNOWN' || department === 'GENERAL'
    };
  };

  const processEPerolehanFile = async (file: File) => {
    try {
      // Parse CSV/Excel file
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      console.log('File headers:', headers);
      console.log('File content preview:', lines.slice(0, 5));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock LPOs for demonstration
      const mockLPOs: LPO[] = lines.slice(1, 6).map((line, index) => {
        const data = line.split(',');
        return {
          id: `temp-${file.name}-${index}`,
          lpoNumber: `LPO-${Date.now()}-${index}`,
          ePerolehanRef: `EP-${Date.now()}-${index}`,
          supplier: data[0] || 'Unknown Supplier',
          supplierContact: '+60 3-1234 5678',
          createdDate: new Date().toISOString().split('T')[0],
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: ['RELEASED', 'PENDING', 'CANCELLED'][Math.floor(Math.random() * 3)] as 'RELEASED' | 'PENDING' | 'CANCELLED',
          totalAmount: Math.random() * 10000 + 1000,
          currency: 'MYR',
          paymentType: ['APPL', 'CC', 'DP'][Math.floor(Math.random() * 3)] as 'APPL' | 'CC' | 'DP',
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)] as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          createdBy: 'System Import',
          items: [{
            id: `item-${index}`,
            itemName: data[1] || `Item ${index + 1}`,
            itemCode: `ITEM-${index}`,
            category: 'DRUG' as const,
            quantity: Math.floor(Math.random() * 100) + 1,
            receivedQuantity: 0,
            unitPrice: Math.random() * 100,
            totalPrice: Math.random() * 1000,
            unit: 'units'
          }],
          notes: `Imported from ${file.name}`
        };
      });

      // Categorize each LPO
      const categorizedLPOs = mockLPOs.map(categorizeLPO);
      const needsReview = categorizedLPOs.filter(lpo => lpo.needsReview);
      
      if (needsReview.length > 0) {
        setUncategorizedLPOs(needsReview);
        setShowCategorizeModal(true);
      }
      
      return {
        success: true,
        fileName: file.name,
        recordCount: lines.length - 1,
        categorizedLPOs,
        needsReview: needsReview.length
      };
      
    } catch (error) {
      console.error('File processing failed:', error as Error);
      return {
        success: false,
        fileName: file.name,
        error: (error as Error).message
      };
    }
  };

  const processBulkFiles = async () => {
    setIsUploading(true);
    setProcessingProgress(0);
    setProcessedCount(0);
    
    const results = [];
    const totalFiles = uploadedFiles.length;
    
    for (let i = 0; i < totalFiles; i++) {
      const file = uploadedFiles[i];
      const result = await processEPerolehanFile(file);
      results.push(result);
      
      setProcessedCount(i + 1);
      setProcessingProgress(((i + 1) / totalFiles) * 100);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalRecords = results.reduce((sum, r) => sum + (r.recordCount || 0), 0);
    
    alert(`Bulk processing complete!\n\nFiles processed: ${successCount}/${totalFiles}\nTotal LPO records: ${totalRecords}`);
    
    setUploadedFiles([]);
    setShowUploadModal(false);
    setIsUploading(false);
    setProcessingProgress(0);
    setProcessedCount(0);
  };

  const handleUploadSubmit = () => {
    if (bulkUploadMode && uploadedFiles.length > 0) {
      processBulkFiles();
    } else if (!bulkUploadMode && uploadedFile) {
      processEPerolehanFile(uploadedFile);
    }
  };

  useEffect(() => {
    setIsClient(true);
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(241 245 249) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      <div className="relative max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-indigo-600/8 to-purple-600/8 rounded-2xl group-hover:from-blue-600/12 group-hover:via-indigo-600/12 group-hover:to-purple-600/12 transition-all duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl"></div>
          <div className="relative bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/70 shadow-xl group-hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/procurement"
                  className="p-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg group/back"
                >
                  <IconArrowLeft className="h-5 w-5 group-hover/back:-translate-x-1 transition-transform duration-300" />
                </Link>
                <div>
                  <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight">
                    LPO Oversight
                  </h1>
                  <p className="text-slate-600 text-sm mt-1 font-medium">Monitor and manage ePerolehan-generated LPOs</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>ePerolehan Integration</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xl font-extrabold text-slate-800">{lpos.length}</div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total LPOs</div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <IconReceipt className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats (moved to top) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group bg-gradient-to-br from-blue-50/90 to-blue-100/90 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-blue-800 group-hover:text-blue-900 transition-colors duration-300">{lpos.length}</div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Total LPO</div>
                <div className="text-[10px] text-blue-500 font-semibold mt-1">All time</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <IconReceipt className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-emerald-50/90 to-emerald-100/90 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-emerald-800 group-hover:text-emerald-900 transition-colors duration-300">
                  {lpos.filter(lpo => lpo.status === 'RELEASED').length}
                </div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-1">Released LPO</div>
                <div className="text-[10px] text-emerald-500 font-semibold mt-1">Active</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <IconCheck className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-amber-50/90 to-amber-100/90 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-amber-800 group-hover:text-amber-900 transition-colors duration-300">
                  {lpos.filter(lpo => lpo.status === 'PENDING').length}
                </div>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-1">Pending LPO</div>
                <div className="text-[10px] text-amber-500 font-semibold mt-1">Awaiting release</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <IconClock className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-red-50/90 to-red-100/90 backdrop-blur-sm rounded-2xl p-4 border border-red-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-red-800 group-hover:text-red-900 transition-colors duration-300">
                  {lpos.filter(lpo => lpo.status === 'CANCELLED').length}
                </div>
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider mt-1">Cancel LPO</div>
                <div className="text-[10px] text-red-500 font-semibold mt-1">Cancelled</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <IconX className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>


        {/* Search and Filter Controls */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/70 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800">Filters & Search</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <IconFilter className="h-4 w-4" />
              <span>Advanced Filtering</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Search LPOs</label>
              <div className="relative group">
                <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search by LPO number, supplier, or ePerolehan ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/80 transition-all duration-300 text-slate-800 placeholder-slate-400 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/80 transition-all duration-300 text-slate-800 text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Vote Code</label>
              <select
                value={voteCodeFilter}
                onChange={(e) => setVoteCodeFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/80 transition-all duration-300 text-slate-800 text-sm"
              >
                <option value="all">All Vote Codes</option>
                <option value="990102">990102</option>
                <option value="080702">080702</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Vote Activity</label>
              <select
                value={voteActivityFilter}
                onChange={(e) => setVoteActivityFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/80 transition-all duration-300 text-slate-800 text-sm"
              >
                <option value="all">All Activities</option>
                <option value="27401">27401</option>
                <option value="27499">27499</option>
                <option value="27404">27404</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(endIndex, filteredLPOs.length)}</span> of <span className="font-semibold text-slate-700">{filteredLPOs.length}</span> LPOs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* LPO Table */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/70 shadow-xl overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50/80 to-slate-100/80 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">LPO Oversight</h3>
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">{filteredLPOs.length}</span> LPOs found
                </div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100/80 to-slate-50/80">
                <tr>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Date</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">PO</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">LPO</th>
                  <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Supplier</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Vote Code</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Activity</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Total</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Status</th>
                  <th className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Upload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {paginatedLPOs.map((lpo) => (
                  <tr key={lpo.id} className="hover:bg-slate-50/60 transition-all duration-200 group">
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors duration-200">{lpo.createdDate}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">{lpo.ePerolehanRef}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors duration-200">
                        {lpo.uploadedFileName || '-'}
                      </div>
                      {lpo.uploadedFileName && (
                        <div className="text-xs text-slate-500 font-medium">Uploaded</div>
                        )}
                    </td>
                    <td className="px-2 py-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors duration-200">{lpo.supplier}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{lpo.supplierContact}</div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="space-y-1 flex flex-col items-center">
                          {lpo.paymentType === 'APPL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                                Vote 990102
                              </span>
                        )}
                        {lpo.paymentType === 'CC' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                            Vote 080702
                          </span>
                        )}
                        {lpo.paymentType === 'DP' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                            Vote 080702
                          </span>
                          )}
                        </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border border-indigo-200 bg-indigo-50 text-indigo-700">
                          {lpo.items.some(item => item.category === 'DRUG') ? '27401' : 
                           lpo.items.some(item => item.category === 'NON_DRUG') ? '27499' : 
                           lpo.items.some(item => item.category === 'VACCINE') ? '27404' : '27401'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                        {lpo.currency} {lpo.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm group-hover:shadow-md transition-all duration-200 ${getStatusColor(lpo.status)}`}>
                        {getStatusIcon(lpo.status)}
                        {lpo.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {lpo.uploadedFileName ? (
                          <button
                            onClick={() => handleViewFile(lpo)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50/80 rounded-xl transition-all duration-200 group-hover:scale-105 hover:shadow-md cursor-pointer"
                            title="View PDF file"
                          >
                            <IconEye className="h-4 w-4" />
                          </button>
                        ) : (
                          <>
                            <input
                              type="file"
                              id={`upload-${lpo.id}`}
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && department !== 'Office Admin') {
                                  handleLPOUpload(lpo.id, file);
                                }
                              }}
                              className="hidden"
                            />
                            <label
                              htmlFor={`upload-${lpo.id}`}
                              className={`p-2 rounded-xl transition-all duration-200 group-hover:scale-105 hover:shadow-md cursor-pointer ${
                                uploadingLPOId === lpo.id
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : department === 'Office Admin'
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50/80'
                              }`}
                              title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Upload PDF file'}
                              aria-disabled={department === 'Office Admin'}
                            >
                              {uploadingLPOId === lpo.id ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                              ) : (
                                <IconUpload className="h-4 w-4" />
                              )}
                            </label>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats - section removed from bottom after moving to top */}

        {/* ePerolehan Integration Info - section removed from bottom after moving to top */}
          </div>
          
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <IconUpload className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Upload LPOs from ePerolehan</h3>
                <p className="text-sm text-slate-600">Import LPO data from exported files</p>
                </div>
              </div>
            <div className="space-y-4">
              {/* Upload Mode Toggle */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setBulkUploadMode(false)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    !bulkUploadMode 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                      : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
                  }`}
                >
                  Single File
                </button>
                <button
                  onClick={() => setBulkUploadMode(true)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    bulkUploadMode 
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' 
                      : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
                  }`}
                >
                  Bulk Upload (100+ LPOs)
                </button>
          </div>
          
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-700 mb-2">
                  <strong>Supported formats:</strong> CSV, Excel (.xlsx)
                </div>
                <div className="text-xs text-slate-500">
                  {bulkUploadMode 
                    ? 'Select multiple files to process 100+ LPOs at once. Perfect for large batches!'
                    : 'Export your LPOs from ePerolehan and upload the file here for automatic processing.'
                  }
            </div>
          </div>
          
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  multiple={bulkUploadMode}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <IconUpload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-slate-700 mb-1">
                    {bulkUploadMode ? (
                      uploadedFiles.length > 0 
                        ? `${uploadedFiles.length} files selected` 
                        : 'Click to select multiple files'
                    ) : (
                      uploadedFile ? uploadedFile.name : 'Click to select file'
                    )}
                </div>
                  <div className="text-xs text-slate-500">
                    {bulkUploadMode 
                      ? 'Choose multiple CSV or Excel files' 
                      : uploadedFile ? 'File selected' : 'Choose CSV or Excel file'
                    }
              </div>
                </label>
        </div>

              {/* File List for Bulk Upload */}
              {bulkUploadMode && uploadedFiles.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Ready to process {uploadedFiles.length} files
                    </span>
            </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="text-xs text-slate-600 bg-white rounded px-2 py-1">
                        {file.name}
          </div>
                    ))}
                </div>
                </div>
              )}

              {/* Single File Display */}
              {!bulkUploadMode && uploadedFile && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <IconCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Ready to process: {uploadedFile.name}
                    </span>
              </div>
            </div>
              )}

              {/* Progress Bar for Bulk Upload */}
              {isUploading && bulkUploadMode && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Processing files...</span>
                    <span>{processedCount} / {uploadedFiles.length}</span>
                </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                </div>
              </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedFile(null);
                    setUploadedFiles([]);
                    setBulkUploadMode(false);
                  }}
                  className="flex-1 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={
                    (bulkUploadMode && uploadedFiles.length === 0) || 
                    (!bulkUploadMode && !uploadedFile) || 
                    isUploading
                  }
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {bulkUploadMode ? 'Processing...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <IconUpload className="h-4 w-4" />
                      {bulkUploadMode ? 'Process All Files' : 'Upload & Process'}
                    </>
                  )}
                </button>
                </div>
                </div>
              </div>
            </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <IconRefresh className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Sync with ePerolehan</h3>
                <p className="text-sm text-slate-600">Fetch latest LPO updates</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-700">
                  This will sync all LPOs with ePerolehan system and update their status.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSyncEPerolehan}
                  disabled={isSyncing}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <IconRefresh className="h-4 w-4" />
                      Start Sync
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categorization Modal */}
      {showCategorizeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <IconFilter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Categorize LPOs</h3>
                <p className="text-sm text-slate-600">Review and categorize LPOs that need manual sorting</p>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {uncategorizedLPOs.map((lpo, index) => (
                <div key={lpo.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-slate-800">{lpo.lpoNumber}</span>
                        <span className="text-xs text-slate-500">{lpo.supplier}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          MYR {lpo.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        <strong>Items:</strong> {lpo.items.map(item => item.itemName).join(', ')}
                      </div>
                      {lpo.notes && (
                        <div className="text-xs text-slate-500">
                          <strong>Notes:</strong> {lpo.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Category</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        value={lpo.category || 'UNKNOWN'}
                        onChange={(e) => {
                          const updatedLPOs = [...uncategorizedLPOs];
                          updatedLPOs[index] = { ...lpo, category: e.target.value as any };
                          setUncategorizedLPOs(updatedLPOs);
                        }}
                      >
                        <option value="DRUG">Drug</option>
                        <option value="NON_DRUG">Non-Drug</option>
                        <option value="VACCINE">Vaccine</option>
                        <option value="UNKNOWN">Unknown</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Department</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        value={lpo.department || 'GENERAL'}
                        onChange={(e) => {
                          const updatedLPOs = [...uncategorizedLPOs];
                          updatedLPOs[index] = { ...lpo, department: e.target.value };
                          setUncategorizedLPOs(updatedLPOs);
                        }}
                      >
                        <option value="Emergency">Emergency</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Radiology">Radiology</option>
                        <option value="GENERAL">General</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowCategorizeModal(false);
                  setUncategorizedLPOs([]);
                }}
                className="flex-1 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={() => {
                  // Save categorized LPOs
                  console.log('Categorized LPOs:', uncategorizedLPOs);
                  setShowCategorizeModal(false);
                  setUncategorizedLPOs([]);
                  alert(`Successfully categorized ${uncategorizedLPOs.length} LPOs!`);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
              >
                <IconCheck className="h-4 w-4" />
                Save Categories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
