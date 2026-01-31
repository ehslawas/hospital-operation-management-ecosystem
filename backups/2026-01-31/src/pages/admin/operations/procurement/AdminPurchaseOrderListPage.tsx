import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { adminProcurementService } from '@/services/admin/adminProcurementService';
import { AdminPurchaseOrder } from '@/types/adminOperations.types';
import { useAuthStore } from '@/stores/authStore';

const AdminPurchaseOrderListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<AdminPurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.hospital_id) return;
            try {
                const data = await adminProcurementService.getAdminPurchaseOrders(user.hospital_id);
                setOrders(data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user?.hospital_id]);

    const filteredOrders = orders.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge variant="success">Approved</Badge>;
            case 'pending_approval': return <Badge variant="warning">Pending Approval</Badge>;
            case 'rejected': return <Badge variant="error">Rejected</Badge>;
            case 'draft': return <Badge variant="gray">Draft</Badge>;
            default: return <Badge variant="gray">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Admin Purchase Orders</h1>
                    <p className="text-slate-500 mt-1">Manage procurement orders for hospital administration</p>
                </div>
                <Button onClick={() => navigate(ROUTES.ADMIN_OPERATIONS_PROCUREMENT_CREATE)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Create Order
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Orders List</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search orders..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">No orders found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => navigate(`${ROUTES.ADMIN_OPERATIONS_PROCUREMENT}/${order.id}`)}
                                    >
                                        <TableCell className="font-medium">{order.order_number}</TableCell>
                                        <TableCell>{order.order_date}</TableCell>
                                        <TableCell>{order.supplier?.company_name || '-'}</TableCell>
                                        <TableCell>RM {order.total_amount.toFixed(2)}</TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell>{order.items?.length || 0} items</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminPurchaseOrderListPage;
