import { useOrders } from '@/hooks/useOrders';
import { OrderRow } from '@/components/admin/OrderRow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const AdminOrders = () => {
  const { data: orders = [], isLoading, error } = useOrders();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-stone-800">Orders ({orders.length})</h2>

      <div className="admin-table-wrap">
        <Table>
          <TableHeader className="admin-thead">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="admin-th">Date</TableHead>
              <TableHead className="admin-th">Customer</TableHead>
              <TableHead className="admin-th">Total</TableHead>
              <TableHead className="admin-th">Status</TableHead>
              <TableHead className="admin-th text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-stone-400 font-body">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-destructive font-body">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-stone-400 font-body">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, idx) => <OrderRow key={order.id} order={order} className={idx % 2 === 1 ? 'bg-stone-50/40' : ''} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
