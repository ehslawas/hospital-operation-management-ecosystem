
import React, { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'

export const BudgetDebug: React.FC<{ voteCode: string; voteActivity: string; department: string }> = ({ voteCode, voteActivity, department }) => {
    const [expenses, setExpenses] = useState<any[]>([])
    const [warrants, setWarrants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDebugData = async () => {
            setLoading(true)
            try {
                // Fetch Warrants
                const { data: wData } = await supabase
                    .from('pharmacy_warrants')
                    .select('*')
                    .eq('vote_code', voteCode)
                    .eq('vote_activity', voteActivity)
                setWarrants(wData || [])

                // Fetch APPL Expenses
                const { data: eData } = await supabase
                    .from('pharmacy_appl_expenses')
                    .select('*')
                    //.eq('vote_code', voteCode) // Note: table might not have vote_code column directly if it's new? wService implies it does for filtering?
                    // Actually wService maps it manually?
                    // Let's filter by vote_activity only first
                    .eq('vote_activity', voteActivity)

                setExpenses(eData || [])
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        if (voteCode && voteActivity) {
            fetchDebugData()
        }
    }, [voteCode, voteActivity])

    if (loading) return <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md my-4">Loading Debug Info...</div>

    const totalAlloc = warrants.reduce((sum, w) => sum + Number(w.amount), 0)
    const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

    return (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-md my-8 no-print">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">🕵️‍♂️ Budget Debugger</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 className="font-bold border-b border-yellow-300 mb-2">Allocations (Warrants)</h4>
                    <p className="font-mono text-sm">Target: {voteCode} / {voteActivity}</p>
                    <ul className="list-disc pl-5 text-sm">
                        {warrants.map(w => (
                            <li key={w.id}>
                                {w.warrant_date}: <strong>{Number(w.amount).toLocaleString()}</strong> (Dept: {w.department})
                            </li>
                        ))}
                    </ul>
                    <p className="font-bold mt-2">Total Allocation: {totalAlloc.toLocaleString()}</p>
                </div>

                <div>
                    <h4 className="font-bold border-b border-yellow-300 mb-2">Expenses (Deductions)</h4>
                    <ul className="list-disc pl-5 text-sm">
                        {expenses.map(e => (
                            <li key={e.id}>
                                {e.expense_date} - PO: {e.po_number} <br />
                                Amount: <strong>{Number(e.amount).toLocaleString()}</strong> <br />
                                Status: {e.status} (ID: {e.id.substring(0, 8)}...)
                            </li>
                        ))}
                    </ul>
                    <p className="font-bold mt-2">Total Expenes: {totalExp.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white p-2 rounded border border-yellow-200">
                <p><strong>Calculated Balance:</strong> {(totalAlloc - totalExp).toLocaleString()}</p>
            </div>
        </div>
    )
}
