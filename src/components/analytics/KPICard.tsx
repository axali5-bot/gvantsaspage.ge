import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}

export const KPICard = ({ label, value, icon: Icon, hint }: KPICardProps) => (
  <div className="border border-border rounded-sm p-5 bg-background">
    <div className="flex items-start justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <Icon size={18} className="text-muted-foreground shrink-0" />
    </div>
    <p className="font-display text-3xl font-light text-foreground mt-2 truncate">{value}</p>
    {hint && (
      <p className="text-[10px] text-muted-foreground/60 mt-1">{hint}</p>
    )}
  </div>
);
