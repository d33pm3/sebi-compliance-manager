import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MasterEntryInput, useComplianceStore } from '@/store/complianceStore';
import { ComplianceItem } from '@/data/complianceData';
import { toTitleCaseLabel } from '@/lib/chartTheme';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const owners = ['Priya Sharma (CS)', 'Rajesh Kumar (CFO)', 'Anita Desai (Legal)', 'Vikram Singh (Compliance)', 'Neha Patel (Finance)', 'Amit Joshi (Secretarial)'];
const approvers = ['Suresh Mehta (Director)', 'Kavita Rao (Audit Chair)', 'Deepak Gupta (MD)', 'Ritu Agarwal (ID)'];
const natures: ComplianceItem['complianceNature'][] = ['[P]', '[E]', '[P+E]', '[A]'];
const tiers: ComplianceItem['obligorTier'][] = ['ALL', 'TOP 1000', 'TOP 500', 'TOP 250', 'TOP 100', 'DEBT-LISTED', 'HVDLE', 'NEWLY-LISTED', 'LARGE-CORPORATE'];
const statuses: ComplianceItem['status'][] = ['Completed', 'Due Soon', 'Overdue', 'Not Due', 'In Progress', 'Not Started'];
const risks: ComplianceItem['riskLevel'][] = ['Critical', 'High', 'Medium', 'Low'];
const approvalStatuses: ComplianceItem['approvalStatus'][] = ['Approved', 'Pending', 'Doc Missing', 'Rejected', 'Not Started'];
const frequencies = ['Quarterly', 'Annual', 'Half-Yearly', 'Monthly', 'Event-based', 'One-time', 'Continuous'];

const emptyForm = (categories: string[]): MasterEntryInput => ({
  category: categories[0] ?? 'FINANCIAL RESULTS',
  filingName: '',
  regReference: '',
  trigger: '',
  timeline: '',
  dueDate: new Date().toISOString().split('T')[0],
  frequency: 'Quarterly',
  filingAuthority: 'NSE / BSE',
  applicableTo: 'All equity-listed entities',
  format: '',
  penalty: '',
  sourceUrl: 'https://www.sebi.gov.in',
  complianceNature: '[P]',
  obligorTier: 'ALL',
  status: 'Not Started',
  riskLevel: 'Medium',
  approvalStatus: 'Not Started',
  owner: owners[0],
  approver: approvers[0],
});

const toForm = (i: ComplianceItem): MasterEntryInput => ({
  category: i.category,
  filingName: i.filingName,
  regReference: i.regReference,
  trigger: i.trigger,
  timeline: i.timeline,
  dueDate: i.dueDate,
  frequency: i.frequency,
  filingAuthority: i.filingAuthority,
  applicableTo: i.applicableTo,
  format: i.format,
  penalty: i.penalty,
  sourceUrl: i.sourceUrl,
  complianceNature: i.complianceNature,
  obligorTier: i.obligorTier,
  status: i.status,
  riskLevel: i.riskLevel,
  approvalStatus: i.approvalStatus,
  owner: i.owner,
  approver: i.approver,
});

export default function RegisterManager() {
  const { items, addItem, updateItem, deleteItem } = useComplianceStore();
  const navigate = useNavigate();
  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<MasterEntryInput>(() => emptyForm([]));
  const [page, setPage] = useState(0);
  const perPage = 12;

  const filtered = useMemo(() => items.filter(i => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.filingName.toLowerCase().includes(q) || i.regReference.toLowerCase().includes(q) || i.trigger.toLowerCase().includes(q);
    }
    return true;
  }), [items, search, categoryFilter]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const set = <K extends keyof MasterEntryInput>(key: K, value: MasterEntryInput[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm(categories));
    setOpen(true);
  };

  const openEdit = (item: ComplianceItem) => {
    setEditId(item.id);
    setForm(toForm(item));
    setOpen(true);
  };

  const save = () => {
    if (!form.filingName.trim()) { toast.error('Filing name is required'); return; }
    if (!form.regReference.trim()) { toast.error('Regulation reference is required'); return; }
    if (!form.dueDate) { toast.error('A deadline is required'); return; }
    if (editId != null) {
      updateItem(editId, form);
      toast.success('Master Compliance Register entry updated', { description: 'Dashboard, risk lists, calendar and vault now reflect the change.' });
    } else {
      const id = addItem(form);
      toast.success('Entry added to the Master Compliance Register', { description: 'Open its full detail page to add tasks, filings and documents.' });
      setTimeout(() => navigate(`/compliance/${id}`), 400);
    }
    setOpen(false);
  };

  const remove = (item: ComplianceItem) => {
    deleteItem(item.id);
    toast.success(`Removed "${item.filingName}" from the Master Compliance Register`);
  };

  return (
    <AppLayout title="Register Editor" subtitle="Add and edit Master Compliance Register entries">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">Master Compliance Register — {items.length} Entries</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">Every change here flows through to the Dashboard, Risk Assessment, Calendar, Vault and Task lists.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search entries..." className="h-8 text-xs pl-8 w-44" />
                </div>
                <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(0); }}>
                  <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{toTitleCaseLabel(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNew}>
                  <Plus className="h-3.5 w-3.5 flex-shrink-0" /> Add Entry
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">S.No</TableHead>
                    <TableHead className="text-[10px]">Filing Name</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Category</TableHead>
                    <TableHead className="text-[10px]">Regulation</TableHead>
                    <TableHead className="text-[10px] hidden xl:table-cell">Trigger Event</TableHead>
                    <TableHead className="text-[10px]">Deadline</TableHead>
                    <TableHead className="text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(i => (
                    <TableRow key={i.id} className="hover:bg-muted/50">
                      <TableCell className="text-[11px] text-muted-foreground">{i.sNo}</TableCell>
                      <TableCell className="text-xs font-medium max-w-[260px]">
                        <Link to={`/compliance/${i.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                          <span className="truncate max-w-[230px]">{i.filingName}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell max-w-[150px] truncate">{toTitleCaseLabel(i.category)}</TableCell>
                      <TableCell className="text-[11px] max-w-[160px] truncate" title={i.regReference}>{i.regReference}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden xl:table-cell max-w-[200px] truncate" title={i.trigger}>{i.trigger}</TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">{i.dueDate}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit entry" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" title="Delete entry" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-[11px] text-muted-foreground">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">{editId != null ? 'Edit Register Entry' : 'Add Register Entry'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Filing Name</Label>
              <Input className="h-8 text-xs" value={form.filingName} onChange={e => set('filingName', e.target.value)} placeholder="e.g. Quarterly Financial Results" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Input className="h-8 text-xs" value={form.category} onChange={e => set('category', e.target.value)} list="register-categories" />
              <datalist id="register-categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Regulation Reference</Label>
              <Input className="h-8 text-xs" value={form.regReference} onChange={e => set('regReference', e.target.value)} placeholder="e.g. Reg 33(3)(a) LODR 2015" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Trigger Event</Label>
              <Textarea className="text-xs min-h-[56px]" value={form.trigger} onChange={e => set('trigger', e.target.value)} placeholder="What sets this obligation off, e.g. End of each quarter" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Action Required</Label>
              <Textarea className="text-xs min-h-[56px]" value={form.timeline} onChange={e => set('timeline', e.target.value)} placeholder="What must be done and by when, e.g. File within 45 days of quarter end" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deadline</Label>
              <Input type="date" className="h-8 text-xs" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frequency</Label>
              <Select value={form.frequency} onValueChange={v => set('frequency', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{frequencies.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Filing Authority</Label>
              <Input className="h-8 text-xs" value={form.filingAuthority} onChange={e => set('filingAuthority', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Applicable To</Label>
              <Input className="h-8 text-xs" value={form.applicableTo} onChange={e => set('applicableTo', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Compliance Nature</Label>
              <Select value={form.complianceNature} onValueChange={v => set('complianceNature', v as ComplianceItem['complianceNature'])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{natures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Obligor Tier</Label>
              <Select value={form.obligorTier} onValueChange={v => set('obligorTier', v as ComplianceItem['obligorTier'])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v as ComplianceItem['status'])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Risk Level</Label>
              <Select value={form.riskLevel} onValueChange={v => set('riskLevel', v as ComplianceItem['riskLevel'])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{risks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Approval Status</Label>
              <Select value={form.approvalStatus} onValueChange={v => set('approvalStatus', v as ComplianceItem['approvalStatus'])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{approvalStatuses.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Owner</Label>
              <Select value={form.owner} onValueChange={v => set('owner', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Approver</Label>
              <Select value={form.approver} onValueChange={v => set('approver', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{approvers.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Format</Label>
              <Input className="h-8 text-xs" value={form.format} onChange={e => set('format', e.target.value)} placeholder="e.g. XBRL + PDF" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Penalty</Label>
              <Input className="h-8 text-xs" value={form.penalty} onChange={e => set('penalty', e.target.value)} placeholder="e.g. Reg 91 LODR fine" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Source URL</Label>
              <Input className="h-8 text-xs" value={form.sourceUrl} onChange={e => set('sourceUrl', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={save}>{editId != null ? 'Save Changes' : 'Add Entry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
