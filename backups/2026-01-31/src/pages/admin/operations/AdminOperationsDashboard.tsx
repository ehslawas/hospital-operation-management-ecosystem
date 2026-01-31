import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Wallet, Plus, FileText, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

const AdminOperationsDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Admin Operations</h1>
                    <p className="text-slate-500 mt-1">Manage hospital-level procurement and financial allocations</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-indigo-50 to-white border-indigo-100" onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_PROCUREMENT)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-900">Procurement</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-700">Purchase Orders</div>
                        <p className="text-xs text-indigo-500 mt-1">Manage admin POs</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-white border-purple-100" onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_FINANCIAL)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-900">Financial</CardTitle>
                        <Wallet className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">Warrants</div>
                        <p className="text-xs text-purple-500 mt-1">Fund allocations</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-emerald-50 to-white border-emerald-100" onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-900">Pembangunan</CardTitle>
                        <Building2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">Budgets (P42)</div>
                        <p className="text-xs text-emerald-500 mt-1">Development funds</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button
                            className="w-full justify-start bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_PROCUREMENT_CREATE)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Admin Purchase Order
                        </Button>
                        <Button
                            className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                            onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_WARRANT)}
                        >
                            <FileText className="mr-2 h-4 w-4" /> Manage Warrants
                        </Button>
                        <Button
                            className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_PEMBANGUNAN)}
                        >
                            <Building2 className="mr-2 h-4 w-4" /> Manage Pembangunan
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-slate-500 text-center py-8">
                            No recent activity found.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminOperationsDashboard;
