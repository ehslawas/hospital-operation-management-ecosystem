import React from 'react';
import { Button, IconButton } from '@/components/ui';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoanLedgerPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <IconButton variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
                    <ArrowLeft className="w-5 h-5" />
                </IconButton>
                <h1 className="text-2xl font-bold text-slate-900">Loan Ledger</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Loan Ledger Management</h2>
                    <p className="text-slate-500 mb-6">
                        View all active borrowings and lendings, track partial returns, and manage settlement status.
                    </p>
                    <Button variant="secondary" className="w-full">
                        Review Ledger Records
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LoanLedgerPage;
