import { Bell, User } from 'lucide-react';
import ecxoLogo from '@/assets/ecxo-logo.png';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComplianceStore } from '@/store/complianceStore';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const items = useComplianceStore(s => s.items);
  const overdueCount = items.filter(i => i.status === 'Overdue').length;
  const dueSoonCount = items.filter(i => i.status === 'Due Soon').length;
  const alertCount = overdueCount + dueSoonCount;

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div>
          <h2 className="text-sm font-semibold text-foreground leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <img src={ecxoLogo} alt="deriskadvisory logo" className="h-6 w-6 rounded-full" />
          <span className="font-medium">deriskadvisory</span>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground">
              {alertCount}
            </Badge>
          )}
        </Button>

        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
