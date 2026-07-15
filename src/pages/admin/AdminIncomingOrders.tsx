import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapPin, Phone, User, Package, CheckCheck, Eye, X } from 'lucide-react';
import {
  useIncomingOrders,
  useUpdateOrderStatus,
  IncomingOrder,
} from '@/hooks/useIncomingOrders';

const STATUS_LABEL: Record<IncomingOrder['status'], string> = {
  new: 'ახალი',
  seen: 'ნანახი',
  fulfilled: 'გაგზავნილი',
  cancelled: 'გაუქმებული',
};

const STATUS_STYLE: Record<IncomingOrder['status'], string> = {
  new: 'bg-red-100 text-red-700',
  seen: 'bg-amber-100 text-amber-700',
  fulfilled: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const CARD_BORDER: Record<IncomingOrder['status'], string> = {
  new: 'border-l-4 border-l-red-400',
  seen: 'border-l-4 border-l-amber-400',
  fulfilled: 'border-l-4 border-l-emerald-400',
  cancelled: 'border-l-4 border-l-gray-200',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return 'ახლა';
  if (diff < 3600) return `${Math.floor(diff / 60)} წ. წინ`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} სთ. წინ`;
  return d.toLocaleDateString('ka-GE');
}

function OrderCard({ order }: { order: IncomingOrder }) {
  const update = useUpdateOrderStatus();

  const handle = async (status: IncomingOrder['status']) => {
    try {
      await update.mutateAsync({ id: order.id, status });
    } catch {
      toast.error('სტატუსის შეცვლა ვერ მოხერხდა');
    }
  };

  return (
    <div className={`bg-white border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,.05),0_4px_12px_rgba(0,0,0,.04)] ${CARD_BORDER[order.status]} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
          {order.samkaulebi_order_id && (
            <p className="text-xs text-muted-foreground font-mono">
              #{order.samkaulebi_order_id.slice(0, 8)}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatTime(order.created_at)}
        </span>
      </div>

      {/* Customer info */}
      <div className="space-y-1">
        {order.customer_name && (
          <div className="flex items-center gap-2 text-sm">
            <User size={13} className="text-muted-foreground shrink-0" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
        )}
        {order.customer_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone size={13} className="text-muted-foreground shrink-0" />
            <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
              {order.customer_phone}
            </a>
          </div>
        )}
        {order.customer_address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={13} className="text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-foreground">{order.customer_address}</span>
          </div>
        )}
      </div>

      {/* Items */}
      {order.items.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Package size={11} className="shrink-0" />
                <span>{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-foreground font-medium">×{item.quantity}</span>
                )}
              </div>
              <span>{(item.unit_price * item.quantity).toFixed(2)} ₾</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border">
            <span>სულ</span>
            <span>{order.total_price.toFixed(2)} ₾</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {order.status === 'new' && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            disabled={update.isPending}
            onClick={() => handle('seen')}
          >
            <Eye size={12} className="mr-1" /> ნანახია
          </Button>
        )}
        {(order.status === 'new' || order.status === 'seen') && (
          <Button
            size="sm"
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={update.isPending}
            onClick={() => handle('fulfilled')}
          >
            <CheckCheck size={12} className="mr-1" /> გაგზავნილია
          </Button>
        )}
        {order.status !== 'cancelled' && order.status !== 'fulfilled' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-destructive"
            disabled={update.isPending}
            onClick={() => handle('cancelled')}
          >
            <X size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}

type FilterTab = 'all' | 'new';

export const AdminIncomingOrders = () => {
  const { data: orders = [], isLoading } = useIncomingOrders();
  const [tab, setTab] = useState<FilterTab>('new');

  const newCount = orders.filter((o) => o.status === 'new').length;
  const displayed = tab === 'new' ? orders.filter((o) => o.status === 'new') : orders;

  if (isLoading) return <p className="text-muted-foreground py-8">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl text-stone-800">samkaulebi-ის შეკვეთები</h2>
          {newCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {newCount}
            </span>
          )}
        </div>
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
          {(['new', 'all'] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                tab === t ? 'bg-white shadow-sm text-stone-800 font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t === 'new' ? `ახალი (${newCount})` : `ყველა (${orders.length})`}
            </button>
          ))}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {tab === 'new' ? 'ახალი შეკვეთა არ არის' : 'შეკვეთა არ არის'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminIncomingOrders;
