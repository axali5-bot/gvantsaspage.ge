import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TableCell, TableRow } from '@/components/ui/table';
import { Eye, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateOrderStatus, Order } from '@/hooks/useOrders';

interface Props {
  order: Order;
}

export const OrderRow = ({ order }: Props) => {
  const updateStatus = useUpdateOrderStatus();
  const [rowStatus, setRowStatus] = useState<Order['status']>(order.status || 'pending');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRowStatus(order.status || 'pending');
  }, [order.status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStatus.mutateAsync({ id: order.id, status: rowStatus });
      toast.success('Order status updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
      setRowStatus(order.status || 'pending');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = {
    completed: 'border-green-500/50 text-green-600',
    processing: 'border-blue-500/50 text-blue-600',
    cancelled: 'border-red-500/50 text-red-600',
    pending: 'border-yellow-500/50 text-yellow-700',
  };

  return (
    <TableRow className="border-border hover:bg-muted/50 transition-colors">
      <TableCell className="font-body text-sm">
        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell className="font-body">
        <div className="flex flex-col">
          <span className="font-medium">{order.customer_name || 'Anonymous'}</span>
          <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
        </div>
      </TableCell>
      <TableCell className="font-body font-semibold">{order.total_price} ₾</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <select
            value={rowStatus}
            onChange={(e) => setRowStatus(e.target.value as Order['status'])}
            className={`text-xs font-body rounded-sm border bg-background px-2 py-1 focus:ring-1 focus:ring-primary outline-none transition-colors ${statusColor[rowStatus]}`}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {rowStatus !== order.status && (
            <Button
              size="sm"
              className="h-7 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-none"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '...' : 'Save'}
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-background overflow-hidden">
            <DialogHeader>
              <DialogTitle className="font-display">
                Order #{order.id?.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mb-1">Customer</p>
                  <p className="font-semibold">{order.customer_name || 'N/A'}</p>
                  <p>{order.customer_phone}</p>
                  <p className="mt-1 text-muted-foreground">{order.customer_address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mb-1">Summary</p>
                  <p>Total: <span className="font-bold">{order.total_price} ₾</span></p>
                  <p>Date: {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</p>
                  <div className="mt-3">
                    <Badge
                      variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'outline'}
                      className={`capitalize ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : order.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}`}
                    >
                      {order.status || 'pending'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest mb-4">Order Items</p>
                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border/30">
                      <div className="h-20 w-20 flex-shrink-0 bg-secondary rounded-md overflow-hidden border border-border/50">
                        {item.products?.image_url ? (
                          <img src={item.products.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-medium truncate">
                          {item.products?.name_ka || item.products?.name_en || 'Product'}
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          {item.quantity} × {item.price_at_time} ₾
                        </p>
                      </div>
                      <p className="font-display font-semibold">
                        {(item.quantity * item.price_at_time).toFixed(2)} ₾
                      </p>
                    </div>
                  ))}
                  {!order.order_items?.length && (
                    <p className="text-sm text-muted-foreground text-center py-6">No items.</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
};

export default OrderRow;
