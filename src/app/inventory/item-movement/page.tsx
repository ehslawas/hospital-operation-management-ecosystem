'use client';

import { useState, useEffect } from 'react';
import { getItems, getBatches } from '@/features/pharmacy-logistics/services/dataStore';
import TransactionDetailsModal, { TransactionDetails } from '@/components/TransactionDetailsModal';
import ClientOnly from '@/components/ClientOnly';

export default function ItemMovementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Drug' | 'Non-drug'>('all');
  const [selectedMovementType, setSelectedMovementType] = useState<'all' | 'RECEIVE' | 'ISSUE' | 'ADJUST' | 'TRANSFER'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const allItems = getItems();
    const allBatches = getBatches();
    setItems(allItems);
    setBatches(allBatches);
  }, []);

  // Generate 100 realistic movement transactions
  const generateMovements = () => {
    const movementTypes = ['RECEIVE', 'ISSUE', 'ADJUST', 'TRANSFER'];
    const categories = ['Drug', 'Non-drug'];
    const units = ['Main Store', 'Operating Theater', 'Emergency Department', 'ICU', 'Pediatric Ward', 'Cardiology Ward', 'Orthopedic Ward', 'Pharmacy', 'Laboratory', 'Radiology'];
    const users = ['Dr. Ahmad Rahman', 'Dr. Sarah Lee', 'Dr. Lim Wei Ming', 'Dr. Priya Sharma', 'Dr. Chen Mei Ling', 'Nurse Ahmad Yusuf', 'Dr. Raj Kumar', 'Dr. Maria Santos', 'Dr. James Wilson', 'Nurse Lisa Chen', 'Dr. Michael Brown', 'Dr. Emily Davis', 'Nurse David Kim', 'Dr. Anna Johnson', 'Dr. Robert Taylor'];
    
    const drugItems = [
      { name: 'Paracetamol 500mg', code: 'PAR-500' },
      { name: 'Ibuprofen 400mg', code: 'IBU-400' },
      { name: 'Aspirin 100mg', code: 'ASP-100' },
      { name: 'Amoxicillin 250mg', code: 'AMX-250' },
      { name: 'Metformin 500mg', code: 'MET-500' },
      { name: 'Omeprazole 20mg', code: 'OME-20' },
      { name: 'Atorvastatin 20mg', code: 'ATO-20' },
      { name: 'Lisinopril 10mg', code: 'LIS-10' },
      { name: 'Amlodipine 5mg', code: 'AML-5' },
      { name: 'Simvastatin 40mg', code: 'SIM-40' },
      { name: 'Losartan 50mg', code: 'LOS-50' },
      { name: 'Hydrochlorothiazide 25mg', code: 'HCT-25' },
      { name: 'Metoprolol 50mg', code: 'MET-50' },
      { name: 'Furosemide 40mg', code: 'FUR-40' },
      { name: 'Warfarin 5mg', code: 'WAR-5' }
    ];

    const nonDrugItems = [
      { name: 'Surgical Gloves', code: 'SG-001' },
      { name: 'Bandages', code: 'BAN-001' },
      { name: 'Thermometers', code: 'THM-001' },
      { name: 'Surgical Masks', code: 'SM-001' },
      { name: 'Syringes 5ml', code: 'SYR-5' },
      { name: 'Needles 21G', code: 'NED-21' },
      { name: 'Gauze Pads', code: 'GAU-001' },
      { name: 'Alcohol Swabs', code: 'ALC-001' },
      { name: 'Cotton Balls', code: 'COT-001' },
      { name: 'Adhesive Tape', code: 'TAP-001' },
      { name: 'Blood Pressure Cuff', code: 'BPC-001' },
      { name: 'Stethoscope', code: 'STH-001' },
      { name: 'Oxygen Mask', code: 'OXM-001' },
      { name: 'IV Drip Set', code: 'IVD-001' },
      { name: 'Catheter', code: 'CAT-001' }
    ];

    const movements = [];
    const startDate = new Date('2024-11-01');
    
    for (let i = 0; i < 100; i++) {
      const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const itemList = category === 'Drug' ? drugItems : nonDrugItems;
      const item = itemList[Math.floor(Math.random() * itemList.length)];
      const unit = units[Math.floor(Math.random() * units.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Generate realistic quantities based on movement type
      let quantity;
      if (type === 'RECEIVE') {
        quantity = Math.floor(Math.random() * 200) + 50; // 50-250
      } else if (type === 'ISSUE') {
        quantity = Math.floor(Math.random() * 100) + 10; // 10-110
      } else if (type === 'ADJUST') {
        quantity = Math.floor(Math.random() * 20) - 10; // -10 to +10
      } else { // TRANSFER
        quantity = Math.floor(Math.random() * 50) + 5; // 5-55
      }

      // Generate reference numbers
      let reference;
      if (type === 'RECEIVE') {
        reference = `PO-2024-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`;
      } else if (type === 'ISSUE') {
        reference = `REQ-2024-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`;
      } else if (type === 'ADJUST') {
        reference = `ADJ-2024-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`;
      } else {
        reference = `TRF-2024-${String(Math.floor(Math.random() * 30) + 1).padStart(3, '0')}`;
      }

      // Generate date (spread over last 45 days)
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(Math.random() * 45));
      
      // Generate time
      const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 7 PM
      const minute = Math.floor(Math.random() * 60);
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Calculate running balance for this item at this unit
      const existingMovements = movements.filter((m: any) => 
        m.itemCode === item.code && m.unit === unit && 
        (new Date(m.date) < date || (m.date === date.toISOString().split('T')[0] && m.time < time))
      );
      const currentBalance: number = existingMovements.reduce((sum: number, m: any) => sum + m.quantity, 0);
      const balanceBefore: number = currentBalance;
      const balanceAfter: number = currentBalance + quantity;

      // Generate batch and expiry information for all transactions
      const batchNumber = `BATCH-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
      const expiryDate = new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      movements.push({
        id: `MOV-${String(i + 1).padStart(3, '0')}`,
        date: date.toISOString().split('T')[0],
        time: time,
        type: type,
        itemName: item.name,
        itemCode: item.code,
        category: category,
        quantity: quantity,
        unit: unit,
        reference: reference,
        requestedBy: user,
        notes: `${type.toLowerCase()} transaction`,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        batchNumber: batchNumber,
        expiryDate: expiryDate,
      });
    }

    // Sort by date and time (newest first)
    return movements.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    setMovements(generateMovements());
  }, []);

  const filteredMovements = movements.filter(movement => {
    const matchesCategory = selectedCategory === 'all' || movement.category === selectedCategory;
    const matchesType = selectedMovementType === 'all' || movement.type === selectedMovementType;
    const matchesSearch = searchTerm === '' || 
      movement.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesType && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMovements = filteredMovements.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleTransactionClick = (movement: any) => {
    const transactionDetails: TransactionDetails = {
      id: movement.id,
      date: movement.date,
      time: movement.time,
      type: movement.type,
      itemName: movement.itemName,
      itemCode: movement.itemCode,
      category: movement.category,
      quantity: movement.quantity,
      unit: movement.unit,
      requestedBy: movement.requestedBy,
      reference: movement.reference,
      balanceBefore: movement.balanceBefore,
      balanceAfter: movement.balanceAfter,
      batchNumber: movement.batchNumber,
      expiryDate: movement.expiryDate,
    };
    
    setSelectedTransaction(transactionDetails);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'RECEIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'ISSUE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ADJUST': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'TRANSFER': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'ISSUE':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'ADJUST':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'TRANSFER':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <ClientOnly>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Item Movement</h1>
              <p className="text-lg text-slate-600">Track all drug and non-drug inventory transactions</p>
            </div>
          </div>
        </div>

        {/* Modern Filters Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search items, codes, or requested by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Categories</option>
                <option value="Drug">Drug</option>
                <option value="Non-drug">Non-drug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Movement Type</label>
              <select
                value={selectedMovementType}
                onChange={(e) => setSelectedMovementType(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Types</option>
                <option value="RECEIVE">Receive</option>
                <option value="ISSUE">Issue</option>
                <option value="ADJUST">Adjust</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedMovementType('all');
                  setCurrentPage(1);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl font-semibold hover:from-slate-200 hover:to-slate-300 transition-all duration-200 border border-slate-300 shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Modern Movement Log Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-blue-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Movement Log</h3>
                <p className="text-slate-600 font-medium">Showing {startIndex + 1}-{Math.min(endIndex, filteredMovements.length)} of {filteredMovements.length} transactions</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-600 mb-3">No Movements Found</h4>
                <p className="text-slate-500 text-lg">Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Item</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Qty</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Unit</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Requested By</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Ref</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200/60">
                  {currentMovements.map((movement) => (
                    <tr 
                      key={movement.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 group cursor-pointer"
                      onClick={() => handleTransactionClick(movement)}
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">{movement.date}</div>
                        <div className="text-sm text-slate-500 font-medium">{movement.time}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold border ${getMovementTypeColor(movement.type)}`}>
                          {getMovementIcon(movement.type)}
                          <span className="ml-2">{movement.type}</span>
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-semibold text-slate-900">{movement.itemName}</div>
                        <div className="text-sm text-slate-500 font-medium">{movement.itemCode} • {movement.category}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-center">
                        <span className={`text-lg font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-slate-900">{movement.unit}</td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-slate-900">{movement.requestedBy}</td>
                      <td className="px-8 py-6 whitespace-nowrap text-center text-sm font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{movement.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Modern Pagination */}
          {filteredMovements.length > 0 && (
            <div className="px-8 py-6 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-blue-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                              : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="px-3 text-slate-500 font-semibold">...</span>
                        <button
                          onClick={() => goToPage(totalPages)}
                          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            currentPage === totalPages
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                              : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  >
                    Next
                  </button>
                </div>
                
                <div className="text-sm font-semibold text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMovements.length)} of {filteredMovements.length} results
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        transaction={selectedTransaction}
      />
    </div>
    </ClientOnly>
  );
}