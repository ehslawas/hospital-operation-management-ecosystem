// @ts-nocheck
import React from 'react'
import { useParams } from 'react-router-dom'
import { PurchaseOrderDetailView } from './PurchaseOrderDetailView'

export const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return <PurchaseOrderDetailView id={id} />
}

export default PurchaseOrderDetailPage
