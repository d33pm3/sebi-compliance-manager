import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { materialEvents, type MaterialEvent } from '@/data/materialEventsData';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, AlertTriangle, Clock, Info } from 'lucide-react';

const urgencyConfig = {
  critical: { label: 'Critical', className: 'bg-destructive/15 text-destructive border-destructive/30', icon: Zap },
  high: { label: 'High', className: 'bg-warning/15 text-warning border-warning/30', icon: AlertTriangle },
  medium: { label: 'Medium', className: 'bg-primary/15 text-primary border-primary/30', icon: Clock },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border', icon: Info },
};

export function MaterialEventsSection() {
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (urgencyFilter === 'all') return materialEvents;
    return materialEvents.filter(e => e.urgency === urgencyFilter);
  }, [urgencyFilter]);

  const counts = useMemo(() => ({
    critical: materialEvents.filter(e => e.urgency === 'critical').length,
    high: materialEvents.filter(e => e.urgency === 'high').length,
    medium: materialEvents.filter(e => e.urgency === 'medium').length,
    low: materialEvents.filter(e => e.urgency === 'low').length,
  }), []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">Material Events & Compliance Obligations</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {materialEvents.length} event-triggered disclosure requirements — SEBI LODR & allied regulations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {(Object.entries(counts) as [keyof typeof urgencyConfig, number][]).map(([key, count]) => {
                const cfg = urgencyConfig[key];
                return (
                  <Badge key={key} variant="outline" className={`text-[10px] px-1.5 py-0.5 ${cfg.className}`}>
                    {cfg.label}: {count}
                  </Badge>
                );
              })}
            </div>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-[360px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-24 sticky top-0 bg-background">Timeline</TableHead>
                <TableHead className="text-[10px] sticky top-0 bg-background">Disclosure / Obligation</TableHead>
                <TableHead className="text-[10px] hidden md:table-cell sticky top-0 bg-background">Trigger Event</TableHead>
                <TableHead className="text-[10px] hidden lg:table-cell sticky top-0 bg-background">Regulation</TableHead>
                <TableHead className="text-[10px] w-20 sticky top-0 bg-background">Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(event => {
                const cfg = urgencyConfig[event.urgency];
                const Icon = cfg.icon;
                return (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs font-semibold whitespace-nowrap">{event.timeline}</TableCell>
                    <TableCell className="text-xs max-w-[240px]">
                      <div className="font-medium truncate">{event.disclosureName}</div>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                      {event.triggerEvent}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                      {event.regulation}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.className}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
