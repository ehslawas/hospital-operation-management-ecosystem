import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminProcurementService } from '@/services/admin/adminProcurementService';
import { AdminPurchaseOrder } from '@/types/adminOperations.types';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const AdminPurchaseOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<AdminPurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                const data = await adminProcurementService.getAdminPurchaseOrderById(id);
                setOrder(data);
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Order {order.order_number}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(order.status)}
                        <span className="text-slate-500 text-sm">{order.order_date}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{order.supplier?.company_name}</div>
                        {/* Additional supplier details could go here */}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Created By:</span>
                            <span>{order.created_by}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Expected Delivery:</span>
                            <span>{order.expected_delivery_date || '-'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Specifications</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.item_description}</TableCell>
                                    <TableCell className="text-slate-500">{item.specifications || '-'}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.unit_price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell colSpan={4} className="text-right font-bold">Total Amount</TableCell>
                                <TableCell className="text-right font-bold text-lg">RM {order.total_amount.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {order.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 whitespace-pre-wrap">{order.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AdminPurchaseOrderDetailPage;
