export const PHARMACY_STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  CRITICAL: 'critical',
  OUT_OF_STOCK: 'out_of_stock',
} as const

export const PHARMACY_BATCH_STATUS = {
  AVAILABLE: 'available',
  QUARANTINE: 'quarantine',
  EXPIRED: 'expired',
  DEPLETED: 'depleted',
} as const

export const PHARMACY_TRANSFER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PREPARING: 'preparing',
  IN_TRANSIT: 'in_transit',
  RECEIVED: 'received',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const

export const PHARMACY_TRANSACTION_TYPE = {
  RECEIPT: 'receipt',
  ISSUE: 'issue',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  ADJUST: 'adjust',
  RETURN: 'return',
  DISPOSE: 'dispose',
} as const

export const STORAGE_LOCATION_TYPES = {
  WAREHOUSE: 'warehouse',
  PHARMACY: 'pharmacy',
  WARD: 'ward',
  COLD_ROOM: 'cold_room',
} as const

export const TRANSACTION_TYPES = {
  RECEIPT: 'receipt',
  ISSUE: 'issue',
  TRANSFER: 'transfer',
  ADJUST: 'adjust',
  RETURN: 'return',
  DISPOSE: 'dispose',
  STOCK_TAKE: 'stock_take',
} as const
