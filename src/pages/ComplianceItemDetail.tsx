import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, RiskBadge, NatureBadge, ApprovalBadge } from '@/components/StatusBadges';
import { TaskStatusBadge } from '@/pages/TaskManager';
import { ComplianceStatus, ApprovalStatus } from '@/data/complianceData';
import { TaskStatus, deriveComplianceState } from '@/data/workflowData';
import {
  AlertTriangle, ArrowLeft, Building2, Calendar, CheckCircle2, ExternalLink, FileText,
  ListTodo, Plus, Send, Upload, XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const owners = ['Priya Sharma (CS)', 'Rajesh Kumar (CFO)', 'Anita Desai (Legal)', 'Vikram Singh (Compliance)', 'Neha Patel (Finance)', 'Amit Joshi (Secretarial)'];
const approvers = ['Suresh Mehta (Director)', 'Kavita Rao (Audit Chair)', 'Deepak Gupta (MD)', 'Ritu Agarwal (ID)'];

const stateStyle: Record<string, string> = {
  Completed: 'bg-success text-success-foreground',
  Overdue: 'bg-destructive text-destructive-foreground',
  'Documents Missing': 'bg-warning text-warning-foreground',
  'On Track': 'bg-secondary text-secondary-foreground',
};

const toTitleCase = (s: string) => s.toLowerCase().replace(/(?:^|\s|\/|-)\w/g, c => c.toUpperCase());

export default function ComplianceItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    items, filings, tasks, vaultDocs, addComment, submitFiling, approveFiling,
    addTask, updateTaskStatus, updateItemStatus, updateApprovalStatus, toggleEvidence,
  } = useComplianceStore();

  const item = items.find(i => i.id === Number(id));

  const [filingForm, setFilingForm] = useState({
    filingDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    submittedBy: owners[0],
    approver: '',
    documents: '',
    remarks: '',
  });
  const [statusForm, setStatusForm] = useState<{ status: ComplianceStatus; approvalStatus: ApprovalStatus; note: string }>({
    status: item?.status ?? 'Not Started',
    approvalStatus: item?.approvalStatus ?? 'Not Started',
    note: '',
  });
  const [taskForm, setTaskForm] = useState({ title: '', owner: owners[0], deadline: new Date().toISOString().split('T')[0] });
  const [approvalForm, setApprovalForm] = useState({
    approver: approvers[0],
    requestedBy: owners[0],
    dueBy: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    note: '',
    filingId: 'none',
  });
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  const itemApprovals = useMemo(
    () => approvalRequests.filter(a => a.itemId === Number(id)),
    [approvalRequests, id],
  );

  const handleRequestApproval = () => {
    if (!item) return;
    requestApproval(item.id, {
      approver: approvalForm.approver,
      requestedBy: approvalForm.requestedBy,
      dueBy: approvalForm.dueBy,
      note: approvalForm.note.trim(),
      filingId: approvalForm.filingId === 'none' ? null : approvalForm.filingId,
    });
    setApprovalForm({ ...approvalForm, note: '' });
    toast.success(`Approval requested — email sent to ${approverEmail(approvalForm.approver)}`);
  };

  const handleDecision = (requestId: string, approve: boolean) => {
    decideApprovalRequest(requestId, approve, (decisionNotes[requestId] ?? '').trim());
    setDecisionNotes({ ...decisionNotes, [requestId]: '' });
    toast.success(approve ? 'Approved — requester notified by email' : 'Declined — requester notified by email');
  };


  const itemFilings = useMemo(() => filings.filter(f => f.itemId === Number(id)), [filings, id]);
  const itemTasks = useMemo(() => tasks.filter(t => t.itemId === Number(id)), [tasks, id]);
  const itemDocs = useMemo(
    () => vaultDocs.filter(d => itemFilings.some(f => f.vaultId === d.vaultId) || d.regulation === item?.regReference),
    [vaultDocs, itemFilings, item],
  );

  if (!item) {
    return (
      <AppLayout title="Compliance Item" subtitle="Not found">
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          This compliance item could not be found. <Link to="/" className="text-secondary hover:underline">Return to the dashboard</Link>.
        </CardContent></Card>
      </AppLayout>
    );
  }

  const state = deriveComplianceState(item);

  const handleSubmitFiling = () => {
    const docs = filingForm.documents.split('\n').map(d => d.trim()).filter(Boolean);
    if (docs.length === 0) {
      toast.error('List at least one document being filed');
      return;
    }
    submitFiling(item.id, {
      filingDate: filingForm.filingDate,
      referenceNo: filingForm.referenceNo,
      submittedBy: filingForm.submittedBy,
      approver: filingForm.approver || item.approver,
      documents: docs,
      remarks: filingForm.remarks,
    });
    setStatusForm({ status: 'Completed', approvalStatus: 'Pending', note: '' });
    setFilingForm({ ...filingForm, referenceNo: '', documents: '', remarks: '' });
    toast.success('Filing submitted — Register, Risk Assessment and Document Vault updated');
  };

  const handleStatusUpdate = () => {
    updateItemStatus(item.id, statusForm.status);
    updateApprovalStatus(item.id, statusForm.approvalStatus);
    if (statusForm.note.trim()) {
      addComment(item.id, {
        id: String(Date.now()),
        author: 'You',
        text: statusForm.note.trim(),
        timestamp: new Date().toLocaleString(),
      });
    }
    setStatusForm({ ...statusForm, note: '' });
    toast.success('Status updated across all modules');
  };

  return (
    <AppLayout title="Compliance Item Detail" subtitle={`Item #${item.sNo} — ${item.regReference}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" /> Back
          </Button>
          <Link to="/" className="text-[11px] text-secondary hover:underline">Master Compliance Register</Link>
        </div>

        {/* Header summary */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <NatureBadge nature={item.complianceNature} />
              <StatusBadge status={item.status} />
              <RiskBadge level={item.status === 'Overdue' || item.approvalStatus === 'Doc Missing' ? 'High' : item.riskLevel} />
              <ApprovalBadge status={item.approvalStatus} />
              <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[110px] h-5 px-2.5 leading-none ${stateStyle[state]}`}>{state}</span>
            </div>
            <CardTitle className="text-base leading-snug mt-2">{item.filingName}</CardTitle>
            <p className="text-xs text-muted-foreground">{toTitleCase(item.category)}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <Field icon={<FileText className="h-3 w-3" />} label="Regulation" value={item.regReference} />
              <Field icon={<Building2 className="h-3 w-3" />} label="Filing Authority" value={item.filingAuthority} />
              <Field icon={<Calendar className="h-3 w-3" />} label="Frequency" value={item.frequency} />
              <Field icon={<Calendar className="h-3 w-3" />} label="Due Date" value={item.dueDate} />
              <Field label="Owner" value={item.owner} />
              <Field label="Approver" value={item.approver} />
              <Field label="Obligor Tier" value={toTitleCase(item.obligorTier)} />
              <Field label="Evidence" value={item.evidenceUploaded ? 'Uploaded' : 'Missing'} />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="filings" className="text-xs">Filings ({itemFilings.length})</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Documents ({itemDocs.length})</TabsTrigger>
            <TabsTrigger value="approvals" className="text-xs">Approvals</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">To-Do ({itemTasks.length})</TabsTrigger>
            <TabsTrigger value="update" className="text-xs">Status Update</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-3">
            <Card>
              <CardContent className="p-5 space-y-4 text-xs">
                <Block title="Applicable To" body={item.applicableTo} />
                <Separator />
                <Block title="Trigger / Event" body={item.trigger} />
                <Separator />
                <Block title="Timeline" body={item.timeline} />
                <Separator />
                <Block title="Format / Mode" body={item.format} />
                <Separator />
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Penalty</h4>
                  <p className="text-muted-foreground">{item.penalty}</p>
                </div>
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-secondary hover:underline">
                    <ExternalLink className="h-3 w-3" /> View SEBI Source
                  </a>
                )}
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Activity & Comments ({item.comments.length})</h4>
                  {item.comments.length === 0 && <p className="text-muted-foreground">No activity recorded yet.</p>}
                  {item.comments.map(c => (
                    <div key={c.id} className="bg-muted rounded-md p-2">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{c.author}</span>
                        <span className="text-muted-foreground text-[10px]">{c.timestamp}</span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filings */}
          <TabsContent value="filings" className="mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Submit a Filing</CardTitle>
                  <p className="text-[10px] text-muted-foreground">Submitting updates the Compliance Register, Risk Assessment and Document Vault together</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Filing Date</Label>
                      <Input type="date" className="h-8 text-xs" value={filingForm.filingDate} onChange={e => setFilingForm({ ...filingForm, filingDate: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reference No.</Label>
                      <Input className="h-8 text-xs" placeholder="Auto-generated if blank" value={filingForm.referenceNo} onChange={e => setFilingForm({ ...filingForm, referenceNo: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Submitted By</Label>
                      <Select value={filingForm.submittedBy} onValueChange={v => setFilingForm({ ...filingForm, submittedBy: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Approver</Label>
                      <Select value={filingForm.approver} onValueChange={v => setFilingForm({ ...filingForm, approver: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={item.approver} /></SelectTrigger>
                        <SelectContent>{approvers.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Documents Filed (one per line)</Label>
                    <Textarea className="text-xs min-h-[80px]" placeholder={'Q4 Results.pdf\nCEO-CFO Certificate.pdf'} value={filingForm.documents} onChange={e => setFilingForm({ ...filingForm, documents: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Remarks</Label>
                    <Textarea className="text-xs min-h-[60px]" value={filingForm.remarks} onChange={e => setFilingForm({ ...filingForm, remarks: e.target.value })} />
                  </div>
                  <Button size="sm" className="text-xs gap-1.5" onClick={handleSubmitFiling}>
                    <Send className="h-3.5 w-3.5 flex-shrink-0" /> Submit Filing
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Filing History ({itemFilings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemFilings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No filings submitted for this item yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {itemFilings.map(f => (
                        <div key={f.id} className="rounded-md border p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{f.referenceNo}</span>
                            <ApprovalBadge status={f.approvalStatus as ApprovalStatus} />
                          </div>
                          <p className="text-muted-foreground">Filed {f.filingDate} by {f.submittedBy} · Approver {f.approver}</p>
                          <p className="text-muted-foreground">Vault ID: <span className="font-mono">{f.vaultId}</span></p>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {f.documents.map(d => <li key={d}>{d}</li>)}
                          </ul>
                          {f.remarks && <p className="text-muted-foreground italic">{f.remarks}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Linked Documents ({itemDocs.length})</CardTitle>
                  <Link to="/doc-vault" className="ml-auto text-[10px] text-secondary hover:underline">Open Document Vault</Link>
                </div>
              </CardHeader>
              <CardContent>
                {itemDocs.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">No documents linked yet.</p>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { toggleEvidence(item.id); toast.success(item.evidenceUploaded ? 'Evidence flag cleared' : 'Evidence marked as uploaded'); }}>
                      <Upload className="h-3.5 w-3.5 flex-shrink-0" /> {item.evidenceUploaded ? 'Clear Evidence Flag' : 'Mark Evidence Uploaded'}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px]">Vault ID</TableHead>
                          <TableHead className="text-[10px]">Title</TableHead>
                          <TableHead className="text-[10px] hidden md:table-cell">Type</TableHead>
                          <TableHead className="text-[10px]">Uploaded</TableHead>
                          <TableHead className="text-[10px] hidden md:table-cell">Uploaded By</TableHead>
                          <TableHead className="text-[10px] hidden lg:table-cell">Regulation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemDocs.map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="text-[10px] font-mono text-muted-foreground">{d.vaultId}</TableCell>
                            <TableCell className="text-xs font-medium max-w-[240px] truncate" title={d.title}>{d.title}</TableCell>
                            <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{d.documentType}</TableCell>
                            <TableCell className="text-xs">{d.uploadedAt}</TableCell>
                            <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{d.uploadedBy}</TableCell>
                            <TableCell className="text-[10px] text-muted-foreground hidden lg:table-cell">{d.regulation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals */}
          <TabsContent value="approvals" className="mt-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Approval Trail</CardTitle>
                <p className="text-[10px] text-muted-foreground">Current approval status: {item.approvalStatus} · Approver: {item.approver}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Approval request form */}
                <div className="rounded-md border p-3 space-y-3 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Stamp className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                    <p className="text-xs font-semibold">Request An Approval</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Approver</Label>
                      <Select value={approvalForm.approver} onValueChange={v => setApprovalForm({ ...approvalForm, approver: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{approvers.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">{approverEmail(approvalForm.approver)}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Requested By</Label>
                      <Select value={approvalForm.requestedBy} onValueChange={v => setApprovalForm({ ...approvalForm, requestedBy: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Decision Due By</Label>
                      <Input type="date" className="h-8 text-xs" value={approvalForm.dueBy} onChange={e => setApprovalForm({ ...approvalForm, dueBy: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Linked Filing</Label>
                      <Select value={approvalForm.filingId} onValueChange={v => setApprovalForm({ ...approvalForm, filingId: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {itemFilings.map(f => <SelectItem key={f.id} value={f.id}>{f.referenceNo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note To Approver</Label>
                    <Textarea className="text-xs min-h-[60px]" value={approvalForm.note} onChange={e => setApprovalForm({ ...approvalForm, note: e.target.value })} placeholder="Context for the approver..." />
                  </div>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleRequestApproval}>
                    <Send className="h-3.5 w-3.5 flex-shrink-0" /> Send Approval Request
                  </Button>
                </div>

                {/* Approval requests */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Approval Requests ({itemApprovals.length})</p>
                  {itemApprovals.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No approval has been requested yet.</p>
                  ) : itemApprovals.map(a => (
                    <div key={a.id} className="rounded-md border p-3 text-xs space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{a.approver}</p>
                          <p className="text-muted-foreground">
                            Requested {a.requestedOn} by {a.requestedBy} · Due by {a.dueBy}
                            {a.decidedOn ? ` · Decided ${a.decidedOn}` : ''}
                          </p>
                          {a.note && <p className="text-muted-foreground mt-1">Note: {a.note}</p>}
                          {a.decisionNote && <p className="text-muted-foreground mt-1">Remarks: {a.decisionNote}</p>}
                        </div>
                        <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[70px] h-5 px-2.5 leading-none ${a.status === 'Approved' ? 'bg-success text-success-foreground' : a.status === 'Declined' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>
                          {a.status}
                        </span>
                      </div>
                      {a.status === 'Pending' && (
                        <div className="flex flex-wrap items-end gap-2">
                          <Input
                            className="h-7 text-[11px] flex-1 min-w-[180px]"
                            placeholder="Decision remarks (optional)"
                            value={decisionNotes[a.id] ?? ''}
                            onChange={e => setDecisionNotes({ ...decisionNotes, [a.id]: e.target.value })}
                          />
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleDecision(a.id, true)}>
                            <CheckCircle2 className="h-3 w-3 text-success" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleDecision(a.id, false)}>
                            <XCircle className="h-3 w-3 text-destructive" /> Decline
                          </Button>
                        </div>
                      )}
                      <div className="rounded-sm bg-muted/40 p-2 space-y-1">
                        {a.notifications.map(n => (
                          <p key={n.id} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                            <Mail className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span><span className="font-medium">{n.sentAt}</span> — email to {n.to}: {n.subject}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Filing approvals */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Filing Approvals</p>
                  {itemFilings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No filing is awaiting approval. Submit a filing first.</p>
                  ) : itemFilings.map(f => (
                    <div key={f.id} className="rounded-md border p-3 text-xs flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{f.referenceNo}</p>
                        <p className="text-muted-foreground">Filed {f.filingDate} · {f.approver}{f.approvedOn ? ` · Decided ${f.approvedOn}` : ''}</p>
                      </div>
                      <ApprovalBadge status={f.approvalStatus as ApprovalStatus} />
                      {f.approvalStatus === 'Pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { approveFiling(f.id, true); toast.success('Filing approved'); }}>
                            <CheckCircle2 className="h-3 w-3 text-success" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { approveFiling(f.id, false); toast.success('Filing rejected'); }}>
                            <XCircle className="h-3 w-3 text-destructive" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>

            </Card>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="mt-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-secondary" />
                  <CardTitle className="text-sm font-semibold">To-Do List ({itemTasks.length})</CardTitle>
                  <Link to={`/tasks?item=${item.id}`} className="ml-auto text-[10px] text-secondary hover:underline">Open in Task Manager</Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Task</TableHead>
                        <TableHead className="text-[10px]">Owner</TableHead>
                        <TableHead className="text-[10px]">Deadline</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                        <TableHead className="text-[10px]">Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemTasks.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-xs text-muted-foreground text-center py-4">No tasks yet.</TableCell></TableRow>
                      ) : itemTasks.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs font-medium">{t.title}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{t.owner}</TableCell>
                          <TableCell className="text-xs">{t.deadline}</TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">New Task</Label>
                    <Input className="h-8 text-xs" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="e.g. Draft board note" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Owner</Label>
                    <Select value={taskForm.owner} onValueChange={v => setTaskForm({ ...taskForm, owner: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Deadline</Label>
                    <div className="flex gap-1">
                      <Input type="date" className="h-8 text-xs" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                      <Button size="icon" className="h-8 w-8 flex-shrink-0" title="Add task" onClick={() => {
                        if (!taskForm.title.trim()) { toast.error('Enter a task'); return; }
                        addTask(item.id, { title: taskForm.title.trim(), owner: taskForm.owner, deadline: taskForm.deadline });
                        setTaskForm({ ...taskForm, title: '' });
                        toast.success('Task added');
                      }}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status update form */}
          <TabsContent value="update" className="mt-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Status Update</CardTitle>
                <p className="text-[10px] text-muted-foreground">Changes flow straight into the Dashboard filing calendar and the Risk Assessment module</p>
              </CardHeader>
              <CardContent className="space-y-3 max-w-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Compliance Status</Label>
                    <Select value={statusForm.status} onValueChange={v => setStatusForm({ ...statusForm, status: v as ComplianceStatus })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Completed', 'Due Soon', 'Overdue', 'Not Due', 'In Progress', 'Not Started'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Approval Status</Label>
                    <Select value={statusForm.approvalStatus} onValueChange={v => setStatusForm({ ...statusForm, approvalStatus: v as ApprovalStatus })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Approved', 'Pending', 'Doc Missing', 'Rejected', 'Not Started'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Note for the Audit Trail</Label>
                  <Textarea className="text-xs min-h-[70px]" value={statusForm.note} onChange={e => setStatusForm({ ...statusForm, note: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs" onClick={handleStatusUpdate}>Save Status</Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { toggleEvidence(item.id); toast.success(item.evidenceUploaded ? 'Evidence flag cleared' : 'Evidence marked as uploaded'); }}>
                    <Upload className="h-3.5 w-3.5 flex-shrink-0" /> {item.evidenceUploaded ? 'Clear Evidence Flag' : 'Mark Evidence Uploaded'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] tracking-wider">{label}</span>
      </div>
      <p className="font-medium text-foreground text-xs">{value}</p>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h4 className="font-semibold text-foreground">{title}</h4>
      <p className="text-muted-foreground">{body}</p>
    </div>
  );
}
