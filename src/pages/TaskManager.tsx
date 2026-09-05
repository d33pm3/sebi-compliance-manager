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
import { CheckCircle2, CircleDot, Clock, FileSpreadsheet, ListTodo, Plus, ShieldAlert, Trash2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ itemId: '', title: '', owner: owners[0], deadline: new Date().toISOString().split('T')[0] });

  const itemById = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const today = new Date().toISOString().split('T')[0];

  const rows = useMemo(() => tasks.filter(t => {
    const item = itemById.get(t.itemId);
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
    if (itemFilter !== 'all' && String(t.itemId) !== itemFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(item?.filingName.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [tasks, statusFilter, ownerFilter, itemFilter, search, itemById]);

  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter(t => t.status === 'Open').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    blocked: tasks.filter(t => t.status === 'Blocked').length,
    overdue: tasks.filter(t => t.status !== 'Done' && t.deadline < today).length,
    done: tasks.filter(t => t.status === 'Done').length,
  }), [tasks, today]);

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
          <Stat icon={<ListTodo className="h-4 w-4" />} label="Total Tasks" value={stats.total} color="text-foreground" />
          <Stat icon={<CircleDot className="h-4 w-4" />} label="Open" value={stats.open} color="text-muted-foreground" />
          <Stat icon={<Clock className="h-4 w-4" />} label="In Progress" value={stats.inProgress} color="text-secondary" />
          <Stat icon={<ShieldAlert className="h-4 w-4" />} label="Blocked" value={stats.blocked} color="text-destructive" />
          <Stat icon={<ShieldAlert className="h-4 w-4" />} label="Past Deadline" value={stats.overdue} color="text-destructive" />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Done" value={stats.done} color="text-success" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">Compliance Task List</CardTitle>
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

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div className="min-w-0">
          <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground mt-1 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
