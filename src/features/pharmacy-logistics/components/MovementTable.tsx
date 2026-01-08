export type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplier: string;
  date: string;
  total: number;
  status: 'Pending' | 'Partially Received' | 'Completed' | 'Cancelled';
};

type MovementTableProps = {
  movements: PurchaseOrder[];
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'Pending':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Pending</span>;
    case 'Partially Received':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Partially Received</span>;
    case 'Completed':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
    case 'Cancelled':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
  }
}

export function MovementTable({ movements }: MovementTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50/80">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total (RM)</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {movements.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>No purchase orders yet</td>
            </tr>
          ) : (
            movements.map((po) => (
              <tr key={po.id}>
                <td className="px-4 py-2 text-sm text-gray-900">{po.date}</td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{po.poNumber}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{po.supplier}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-900">RM {po.total.toLocaleString()}</td>
                <td className="px-4 py-2 text-center">{getStatusBadge(po.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


