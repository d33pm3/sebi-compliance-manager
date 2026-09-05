import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { buildNoticeRisks, NoticeResponse } from '@/data/workflowData';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, FileSpreadsheet, FileText, Send, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const badge = 'inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[92px] h-5 px-2.5 leading-none';

function ResponseBadge({ status }: { status: NoticeResponse['responseStatus'] }) {
  const map: Record<NoticeResponse['responseStatus'], string> = {
    'Awaiting Response': 'bg-destructive text-destructive-foreground',
    Drafting: 'bg-warning text-warning-foreground',
    Submitted: 'bg-secondary text-secondary-foreground',
    Closed: 'bg-success text-success-foreground',
  };
  return <span className={`${badge} ${map[status]}`}>{status}</span>;
}

function RiskStatusBadge({ status }: { status: NoticeResponse['riskStatus'] }) {
  const map: Record<NoticeResponse['riskStatus'], string> = {
    Open: 'bg-destructive text-destructive-foreground',
    Mitigating: 'bg-warning text-warning-foreground',
    Closed: 'bg-success text-success-foreground',
  };
  return <span className={`${badge} min-w-[76px] ${map[status]}`}>{status}</span>;
}

export default function ResponseTracker() {
  const { notices, submitNoticeResponse, updateNotice } = useComplianceStore();
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ responseDate: new Date().toISOString().split('T')[0], documents: '', remarks: '' });

  const risks = useMemo(() => buildNoticeRisks(notices), [notices]);
  const visible = filter === 'all' ? notices : notices.filter(n => n.responseStatus === filter);

  const stats = useMemo(() => ({
    total: notices.length,
    awaiting: notices.filter(n => n.responseStatus === 'Awaiting Response').length,
    drafting: notices.filter(n => n.responseStatus === 'Drafting').length,
    submitted: notices.filter(n => n.responseStatus === 'Submitted').length,
    closed: notices.filter(n => n.responseStatus === 'Closed').length,
  }), [notices]);

  const handleSubmit = (notice: NoticeResponse) => {
    const docs = form.documents.split('\n').map(d => d.trim()).filter(Boolean);
    if (docs.length === 0) {
      toast.error('Add at least one submitted document');
      return;
    }
    submitNoticeResponse(notice.noticeId, { responseDate: form.responseDate, documents: docs, remarks: form.remarks });
    toast.success(`Response recorded for ${notice.noticeNo}`);
    setOpen(null);
    setForm({ responseDate: new Date().toISOString().split('T')[0], documents: '', remarks: '' });
  };

  const exportXlsx = () => {
    import('xlsx').then(XLSX => {
      const rows = [
        ['Notice No.', 'Subject', 'Issued By', 'Regulation', 'Received On', 'Response Due', 'Response Status', 'Response Date', 'Documents Submitted', 'Owner', 'Risk Status', 'Remarks'],
        ...notices.map(n => [
          n.noticeNo, n.subject, n.issuedBy, n.regulation, n.receivedOn, n.responseDue,
          n.responseStatus, n.responseDate ?? '—', n.submittedDocuments.join('; ') || '—',
          n.owner, n.riskStatus, n.remarks,
        ]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 22 }, { wch: 50 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 45 }, { wch: 22 }, { wch: 12 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Response Tracker');
      XLSX.writeFile(wb, 'SEBI_Notice_Response_Tracker.xlsx');
      toast.success('Downloaded SEBI_Notice_Response_Tracker.xlsx');
    });
  };

  return (
    <AppLayout title="Response Tracker" subtitle="Module 8 — SEBI & Exchange Notice Responses">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon={<FileText className="h-4 w-4" />} label="Total Notices" value={stats.total} color="text-foreground" />
          <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Awaiting Response" value={stats.awaiting} color="text-destructive" />
          <Stat icon={<Clock className="h-4 w-4" />} label="Drafting" value={stats.drafting} color="text-warning" />
          <Stat icon={<Send className="h-4 w-4" />} label="Submitted" value={stats.submitted} color="text-secondary" />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Closed" value={stats.closed} color="text-success" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">Notice Response Register</CardTitle>
                <p className="text-[10px] text-muted-foreground">Every notice tracks its response date, submitted documents and status — and feeds the Risk Register automatically</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                    <SelectItem value="Drafting">Drafting</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Link to="/doc-vault">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" /> Back to Document Vault
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportXlsx}>
                  <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" /> Export .xlsx
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Notice No.</TableHead>
                    <TableHead className="text-[10px]">Subject</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Issued By</TableHead>
                    <TableHead className="text-[10px]">Response Due</TableHead>
                    <TableHead className="text-[10px]">Response Date</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Documents</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                    <TableHead className="text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map(n => (
                    <TableRow key={n.noticeId} className="hover:bg-muted/40">
                      <TableCell className="text-[11px] font-mono">
                        <Link to={`/notices/${n.noticeId}`} className="text-secondary hover:underline">{n.noticeNo}</Link>
                      </TableCell>
                      <TableCell className="text-xs font-medium max-w-[240px] truncate" title={n.subject}>{n.subject}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{n.issuedBy}</TableCell>
                      <TableCell className={`text-xs font-semibold ${n.responseStatus === 'Awaiting Response' ? 'text-destructive' : ''}`}>{n.responseDue}</TableCell>
                      <TableCell className="text-xs">{n.responseDate ?? '—'}</TableCell>
                      <TableCell><ResponseBadge status={n.responseStatus} /></TableCell>
                      <TableCell className="text-[10px] text-muted-foreground hidden lg:table-cell max-w-[180px]">
                        {n.submittedDocuments.length === 0 ? '—' : n.submittedDocuments.map(d => <div key={d} className="truncate" title={d}>{d}</div>)}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{n.owner}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog open={open === n.noticeId} onOpenChange={o => setOpen(o ? n.noticeId : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">Record Response</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle className="text-sm">Record Response — {n.noticeNo}</DialogTitle></DialogHeader>
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Response Date</Label>
                                  <Input type="date" className="h-8 text-xs" value={form.responseDate} onChange={e => setForm({ ...form, responseDate: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Submitted Documents (one per line)</Label>
                                  <Textarea className="text-xs min-h-[80px]" placeholder={'Reply letter.pdf\nAnnexure A.pdf'} value={form.documents} onChange={e => setForm({ ...form, documents: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Remarks</Label>
                                  <Textarea className="text-xs min-h-[60px]" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button size="sm" className="text-xs" onClick={() => handleSubmit(n)}>Save Response</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {n.responseStatus === 'Submitted' && (
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-success" onClick={() => { updateNotice(n.noticeId, { responseStatus: 'Closed', riskStatus: 'Closed' }); toast.success(`${n.noticeNo} closed`); }}>
                              Close
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notice → Risk Register link */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold text-destructive">Linked Risk Register Items ({risks.length})</CardTitle>
              <Link to="/risk-assessment" className="ml-auto text-[10px] font-medium text-secondary hover:underline">Open Risk Assessment</Link>
            </div>
            <p className="text-[10px] text-muted-foreground">Every notice automatically creates a risk item with its own status and deadline</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-destructive/20 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Risk ID</TableHead>
                    <TableHead className="text-[10px]">Subject</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Source</TableHead>
                    <TableHead className="text-[10px]">Risk Level</TableHead>
                    <TableHead className="text-[10px]">Risk Status</TableHead>
                    <TableHead className="text-[10px]">Deadline</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Days Left</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map(r => (
                    <TableRow key={r.id} className="hover:bg-destructive/5">
                      <TableCell className="text-[10px] font-mono text-muted-foreground max-w-[160px] truncate">{r.id}</TableCell>
                      <TableCell className="text-xs font-medium max-w-[240px] truncate" title={r.subject}>{r.subject}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{r.source}</TableCell>
                      <TableCell>
                        <span className={`${badge} min-w-[64px] ${r.riskLevel === 'Critical' ? 'bg-destructive text-destructive-foreground' : r.riskLevel === 'High' ? 'bg-warning text-warning-foreground' : r.riskLevel === 'Medium' ? 'bg-secondary text-secondary-foreground' : 'bg-success text-success-foreground'}`}>{r.riskLevel}</span>
                      </TableCell>
                      <TableCell><RiskStatusBadge status={r.riskStatus} /></TableCell>
                      <TableCell className="text-xs font-semibold">{r.deadline}</TableCell>
                      <TableCell className={`text-xs hidden md:table-cell ${r.riskStatus !== 'Closed' && r.daysToDeadline < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {r.riskStatus === 'Closed' ? '—' : r.daysToDeadline < 0 ? `${Math.abs(r.daysToDeadline)} days overdue` : `${r.daysToDeadline} days`}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{r.owner}</TableCell>
                    </TableRow>
                  ))}
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
