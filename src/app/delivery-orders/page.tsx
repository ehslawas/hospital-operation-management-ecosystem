'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  IconArrowLeft, 
  IconSearch, 
  IconFilter, 
  IconCheck, 
  IconX, 
  IconPlus,
  IconUpload,
  IconDownload,
  IconEye,
  IconPackage,
  IconClock,
  IconTruck
} from '@/components/ui/Icons';

interface DeliveryOrder {
  id: string;
  doNumber: string;
  poNumber: string;
  lpoNumber?: string;
  supplier: string;
  supplierContact: string;
  deliveryDate: string;
  eta: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  voteCode?: string;
  voteActivity?: string;
  totalItems: number;
  receivedItems: number;
  uploadedFile?: string;
  receivedBy?: string;
  verifiedBy?: string;
  items: DeliveryItem[];
  doSequence: number; // 1, 2, 3 for multiple DOs of same PO
  totalDOs: number; // Total number of DOs for this PO
  parentPOId?: string; // Reference to the original PO
  isPartialDelivery: boolean; // True if this is a partial delivery
  remainingItems?: number; // Items still pending delivery
}

interface DeliveryItem {
  id: string;
  itemName: string;
  itemCode: string;
  category: 'DRUG' | 'NON_DRUG' | 'VACCINE';
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  batches: ItemBatch[];
}

interface ItemBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  qrCode?: string;
  receivedDate: string;
  location?: string;
}

export default function DeliveryOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedDO, setSelectedDO] = useState<DeliveryOrder | null>(null);
  const [selectedItem, setSelectedItem] = useState<DeliveryItem | null>(null);
  const [currentBatch, setCurrentBatch] = useState({
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    location: ''
  });
  const [scannedData, setScannedData] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraOrderId, setCameraOrderId] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (showCameraModal) {
      startCamera();
    } else {
      // Clean up camera when modal closes
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraLoading(false);
    }
  }, [showCameraModal]);

  // Load department for Office Admin view-only gating
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  // Generate mock data for 100 delivery orders
  const generateMockOrders = (): DeliveryOrder[] => {
    const orders: DeliveryOrder[] = [];
    const suppliers = [
      'PharmaCorp Sdn Bhd', 'MediSupply Malaysia', 'HealthTech Solutions', 
      'BioMed Industries', 'CarePlus Medical', 'MediCore Ltd', 
      'PharmaLink Sdn Bhd', 'HealthFirst Corp', 'MediCare Plus', 'BioPharm Ltd'
    ];
    const statuses: ('PENDING' | 'PARTIAL' | 'COMPLETED')[] = ['PENDING', 'PARTIAL', 'COMPLETED'];
    const voteCodes = ['990102', '080702'];
    const voteActivities = ['27401', '27499', '27404'];
    const itemNames = [
      'Paracetamol 500mg', 'Ibuprofen 400mg', 'Amoxicillin 250mg', 'Aspirin 100mg',
      'Surgical Gloves', 'Syringe 5ml', 'Bandage 10cm', 'Gauze Pad 10x10cm',
      'COVID-19 Vaccine', 'Hepatitis B Vaccine', 'Flu Vaccine', 'Thermometer Digital'
    ];

    let orderId = 1;
    const poGroups: { [key: string]: number } = {}; // Track DO sequences per PO

    for (let i = 1; i <= 80; i++) { // Reduced base POs to allow for multiple DOs
      const poNumber = `PO-${1000 + i}`;
      const lpoNumber = `LPO-2025-${String(i).padStart(3, '0')}`;
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const voteCode = voteCodes[Math.floor(Math.random() * voteCodes.length)];
      const voteActivity = voteActivities[Math.floor(Math.random() * voteActivities.length)];
      const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
      
      // Determine if this PO will have multiple DOs (30% chance)
      const willHaveMultipleDOs = Math.random() < 0.3;
      const numberOfDOs = willHaveMultipleDOs ? Math.floor(Math.random() * 3) + 2 : 1; // 2-4 DOs
      
      for (let doIndex = 1; doIndex <= numberOfDOs; doIndex++) {
        const doNumber = `DO-${2000 + orderId}`;
        const status = doIndex === 1 ? 
          (Math.random() < 0.4 ? 'COMPLETED' : Math.random() < 0.6 ? 'PARTIAL' : 'PENDING') :
          (doIndex === numberOfDOs ? 'PENDING' : 'COMPLETED'); // Last DO is pending, others completed
        
        // Generate random date within next 30 days
        const baseDate = new Date();
        const randomDays = Math.floor(Math.random() * 30);
        const deliveryDate = new Date(baseDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
        const formattedDate = deliveryDate.toISOString().split('T')[0];
        
        // Randomly assign uploaded files (about 30% have files)
        const hasUploadedFile = Math.random() < 0.3;
        const uploadedFile = hasUploadedFile ? `${doNumber}.pdf` : undefined;

        // Calculate remaining items for partial deliveries
        const totalItemsForPO = Math.floor(Math.random() * 5) + 3; // 3-7 items total
        const itemsPerDO = Math.floor(totalItemsForPO / numberOfDOs);
        const remainingItems = doIndex < numberOfDOs ? totalItemsForPO - (itemsPerDO * doIndex) : 0;

        orders.push({
          id: String(orderId),
          doNumber,
          poNumber,
          lpoNumber,
          supplier,
          supplierContact: `+60 3-${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
          deliveryDate: formattedDate,
          eta: formattedDate,
          status,
          voteCode,
          voteActivity,
          totalItems: doIndex === numberOfDOs ? remainingItems : itemsPerDO,
          receivedItems: status === 'COMPLETED' ? (doIndex === numberOfDOs ? remainingItems : itemsPerDO) : 0,
          uploadedFile,
          doSequence: doIndex,
          totalDOs: numberOfDOs,
          parentPOId: poNumber,
          isPartialDelivery: numberOfDOs > 1,
          remainingItems: doIndex < numberOfDOs ? remainingItems : 0,
          items: [
            {
              id: `i${orderId}`,
              itemName,
              itemCode: `item-${String(orderId).padStart(3, '0')}`,
            category: voteActivity === '27401' ? 'DRUG' : voteActivity === '27404' ? 'VACCINE' : 'NON_DRUG',
            orderedQuantity: Math.floor(Math.random() * 200) + 50,
            receivedQuantity: status === 'COMPLETED' ? Math.floor(Math.random() * 200) + 50 : 0,
            unit: 'units',
              batches: []
            }
          ]
        });
        
        orderId++;
      }
    }
    return orders;
  };

  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(generateMockOrders());

  // Filter orders based on search and status
  const filteredOrders = deliveryOrders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.doNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDate = (() => {
      if (!dateFrom && !dateTo) return true;
      const d = order.deliveryDate;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Generate QR code data
  const generateQRCode = (item: DeliveryItem, batch: typeof currentBatch) => {
    const qrData = {
      itemCode: item.itemCode,
      itemName: item.itemName,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      location: batch.location,
      receivedDate: new Date().toISOString()
    };
    return btoa(JSON.stringify(qrData)); // Base64 encode for QR
  };

  // Handle receiving item with batch details
  const handleReceiveItem = () => {
    if (!selectedDO || !selectedItem || !currentBatch.batchNumber || !currentBatch.expiryDate || currentBatch.quantity <= 0) {
      alert('Please fill in all batch details');
      return;
    }

    const qrCode = generateQRCode(selectedItem, currentBatch);
    
    const newBatch: ItemBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: currentBatch.batchNumber,
      expiryDate: currentBatch.expiryDate,
      quantity: currentBatch.quantity,
      qrCode,
      receivedDate: new Date().toISOString().split('T')[0],
      location: currentBatch.location
    };

    // Update delivery orders
    setDeliveryOrders(prev => prev.map(do_ => {
      if (do_.id === selectedDO.id) {
        return {
          ...do_,
          items: do_.items.map(item => {
            if (item.id === selectedItem.id) {
              const newReceivedQty = item.receivedQuantity + currentBatch.quantity;
              return {
                ...item,
                receivedQuantity: newReceivedQty,
                batches: [...item.batches, newBatch]
              };
            }
            return item;
          }),
          receivedItems: do_.items.filter(i => i.id === selectedItem.id ? 
            (i.receivedQuantity + currentBatch.quantity) >= i.orderedQuantity : 
            i.receivedQuantity >= i.orderedQuantity
          ).length,
          status: do_.items.every(i => 
            i.id === selectedItem.id ? 
              (i.receivedQuantity + currentBatch.quantity) >= i.orderedQuantity : 
              i.receivedQuantity >= i.orderedQuantity
          ) ? 'COMPLETED' : 'PARTIAL'
        };
      }
      return do_;
    }));

    // Reset form
    setCurrentBatch({
      batchNumber: '',
      expiryDate: '',
      quantity: 0,
      location: ''
    });

    alert('Item received successfully! QR code generated.');
    setShowReceiveModal(false);
  };

  // Handle QR code download
  const handleDownloadQR = (batch: ItemBatch, itemName: string) => {
    // In production, this would generate an actual QR code image
    const qrText = `Item: ${itemName}\nBatch: ${batch.batchNumber}\nExpiry: ${batch.expiryDate}\nQty: ${batch.quantity}\nLocation: ${batch.location || 'N/A'}`;
    alert(`QR Code Data:\n\n${qrText}\n\n(In production, this would download a QR code image)`);
  };

  // Handle DO file upload
  const handleDOUpload = (doId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      fileInputRef.current.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          setDeliveryOrders(prev => prev.map(do_ => 
            do_.id === doId ? { ...do_, uploadedFile: file.name } : do_
          ));
          alert(`Delivery Order ${file.name} uploaded successfully!`);
        }
      };
    }
  };

  // Handle camera capture
  const handleCameraCapture = (doId: string) => {
    setCameraOrderId(doId);
    setShowCameraModal(true);
  };

  // Handle creating additional DO for partial deliveries
  const handleCreateAdditionalDO = (existingOrder: DeliveryOrder) => {
    const newDOSequence = existingOrder.doSequence + 1;
    const newDONumber = `DO-${2000 + deliveryOrders.length + 1}`;
    
    const newDO: DeliveryOrder = {
      id: String(deliveryOrders.length + 1),
      doNumber: newDONumber,
      poNumber: existingOrder.poNumber,
      lpoNumber: existingOrder.lpoNumber,
      supplier: existingOrder.supplier,
      supplierContact: existingOrder.supplierContact,
      deliveryDate: new Date().toISOString().split('T')[0],
      eta: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      voteCode: existingOrder.voteCode,
      voteActivity: existingOrder.voteActivity,
      totalItems: existingOrder.remainingItems || 0,
      receivedItems: 0,
      uploadedFile: undefined,
      doSequence: newDOSequence,
      totalDOs: existingOrder.totalDOs,
      parentPOId: existingOrder.parentPOId,
      isPartialDelivery: true,
      remainingItems: 0,
      items: existingOrder.items.map(item => ({
        ...item,
        id: `i${deliveryOrders.length + 1}`,
        receivedQuantity: 0,
        batches: []
      }))
    };

    setDeliveryOrders(prev => [...prev, newDO]);
    alert(`Additional DO created: ${newDONumber} (Part ${newDOSequence} of ${existingOrder.totalDOs})`);
  };

  // Start camera
  const startCamera = async () => {
    setCameraLoading(true);
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraLoading(false);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraLoading(false);
      alert('Camera access denied or not available. Please use the PDF upload option instead.');
      setShowCameraModal(false);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraOrderId) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Convert to blob and simulate file upload
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `Photo_${Date.now()}.jpg`;
            setDeliveryOrders(prev => prev.map(do_ => 
              do_.id === cameraOrderId ? { ...do_, uploadedFile: fileName } : do_
            ));
            alert(`Photo captured and uploaded: ${fileName}`);
            setShowCameraModal(false);
            setCameraOrderId(null);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCameraModal(false);
    setCameraOrderId(null);
  };

  // Handle scan processing
  const handleProcessScan = () => {
    if (!scannedData.trim()) {
      alert('Please enter or scan QR code data');
      return;
    }

    try {
      const decoded = JSON.parse(atob(scannedData));
      alert(`Scanned Item Details:\n\nItem: ${decoded.itemName}\nBatch: ${decoded.batchNumber}\nExpiry: ${decoded.expiryDate}\nQuantity: ${decoded.quantity}\nLocation: ${decoded.location || 'N/A'}`);
      setScannedData('');
      setShowScanModal(false);
    } catch (error) {
      alert('Invalid QR code data');
    }
  };

  const getStatusColor = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PENDING':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <IconCheck className="h-4 w-4" />;
      case 'PARTIAL':
        return <IconClock className="h-4 w-4" />;
      case 'PENDING':
        return <IconClock className="h-4 w-4" />;
      default:
        return <IconClock className="h-4 w-4" />;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-6">
      <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/pharmacy/logistics" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <IconArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <IconPackage className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Delivery Orders</h1>
                  <p className="text-sm text-slate-600 mt-1">Scan, Receive & Track Deliveries</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={department === 'Office Admin' ? undefined : () => setShowScanModal(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-lg ${
                  department === 'Office Admin' ? 'bg-slate-300 text-slate-600 cursor-not-allowed shadow' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                }`}
                aria-disabled={department === 'Office Admin'}
                title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Scan QR Code'}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan QR Code
              </button>
            </div>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <IconTruck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{deliveryOrders.length}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Total Delivery</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <IconCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {deliveryOrders.filter(d => d.status === 'COMPLETED').length}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Complete Delivery</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <IconPackage className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {deliveryOrders.filter(d => d.status === 'PARTIAL').length}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Partial Delivery</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <IconClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {deliveryOrders.filter(d => d.status === 'PENDING').length}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Pending Delivery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by DO, PO, or Supplier..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                placeholder="From"
              />
            </div>

            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        {/* Delivery Orders Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Delivery Orders</h2>
            <p className="text-sm text-slate-600">{filteredOrders.length} delivery orders found (showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length})</p>
      </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">PO / LPO</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Vote</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Progress</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Action</th>
            </tr>
          </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors duration-200">
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">{order.deliveryDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="text-sm text-slate-700">{order.poNumber}</div>
                        <div className="text-xs text-slate-500">{order.lpoNumber || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {order.voteCode || '-'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                          {order.voteActivity || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        // Aggregate across all DOs for this PO to match the desired layout
                        const samePO = deliveryOrders.filter(o => o.poNumber === order.poNumber);
                        const totalOrdered = samePO.reduce((sum, d) => sum + d.items.reduce((s, it) => s + (it.orderedQuantity || 0), 0), 0);
                        const totalReceivedRaw = samePO.reduce((sum, d) => sum + d.items.reduce((s, it) => s + (it.receivedQuantity || 0), 0), 0);
                        const totalReceivedClamped = Math.min(totalReceivedRaw, totalOrdered);
                        const basePct = totalOrdered > 0 ? Math.round((totalReceivedClamped / totalOrdered) * 100) : 0;
                        const isCompletedRow = order.status === 'COMPLETED';
                        const pct = isCompletedRow ? 100 : basePct;
                        const displayReceived = isCompletedRow ? totalOrdered : totalReceivedClamped;
                        const doNumbers = samePO.map(d => d.doNumber);
                        return (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600 w-10 text-right">{pct}%</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-600">{displayReceived}/{totalOrdered} units delivered</div>
                            {(() => {
                              const uploaded = samePO.filter(d => !!d.uploadedFile).map(d => d.uploadedFile as string);
                              if (uploaded.length === 0) return null;
                              return (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {uploaded.map(name => (
                                    <button
                                      key={name}
                                      onClick={() => alert(`Viewing ${name}`)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                      title="View uploaded DO"
                                    >
                                      <span className="truncate max-w-[120px]">{name}</span>
                                      <IconEye className="h-3.5 w-3.5 text-slate-500" />
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={department === 'Office Admin' ? undefined : () => handleDOUpload(order.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs transition-colors ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                          aria-disabled={department === 'Office Admin'}
                          title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Upload PDF'}
                        >
                          <IconUpload className="h-4 w-4" />
                          PDF
                        </button>
                        <button
                          onClick={department === 'Office Admin' ? undefined : () => handleCameraCapture(order.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs transition-colors ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800'}`}
                          aria-disabled={department === 'Office Admin'}
                          title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Open Camera'}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Camera
                        </button>
                      </div>
                    </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Receive Items Modal */}
        {showReceiveModal && selectedDO && department !== 'Office Admin' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Receive Items</h2>
                    <p className="text-slate-600 mt-1">{selectedDO.doNumber} - {selectedDO.supplier}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowReceiveModal(false);
                      setSelectedItem(null);
                      setCurrentBatch({ batchNumber: '', expiryDate: '', quantity: 0, location: '' });
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <IconX className="h-6 w-6 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {!selectedItem ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Select Item to Receive</h3>
                    {selectedDO.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{item.itemName}</div>
                            <div className="text-sm text-slate-600">Code: {item.itemCode}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                item.category === 'DRUG' ? 'bg-blue-100 text-blue-700' :
                                item.category === 'NON_DRUG' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {item.category}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-600">Ordered: {item.orderedQuantity} {item.unit}</div>
                            <div className="text-sm font-bold text-green-600">Received: {item.receivedQuantity} {item.unit}</div>
                            <div className="text-sm font-bold text-orange-600">
                              Remaining: {item.orderedQuantity - item.receivedQuantity} {item.unit}
                            </div>
                          </div>
                        </div>

                        {item.batches.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-xs font-semibold text-slate-700 mb-2">Received Batches:</div>
                            <div className="space-y-1">
                              {item.batches.map((batch) => (
                                <div key={batch.id} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600">
                                    Batch {batch.batchNumber} - {batch.quantity} {item.unit}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadQR(batch, item.itemName);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <IconDownload className="h-3 w-3" />
                                    QR
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Receiving: {selectedItem.itemName}</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Ordered:</span>
                          <span className="ml-2 font-bold">{selectedItem.orderedQuantity} {selectedItem.unit}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Received:</span>
                          <span className="ml-2 font-bold text-green-600">{selectedItem.receivedQuantity} {selectedItem.unit}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Remaining:</span>
                          <span className="ml-2 font-bold text-orange-600">
                            {selectedItem.orderedQuantity - selectedItem.receivedQuantity} {selectedItem.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900">Enter Batch Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Batch Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={currentBatch.batchNumber}
                            onChange={(e) => setCurrentBatch(prev => ({ ...prev, batchNumber: e.target.value }))}
                            placeholder="e.g., PAR2024A"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Expiry Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={currentBatch.expiryDate}
                            onChange={(e) => setCurrentBatch(prev => ({ ...prev, expiryDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={currentBatch.quantity || ''}
                            onChange={(e) => setCurrentBatch(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                            min="0"
                            max={selectedItem.orderedQuantity - selectedItem.receivedQuantity}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Storage Location
                          </label>
                          <input
                            type="text"
                            value={currentBatch.location}
                            onChange={(e) => setCurrentBatch(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g., Section A Cabinet B Level 2"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedItem(null);
                          setCurrentBatch({ batchNumber: '', expiryDate: '', quantity: 0, location: '' });
                        }}
                        className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleReceiveItem}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Receive & Generate QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan QR Modal */}
        {showScanModal && department !== 'Office Admin' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Scan QR Code</h2>
                    <p className="text-slate-600 text-sm">Scan or enter QR code data</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowScanModal(false);
                      setScannedData('');
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <IconX className="h-6 w-6 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    QR Code Data
                  </label>
                  <textarea
                    value={scannedData}
                    onChange={(e) => setScannedData(e.target.value)}
                    placeholder="Scan QR code or paste data here..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800 resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowScanModal(false);
                      setScannedData('');
                    }}
                    className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessScan}
                    disabled={!scannedData.trim()}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Process Scan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {showCameraModal && department !== 'Office Admin' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Capture Photo</h2>
                    <p className="text-slate-600 mt-1">Take a photo of the delivery order document</p>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <IconX className="h-6 w-6 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="relative bg-slate-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-slate-600">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={stopCamera}
                    className="px-6 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Capture Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          data-order-id=""
        />
      </div>
    </div>
  );
}


