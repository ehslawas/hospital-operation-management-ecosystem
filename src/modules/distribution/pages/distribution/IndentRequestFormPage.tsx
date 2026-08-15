// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Save,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Package,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Select } from '@/components/ui'
import {
  getDepartments,
  getIndentEntitlements,
  createIndentRequest,
} from '@/modules/distribution/services/indentService'
import type { IndentEntitlement, IndentPriority } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

export const IndentRequestFormPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-1'
  const { success: showSuccess, error: showError } = useToastStore()

  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-nephro')
  const [priority, setPriority] = useState<IndentPriority>('normal')
  const [requiredDate, setRequiredDate] = useState<string>(
    new Date(Date.now() + 3600000 * 24 * 3).toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')

  const [entitlements, setEntitlements] = useState<IndentEntitlement[]>([])
  const [selectedEntitlementId, setSelectedEntitlementId] = useState<string>('')
  const [addQty, setAddQty] = useState<number>(10)

  // Cart of request items
  const [cartItems, setCartItems] = useState<
    Array<{
      item_type: 'drug' | 'non_drug'
      item_id: string
      item_code?: string
      item_name: string
      unit?: string
      qty_requested: number
      max_qty?: number
    }>
  >([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load departments
  useEffect(() => {
    getDepartments(hospitalId).then((res) => {
      if (res.data && res.data.length > 0) {
        setDepartments(res.data)
        const match = res.data.find(d => d.id === selectedDeptId)
        if (!match) {
          setSelectedDeptId(res.data[0].id)
        }
      }
    })
  }, [hospitalId])

  // Load entitlements for selected department
  useEffect(() => {
    if (!selectedDeptId) return
    getIndentEntitlements(hospitalId, selectedDeptId).then((res) => {
      if (res.data) {
        setEntitlements(res.data)
        if (res.data.length > 0) {
          setSelectedEntitlementId(res.data[0].id)
        } else {
          setSelectedEntitlementId('')
        }
      }
    })
  }, [hospitalId, selectedDeptId])

  // Handle Add Item from Entitlement list
  const handleAddItem = () => {
    const ent = entitlements.find((e) => e.id === selectedEntitlementId)
    if (!ent) {
      showError('Please select a valid item from department entitlement list')
      return
    }

    if (addQty <= 0) {
      showError('Quantity must be greater than 0')
      return
    }

    if (ent.max_qty_per_request && addQty > ent.max_qty_per_request) {
      showError(
        `Quantity exceeds department entitlement limit of ${ent.max_qty_per_request} ${ent.item_name}`
      )
      return
    }

    // Check if already in cart
    const existing = cartItems.find((c) => c.item_id === ent.item_id)
    if (existing) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.item_id === ent.item_id
            ? { ...item, qty_requested: item.qty_requested + addQty }
            : item
        )
      )
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          item_type: ent.item_type,
          item_id: ent.item_id,
          item_code: ent.item_code,
          item_name: ent.item_name,
          unit: ent.item_type === 'drug' ? 'TAB/VIAL' : 'PCS/PKT',
          qty_requested: addQty,
          max_qty: ent.max_qty_per_request,
        },
      ])
    }

    showSuccess(`Added ${ent.item_name} to request`)
  }

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.item_id !== itemId))
  }

  const handleQtyChange = (itemId: string, newQty: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, qty_requested: Math.max(1, newQty) } : item
      )
    )
  }

  const handleSubmit = async (submitImmediately: boolean) => {
    if (cartItems.length === 0) {
      showError('Please add at least 1 item to the indent request.')
      return
    }

    setIsSubmitting(true)
    const res = await createIndentRequest(hospitalId, user?.id || 'user-1', {
      requesting_department_id: selectedDeptId,
      priority,
      required_date: requiredDate,
      notes,
      submit_immediately: submitImmediately,
      items: cartItems,
    })

    setIsSubmitting(false)

    if (res.error) {
      showError(res.error)
    } else {
      showSuccess(
        submitImmediately
          ? 'Indent request submitted successfully for approval!'
          : 'Indent request saved as Draft.'
      )
      navigate(ROUTES.PHARMACY_DISTRIBUTION_INDENT)
    }
  }

  const selectedDeptObj = departments.find((d) => d.id === selectedDeptId)

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_INDENT)}
            className="text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              New Department Indent Request
            </h1>
            <p className="text-xs text-slate-400">
              Create drug/non-drug requisition from store according to department entitlement
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Meta Info */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
          <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Request Information
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Requesting Department <span className="text-rose-400">*</span>
            </label>
            <Select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs text-slate-100"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-slate-500 mt-1">
              Items available for selection are limited to this department's entitlement configuration.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as IndentPriority)}
              className="bg-slate-950 border-slate-800 text-xs text-slate-100"
            >
              <option value="normal">Normal (Routine)</option>
              <option value="high">High</option>
              <option value="urgent">⚡ Urgent (Emergency)</option>
              <option value="low">Low</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Required Date</label>
            <Input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Justification / Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Weekly ward stock replenishment for Hemodialysis Unit..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Right Section: Items Selection & Cart */}
        <div className="lg:col-span-2 space-y-5">
          {/* Entitlement Picker */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Select Entitled Item ({selectedDeptObj?.department_name || 'Department'})
              </h2>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.PHARMACY_DISTRIBUTION_ENTITLEMENT)}
                className="text-xs text-slate-400 hover:text-emerald-400"
              >
                Configure Entitlements
              </Button>
            </div>

            {entitlements.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  No entitlement configured for this department yet. Please configure entitlements or select another department.
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Entitled Item</label>
                  <Select
                    value={selectedEntitlementId}
                    onChange={(e) => setSelectedEntitlementId(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                  >
                    {entitlements.map((e) => (
                      <option key={e.id} value={e.id}>
                        [{e.item_type === 'drug' ? 'DRUG' : 'NON-DRUG'}] {e.item_code} - {e.item_name}{' '}
                        {e.max_qty_per_request ? `(Max: ${e.max_qty_per_request})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="w-32">
                  <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    value={addQty}
                    onChange={(e) => setAddQty(parseInt(e.target.value) || 1)}
                    className="bg-slate-950 border-slate-800 text-xs text-slate-100"
                  />
                </div>

                <Button
                  onClick={handleAddItem}
                  className="bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" /> Items in Indent Request
              </span>
              <span className="text-xs text-slate-400 font-normal">
                {cartItems.length} item(s) added
              </span>
            </h2>

            {cartItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No items added yet. Select an item above and click "Add Item".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">Item Code & Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5 text-center">Req Qty</th>
                      <th className="p-2.5 text-center">Max Allowed</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {cartItems.map((item) => (
                      <tr key={item.item_id} className="hover:bg-slate-800/30">
                        <td className="p-2.5">
                          <p className="font-semibold text-slate-100">{item.item_name}</p>
                          <p className="font-mono text-[10px] text-emerald-400">{item.item_code}</p>
                        </td>
                        <td className="p-2.5 uppercase text-[10px] font-semibold text-slate-400">
                          {item.item_type}
                        </td>
                        <td className="p-2.5 text-slate-400">{item.unit}</td>
                        <td className="p-2.5 text-center">
                          <Input
                            type="number"
                            min={1}
                            max={item.max_qty}
                            value={item.qty_requested}
                            onChange={(e) =>
                              handleQtyChange(item.item_id, parseInt(e.target.value) || 1)
                            }
                            className="w-20 text-center mx-auto bg-slate-950 border-slate-800 text-xs py-1"
                          />
                        </td>
                        <td className="p-2.5 text-center text-slate-400">
                          {item.max_qty || 'No Limit'}
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleRemoveItem(item.item_id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || cartItems.length === 0}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                <Save className="w-4 h-4 mr-1.5" /> Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || cartItems.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium"
              >
                <Send className="w-4 h-4 mr-1.5" /> Submit Indent Request
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndentRequestFormPage
