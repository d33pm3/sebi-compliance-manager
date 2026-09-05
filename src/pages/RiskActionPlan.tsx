import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { StatTile } from '@/components/StatTile';
import { useComplianceStore } from '@/store/complianceStore';
import { ComplianceItem } from '@/data/complianceData';
import { TaskStatus, deriveComplianceState, effectiveRiskLevel, riskReasons } from '@/data/workflowData';
import { RISK_TILE_COLORS, toTitleCaseLabel } from '@/lib/chartTheme';
import { ExternalLink, FileSpreadsheet, Plus, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const badge = 'inline-flex items-center justify-center rounded-full border text-[10px] font-semibold whitespace-nowrap h-5 min-w-[80px] px-2 leading-none';

const riskStyle: Record<string, string> = {
  Critical: 'bg-destructive/15 text-destructive border-destructive/40',
  High: 'bg-warning/15 text-warning border-warning/40',
  Medium: 'bg-secondary/15 text-secondary border-secondary/40',
  Low: 'bg-success/15 text-success border-success/40',
};

const taskStyle: Record<TaskStatus, string> = {
  Done: 'bg-success/15 text-success border-success/40',
  'In Progress': 'bg-secondary/15 text-secondary border-secondary/40',
  Blocked: 'bg-destructive/15 text-destructive border-destructive/40',
  Open: 'bg-muted text-muted-foreground border-border',
};

const owners = ['Priya Sharma (CS)', 'Rajesh Kumar (CFO)', 'Anita Desai (Legal)', 'Vikram Singh (Compliance)', 'Neha Patel (Finance)', 'Amit Joshi (Secretarial)'];
const taskStatuses: TaskStatus[] = ['Open', 'In Progress', 'Blocked', 'Done'];

const daysLeft = (deadline: string) => Math.ceil((new Date(deadline).getTime() - new Date(new Date().toISOString().split('T')[0]).getTime()) / 86400000);

export default function RiskActionPlan() {
  const { items, tasks, addTask, updateTaskStatus } = useComplianceStore();
  const navigate = useNavigate();
  const [planFilter, setPlanFilter] = useState<'all' | 'with' | 'without'>('all');
  const [dialogItem, setDialogItem] = useState<ComplianceItem | null>(null);
  const [form, setForm] = useState({ title: '', owner: owners[0], deadline: new Date().toISOString().split('T')[0] });

  /* Tiles deep-link into the Risk Assessment module, which lists every item
     behind that risk level straight from the Master Compliance Register. */
  const openInRiskAssessment = (level: string) => navigate(`/risk-assessment?level=${level}`);

  /** Every risk row resolves straight from the Master Compliance Register */
  const plans = useMemo(() => items.map(item => {
    const level = effectiveRiskLevel(item);
    const itemTasks = tasks.filter(t => t.itemId === item.id);
    const done = itemTasks.filter(t => t.status === 'Done').length;
    return {
      item,
      level,
      state: deriveComplianceState(item),
      reasons: riskReasons(item),
      tasks: itemTasks,
      done,
      progress: itemTasks.length ? Math.round((done / itemTasks.length) * 100) : 0,
      overdueTasks: itemTasks.filter(t => t.status !== 'Done' && daysLeft(t.deadline) < 0).length,
    };
  }), [items, tasks]);

  const highRisk = useMemo(() => plans
    .filter(p => p.level === 'Critical' || p.level === 'High')
    .sort((a, b) => (a.level === b.level ? a.item.dueDate.localeCompare(b.item.dueDate) : a.level === 'Critical' ? -1 : 1)), [plans]);

  const visible = useMemo(() => plans
    .filter(p => p.level === 'Critical' || p.level === 'High')
    .filter(p => planFilter === 'all' ? true : planFilter === 'with' ? p.tasks.length > 0 : p.tasks.length === 0)
    .sort((a, b) => a.item.dueDate.localeCompare(b.item.dueDate)), [plans, planFilter]);

  const counts = useMemo(() => ({
    Critical: plans.filter(p => p.level === 'Critical').length,
    High: plans.filter(p => p.level === 'High').length,
    Medium: plans.filter(p => p.level === 'Medium').length,
    Low: plans.filter(p => p.level === 'Low').length,
  }), [plans]);

  const coverage = highRisk.length ? Math.round((highRisk.filter(p => p.tasks.length > 0).length / highRisk.length) * 100) : 100;
  const openActions = plans.reduce((n, p) => n + p.tasks.filter(t => t.status !== 'Done').length, 0);
  const overdueActions = plans.reduce((n, p) => n + p.overdueTasks, 0);

  const saveTask = () => {
    if (!dialogItem) return;
    if (!form.title.trim()) { toast.error('Describe the action to be taken'); return; }
    addTask(dialogItem.id, { title: form.title.trim(), owner: form.owner, deadline: form.deadline });
    toast.success('Action added to the plan', { description: `${dialogItem.filingName} — owner ${form.owner}` });
    setDialogItem(null);
    setForm({ title: '', owner: owners[0], deadline: new Date().toISOString().split('T')[0] });
  };

  const exportXlsx = () => {
    import('xlsx').then(XLSX => {
      const rows: (string | number)[][] = [[
        'S.No', 'Filing Name', 'Category', 'Risk Level', 'Reason', 'Compliance Status', 'Due Date',
        'Action', 'Action Owner', 'Action Deadline', 'Action Status', 'Days Left',
      ]];
      visible.forEach((p, idx) => {
        if (!p.tasks.length) {
          rows.push([idx + 1, p.item.filingName, toTitleCaseLabel(p.item.category), p.level, p.reasons[0] ?? '—', p.state, p.item.dueDate, 'No action planned', '—', '—', '—', '—']);
          return;
        }
        p.tasks.forEach(t => rows.push([
          idx + 1, p.item.filingName, toTitleCaseLabel(p.item.category), p.level, p.reasons[0] ?? '—', p.state, p.item.dueDate,
          t.title, t.owner, t.deadline, t.status, daysLeft(t.deadline),
        ]));
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 6 }, { wch: 45 }, { wch: 26 }, { wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 45 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Risk Action Plan');
      XLSX.writeFile(wb, 'Risk_Action_Plan.xlsx');
      toast.success('Downloaded Risk_Action_Plan.xlsx');
    });
  };

  return (
    <AppLayout title="Risk Action Plan" subtitle="Owners, deadlines and status for every high-risk item">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['Critical', 'High', 'Medium', 'Low'] as const).map(level => (
            <StatTile
              key={level}
              icon={<ShieldAlert className="h-4 w-4" />}
              label={`${level} Risk Items`}
              value={counts[level]}
              bg={RISK_TILE_COLORS[level]}
              onClick={() => openInRiskAssessment(level)}
              title={`See every ${level} risk item in Risk Assessment`}
            />
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-[11px] text-muted-foreground">Plan Coverage — High & Critical Risks</p>
              <p className="text-2xl font-bold mt-1">{coverage}%</p>
              <Progress value={coverage} className="h-2 mt-2" />
              <p className="text-[10px] text-muted-foreground mt-1">{highRisk.filter(p => p.tasks.length > 0).length} of {highRisk.length} items have at least one planned action</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-[11px] text-muted-foreground">Open Actions</p>
              <p className="text-2xl font-bold mt-1">{openActions}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Across every risk item in the register</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-[11px] text-muted-foreground">Overdue Actions</p>
              <p className="text-2xl font-bold mt-1 text-destructive">{overdueActions}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Also listed in <Link to="/risk-assessment" className="text-primary hover:underline">Risk Assessment</Link>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Action Plans — {visible.length} {levelFilter === 'all' ? 'High & Critical' : levelFilter} Risk Items
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">Risk levels and reasons are derived from the Master Compliance Register, never entered by hand.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={planFilter} onValueChange={v => setPlanFilter(v as typeof planFilter)}>
                  <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="with">With A Plan</SelectItem>
                    <SelectItem value="without">Without A Plan</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportXlsx}>
                  <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" /> Export .xlsx
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visible.map(p => (
              <div key={p.item.id} className="rounded-lg border p-3">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${badge} ${riskStyle[p.level]}`}>{p.level} Risk</span>
                      <span className={`${badge} min-w-[92px] ${p.state === 'Overdue' ? 'bg-destructive/15 text-destructive border-destructive/40' : p.state === 'Completed' ? 'bg-success/15 text-success border-success/40' : p.state === 'Documents Missing' ? 'bg-warning/15 text-warning border-warning/40' : 'bg-secondary/15 text-secondary border-secondary/40'}`}>{p.state}</span>
                      <span className="text-[11px] text-muted-foreground">Due {p.item.dueDate}</span>
                    </div>
                    <Link to={`/compliance/${p.item.id}`} className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 mt-1.5">
                      {p.item.filingName} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{toTitleCaseLabel(p.item.category)} · {p.item.regReference} · Owner {p.item.owner}</p>
                    {p.reasons.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {p.reasons.map((r, idx) => (
                          <li key={idx} className="text-[11px] text-muted-foreground flex gap-1.5">
                            <span className="text-destructive flex-shrink-0">•</span><span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.tasks.length > 0 && (
                      <div className="w-28">
                        <p className="text-[10px] text-muted-foreground mb-1">{p.done}/{p.tasks.length} Done</p>
                        <Progress value={p.progress} className="h-1.5" />
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => setDialogItem(p.item)}>
                      <Plus className="h-3.5 w-3.5 flex-shrink-0" /> Add Action
                    </Button>
                  </div>
                </div>

                {p.tasks.length > 0 ? (
                  <div className="rounded-md border mt-3 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px]">Action</TableHead>
                          <TableHead className="text-[10px]">Owner</TableHead>
                          <TableHead className="text-[10px]">Deadline</TableHead>
                          <TableHead className="text-[10px]">Days Left</TableHead>
                          <TableHead className="text-[10px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {p.tasks.map(t => {
                          const d = daysLeft(t.deadline);
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="text-xs max-w-[320px]">{t.title}</TableCell>
                              <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">{t.owner}</TableCell>
                              <TableCell className="text-[11px] whitespace-nowrap">{t.deadline}</TableCell>
                              <TableCell className={`text-[11px] font-semibold whitespace-nowrap ${t.status === 'Done' ? 'text-muted-foreground' : d < 0 ? 'text-destructive' : d <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                                {t.status === 'Done' ? '—' : d < 0 ? `${Math.abs(d)} Days Overdue` : `${d} Days`}
                              </TableCell>
                              <TableCell>
                                <Select value={t.status} onValueChange={v => updateTaskStatus(t.id, v as TaskStatus)}>
                                  <SelectTrigger className={`h-6 text-[10px] w-[118px] justify-center ${taskStyle[t.status]}`}><SelectValue /></SelectTrigger>
                                  <SelectContent>{taskStatuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-[11px] text-warning mt-2">No mitigation action planned yet for this risk.</p>
                )}
              </div>
            ))}
            {visible.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No risk items match this filter.</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!dialogItem} onOpenChange={o => !o && setDialogItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Mitigation Action</DialogTitle>
          </DialogHeader>
          <p className="text-[11px] text-muted-foreground -mt-2">{dialogItem?.filingName}</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Action</Label>
              <Input className="h-8 text-xs" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Collect board approval and upload evidence" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Owner</Label>
              <Select value={form.owner} onValueChange={v => setForm(f => ({ ...f, owner: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deadline</Label>
              <Input type="date" className="h-8 text-xs" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDialogItem(null)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={saveTask}>Add Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
