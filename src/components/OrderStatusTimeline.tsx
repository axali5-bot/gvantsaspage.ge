import { Fragment } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OrderStatusTimelineProps {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

const STEPS = ['pending', 'processing', 'completed'] as const;
const STEP_INDEX: Record<string, number> = { pending: 0, processing: 1, completed: 2, cancelled: -1 };

export const OrderStatusTimeline = ({ status }: OrderStatusTimelineProps) => {
  const { t } = useTranslation();
  const isCancelled = status === 'cancelled';
  const current = STEP_INDEX[status] ?? 0;

  return (
    <div className="flex items-start w-full px-2 py-3">
      {STEPS.map((step, idx) => {
        const isCompleted = !isCancelled && idx < current;
        const isActive = !isCancelled && idx === current;
        const isCancelledHere = isCancelled && idx === 0;
        const isGreyedOut = isCancelled && idx > 0;
        const connectorFilled = !isCancelled && current > idx;

        const circleClass = isCompleted
          ? 'bg-rose-300 border-rose-300'
          : isActive
          ? 'bg-rose-500 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
          : isCancelledHere
          ? 'bg-red-500 border-red-500'
          : isGreyedOut
          ? 'bg-white border-rose-100'
          : 'bg-white border-rose-200';

        const labelClass = isCompleted || isActive
          ? 'text-rose-500'
          : isCancelledHere
          ? 'text-red-500 font-medium'
          : isGreyedOut
          ? 'text-muted-foreground/30'
          : 'text-muted-foreground/50';

        const connectorClass = isCancelled
          ? 'bg-red-100'
          : connectorFilled
          ? 'bg-rose-300'
          : 'bg-rose-100';

        return (
          <Fragment key={step}>
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${circleClass}`}>
                {(isCompleted || isActive) && (
                  <Check size={13} className="text-white" strokeWidth={2.5} />
                )}
                {isCancelledHere && (
                  <X size={13} className="text-white" strokeWidth={2.5} />
                )}
              </div>
              <span className={`mt-1.5 text-[9px] font-body text-center leading-tight max-w-[52px] ${labelClass}`}>
                {isCancelledHere ? t('order_status.cancelled') : t(`order_status.${step}`)}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-[1.5px] self-start mt-3.5 mx-1.5 transition-all ${connectorClass}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};
