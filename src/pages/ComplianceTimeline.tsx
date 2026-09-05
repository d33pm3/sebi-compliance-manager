import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildItemTimeline, MilestoneKind, TimelineMilestone } from '@/data/workflowData';
import { toTitleCaseLabel } from '@/lib/chartTheme';
import { CalendarClock, CheckCircle2, Circle, FileCheck2, FileText, ListTodo, Search, Stamp, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const kindIcon: Record<MilestoneKind, React.ReactNode> = {
  'Due Date': <CalendarClock className="h-3.5 w-3.5" />,
  Filing: <FileCheck2 className="h-3.5 w-3.5" />,
  Approval: <Stamp className="h-3.5 w-3.5" />,
  Task: <ListTodo className="h-3.5 w-3.5" />,
  Document: <FileText className="h-3.5 w-3.5" />,
  Comment: <Circle className="h-3.5 w-3.5" />,
};

const stateStyle = {
  done: { dot: 'bg-success text-success-foreground', text: 'text-foreground' },
  pending: { dot: 'bg-muted text-muted-foreground', text: 'text-muted-foreground' },
  late: { dot: 'bg-destructive text-destructive-foreground', text: 'text-destructive' },
} as const;

const toTitleCase = toTitleCaseLabel;

export default function ComplianceTimeline() {

  const { items, filings, approvalRequests, tasks } = useComplianceStore();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<number | null>(
    params.get('item') ? Number(params.get('item')) : null,
  );

  const categories = useMemo(
    () => Array.from(new Set(items.map(i => i.category))).sort(),
    [items],
  );

  const visible = useMemo(() => items.filter(i => {
    if (category !== 'all' && i.category !== category) return false;
    if (search && !i.filingName.toLowerCase().includes(search.toLowerCase())
      && !i.regReference.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, category, search]);

  const activeItem = items.find(i => i.id === (selected ?? visible[0]?.id));
  const timeline: TimelineMilestone[] = useMemo(
    () => activeItem ? buildItemTimeline(activeItem, filings, approvalRequests, tasks) : [],
    [activeItem, filings, approvalRequests, tasks],
  );

  return (
    <AppLayout title="Compliance Timeline" subtitle="Module 10 — Dates, Approvals & Milestones For Every Filing">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <Card className="h-fit">
          <CardHeader className="pb-3 space-y-2">
            <CardTitle className="text-sm font-semibold">Filings</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search filings..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs pl-8" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-2">
            <div className="max-h-[560px] overflow-auto space-y-1">
              {visible.map(i => (
                <button
                  key={i.id}
                  onClick={() => setSelected(i.id)}
                  className={`w-full text-left rounded-md px-2.5 py-2 transition-colors ${activeItem?.id === i.id ? 'bg-secondary/15 border border-secondary/40' : 'hover:bg-muted/60 border border-transparent'}`}
                >
                  <p className="text-[11px] font-medium leading-snug line-clamp-2">{i.sNo}. {i.filingName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{i.regReference} · Due {i.dueDate}</p>
                </button>
              ))}
              {visible.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No filings match your search.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold">{activeItem ? activeItem.filingName : 'Select A Filing'}</CardTitle>
                {activeItem && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {toTitleCase(activeItem.category)} · {activeItem.regReference} · {activeItem.frequency} · Owner {activeItem.owner}
                  </p>

                )}
              </div>
              {activeItem && (
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link to={`/compliance/${activeItem.id}`}>Open Full Detail</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No milestones recorded yet for this filing.</p>
            ) : (
              <ol className="relative border-l border-border ml-3 space-y-4">
                {timeline.map(m => {
                  const s = stateStyle[m.state];
                  return (
                    <li key={m.id} className="ml-5">
                      <span className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ${s.dot}`}>
                        {m.state === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : m.state === 'late' ? <TriangleAlert className="h-3.5 w-3.5" /> : kindIcon[m.kind]}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground">{m.date}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 h-5 text-[10px] font-semibold whitespace-nowrap">
                          {kindIcon[m.kind]} {m.kind}
                        </span>
                      </div>
                      <p className={`text-xs font-medium mt-1 ${s.text}`}>{m.title}</p>
                      <p className="text-[10px] text-muted-foreground">{m.detail}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
