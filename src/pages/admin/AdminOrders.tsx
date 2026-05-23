import { useOrders } from '@/hooks/useOrders';
import { OrderRow } from '@/components/admin/OrderRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const AdminOrders = () => {
  const { data: orders = [], isLoading, error } = useOrders();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl">Orders ({orders.length})</h2>

      <div className="border border-border rounded-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-body">
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
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-body">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOrders;
