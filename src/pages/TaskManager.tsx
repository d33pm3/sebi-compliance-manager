import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskStatus } from '@/data/workflowData';
import { TASK_TILE_COLORS, toTitleCaseLabel } from '@/lib/chartTheme';
import { taskStatusForItem } from '@/data/workflowData';
import { CheckCircle2, CircleDot, Clock, FileSpreadsheet, ListTodo, Plus, ShieldAlert, Trash2, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const badge = 'inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[80px] h-5 px-2.5 leading-none';

const statusStyle: Record<TaskStatus, string> = {
  Open: 'bg-muted text-muted-foreground',
  'In Progress': 'bg-secondary text-secondary-foreground',
  Blocked: 'bg-destructive text-destructive-foreground',
  Done: 'bg-success text-success-foreground',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`${badge} ${statusStyle[status]}`}>{status}</span>;
}

const owners = ['Priya Sharma (CS)', 'Rajesh Kumar (CFO)', 'Anita Desai (Legal)', 'Vikram Singh (Compliance)', 'Neha Patel (Finance)', 'Amit Joshi (Secretarial)'];

export default function TaskManager() {
  const { items, tasks, addTask, updateTaskStatus, deleteTask } = useComplianceStore();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState(params.get('item') ?? 'all');
  const [pastOnly, setPastOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const registerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ itemId: '', title: '', owner: owners[0], deadline: new Date().toISOString().split('T')[0] });

  const itemById = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const today = new Date().toISOString().split('T')[0];

  const rows = useMemo(() => tasks.filter(t => {
    const item = itemById.get(t.itemId);
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
    if (itemFilter !== 'all' && String(t.itemId) !== itemFilter) return false;
    if (pastOnly && !(t.status !== 'Done' && t.deadline < today)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(item?.filingName.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [tasks, statusFilter, ownerFilter, itemFilter, search, itemById, pastOnly, today]);

  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(t => t.status === 'Open').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    blocked: tasks.filter(t => t.status === 'Blocked').length,
    overdue: tasks.filter(t => t.status !== 'Done' && t.deadline < today).length,
    done: tasks.filter(t => t.status === 'Done').length,
  }), [tasks, today]);

  /* ------------------------------------------------------------------ */
  /* Reconciliation against the Master Compliance Register.              */
  /* Every master item mirrors exactly one task, so the two sides must   */
  /* agree line for line. Manually added tasks are shown separately.     */
  /* ------------------------------------------------------------------ */
  const reconciliation = useMemo(() => {
    const mirrored = tasks.filter(t => t.id === `T-${t.itemId}`);
    const extra = tasks.length - mirrored.length;
    const buckets: Record<string, { master: number; tasks: number; taskStatus: string }> = {};
    items.forEach(i => {
      const ts = taskStatusForItem(i);
      buckets[i.status] = buckets[i.status] ?? { master: 0, tasks: 0, taskStatus: ts };
      buckets[i.status].master += 1;
    });
    items.forEach(i => {
      const t = tasks.find(x => x.id === `T-${i.id}`);
      if (t) buckets[i.status].tasks += 1;
    });
    return {
      masterCount: items.length,
      mirroredCount: mirrored.length,
      extra,
      rows: Object.entries(buckets).map(([status, v]) => ({ status, ...v })),
      balanced: mirrored.length === items.length,
    };
  }, [items, tasks]);

  const scrollToRegister = () => setTimeout(() => registerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const drillTo = (status: string, past = false) => {
    setSearch('');
    setOwnerFilter('all');
    setItemFilter('all');
    setStatusFilter(status);
    setPastOnly(past);
    scrollToRegister();
  };

  const activeDrill = pastOnly ? 'Past Deadline' : statusFilter !== 'all' ? statusFilter : null;

  const exportXlsx = () => {
    import('xlsx').then(XLSX => {
      const data = [
        ['Task ID', 'Compliance Item', 'Category', 'Task', 'Owner', 'Deadline', 'Status', 'Overdue'],
        ...rows.map(t => {
          const item = itemById.get(t.itemId);
          return [t.id, item?.filingName ?? '—', item?.category ?? '—', t.title, t.owner, t.deadline, t.status, t.status !== 'Done' && t.deadline < today ? 'Yes' : 'No'];
        }),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 18 }, { wch: 45 }, { wch: 25 }, { wch: 40 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Compliance Tasks');
      XLSX.writeFile(wb, 'Compliance_Task_List.xlsx');
      toast.success('Downloaded Compliance_Task_List.xlsx');
    });
  };

  const handleAdd = () => {
    if (!form.itemId || !form.title.trim()) {
      toast.error('Pick a compliance item and enter a task');
      return;
    }
    addTask(Number(form.itemId), { title: form.title.trim(), owner: form.owner, deadline: form.deadline });
    toast.success('Task added');
    setDialogOpen(false);
    setForm({ ...form, title: '' });
  };

  return (
    <AppLayout title="Task Manager" subtitle="Module 9 — Compliance To-Do Lists, Owners & Deadlines">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatTile icon={<ListTodo className="h-4 w-4" />} label="Total Tasks" value={stats.total} tile={TASK_TILE_COLORS.total} active={!activeDrill} onClick={() => drillTo('all')} />
          <StatTile icon={<CircleDot className="h-4 w-4" />} label="Open" value={stats.open} tile={TASK_TILE_COLORS.open} active={activeDrill === 'Open'} onClick={() => drillTo('Open')} />
          <StatTile icon={<Clock className="h-4 w-4" />} label="In Progress" value={stats.inProgress} tile={TASK_TILE_COLORS.inProgress} active={activeDrill === 'In Progress'} onClick={() => drillTo('In Progress')} />
          <StatTile icon={<ShieldAlert className="h-4 w-4" />} label="Blocked" value={stats.blocked} tile={TASK_TILE_COLORS.blocked} active={activeDrill === 'Blocked'} onClick={() => drillTo('Blocked')} />
          <StatTile icon={<ShieldAlert className="h-4 w-4" />} label="Past Deadline" value={stats.overdue} tile={TASK_TILE_COLORS.pastDeadline} active={activeDrill === 'Past Deadline'} onClick={() => drillTo('all', true)} />
          <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Done" value={stats.done} tile={TASK_TILE_COLORS.done} active={activeDrill === 'Done'} onClick={() => drillTo('Done')} />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm font-semibold">Reconciliation With The Master Compliance Register</CardTitle>
              <span className={`${badge} ${reconciliation.balanced ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'} min-w-[120px]`}>
                {reconciliation.balanced ? 'Reconciled' : 'Out Of Balance'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              One task mirrors every master entry — {reconciliation.mirroredCount} of {reconciliation.masterCount} master items
              {reconciliation.extra > 0 ? `, plus ${reconciliation.extra} task(s) added manually` : ''}. Total {stats.total}.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Master Status</TableHead>
                    <TableHead className="text-[10px]">Master Items</TableHead>
                    <TableHead className="text-[10px]">Mirrored Tasks</TableHead>
                    <TableHead className="text-[10px]">Task Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliation.rows.map(r => (
                    <TableRow key={r.status} className="hover:bg-muted/40 cursor-pointer" onClick={() => drillTo(r.taskStatus)}>
                      <TableCell className="text-xs font-medium">{toTitleCaseLabel(r.status)}</TableCell>
                      <TableCell className="text-xs">{r.master}</TableCell>
                      <TableCell className={`text-xs ${r.master === r.tasks ? '' : 'text-destructive font-semibold'}`}>{r.tasks}</TableCell>
                      <TableCell><TaskStatusBadge status={r.taskStatus as TaskStatus} /></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell className="text-xs">Total</TableCell>
                    <TableCell className="text-xs">{reconciliation.masterCount}</TableCell>
                    <TableCell className="text-xs">{reconciliation.mirroredCount}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{reconciliation.extra > 0 ? `+${reconciliation.extra} Added Manually` : 'Exact Match'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card ref={registerRef} className="scroll-mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-sm font-semibold">Compliance Task List</CardTitle>
                  {activeDrill && (
                    <button onClick={() => drillTo('all')} className="text-[10px] rounded-full bg-secondary/15 text-secondary px-2 py-0.5 hover:bg-secondary/25">
                      Showing: {activeDrill} ✕
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">{rows.length} of {tasks.length} tasks — every task is linked to an item in the Master Compliance Register</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs pl-8 w-44" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                {itemFilter !== 'all' && (
                  <Button variant="ghost" size="sm" className="h-8 text-[10px]" onClick={() => setItemFilter('all')}>Clear Item Filter</Button>
                )}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs gap-1.5"><Plus className="h-3.5 w-3.5 flex-shrink-0" /> Add Task</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="text-sm">Add a Compliance Task</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Compliance Item</Label>
                        <Select value={form.itemId} onValueChange={v => setForm({ ...form, itemId: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a filing" /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {items.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.sNo}. {i.filingName.slice(0, 60)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Task</Label>
                        <Input className="h-8 text-xs" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Collect board minutes" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Owner</Label>
                          <Select value={form.owner} onValueChange={v => setForm({ ...form, owner: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Deadline</Label>
                          <Input type="date" className="h-8 text-xs" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter><Button size="sm" className="text-xs" onClick={handleAdd}>Add Task</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportXlsx}>
                  <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" /> Export .xlsx
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[560px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Task</TableHead>
                    <TableHead className="text-[10px]">Compliance Item</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                    <TableHead className="text-[10px]">Deadline</TableHead>
                    <TableHead className="text-[10px]">Days Left</TableHead>

                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Update</TableHead>
                    <TableHead className="text-[10px] w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-xs text-muted-foreground text-center py-6">No tasks match the current filters.</TableCell></TableRow>
                  ) : rows.map(t => {
                    const item = itemById.get(t.itemId);
                    const late = t.status !== 'Done' && t.deadline < today;
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/40">
                        <TableCell className="text-xs font-medium max-w-[240px]">{t.title}</TableCell>
                        <TableCell className="text-[11px] max-w-[220px] truncate">
                          {item ? (
                            <Link to={`/compliance/${item.id}`} className="text-secondary hover:underline" title={item.filingName}>{item.filingName}</Link>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{t.owner}</TableCell>
                        <TableCell className={`text-xs ${late ? 'text-destructive font-semibold' : ''}`}>{t.deadline}</TableCell>
                        <TableCell className={`text-[11px] whitespace-nowrap ${late ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {(() => {
                            const days = Math.ceil((new Date(t.deadline).getTime() - new Date(today).getTime()) / 86400000);
                            if (t.status === 'Done') return '—';
                            if (days < 0) return `${Math.abs(days)} Days Overdue`;
                            return days === 0 ? 'Due Today' : `${days} Days Left`;
                          })()}
                        </TableCell>

                        <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                        <TableCell>
                          <Select value={t.status} onValueChange={v => { updateTaskStatus(t.id, v as TaskStatus); toast.success('Task updated'); }}>
                            <SelectTrigger className="h-7 text-[10px] w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Blocked">Blocked</SelectItem>
                              <SelectItem value="Done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Delete task" onClick={() => { deleteTask(t.id); toast.success('Task removed'); }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatTile({ icon, label, value, tile, active, onClick }: { icon: React.ReactNode; label: string; value: number; tile: { bg: string; fg: string }; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: tile.bg, color: tile.fg }}
      className={`rounded-lg p-3 flex items-center gap-3 text-left transition-transform hover:-translate-y-0.5 hover:shadow-md ${active ? 'ring-2 ring-offset-1 ring-secondary' : ''}`}
    >
      <div className="flex-shrink-0 opacity-80">{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-[10px] mt-1 truncate opacity-85">{label}</p>
      </div>
    </button>
  );
}
