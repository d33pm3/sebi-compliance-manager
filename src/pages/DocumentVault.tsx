import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { vaultCategories, VaultDocument } from '@/data/vaultData';
import { useComplianceStore } from '@/store/complianceStore';
import { Search, Download, Mail, FileText, AlertTriangle, BookOpen, Bot, Eye, ChevronLeft, ChevronRight, FolderArchive, ShieldAlert, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { downloadDocumentPlaceholder } from '@/lib/downloadUtils';
import { StatTile } from '@/components/StatTile';
import { STAT_COLORS } from '@/lib/chartTheme';
import { ComplianceItem } from '@/data/complianceData';
import { resolveVaultDoc } from '@/data/workflowData';
import { DocumentUploadForm } from '@/components/DocumentUploadForm';
import { agentOutputKindFromTitle, agentOutputKinds, agentOutputSpecs, buildAgentOutput } from '@/data/agentOutputs';


export default function DocumentVault() {
  const vaultDocuments = useComplianceStore(s => s.vaultDocs);
  const items = useComplianceStore(s => s.items);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('all');
  const [category, setCategory] = useState('all');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = useMemo(() => {
    return vaultDocuments.filter(doc => {
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) && !doc.vaultId.toLowerCase().includes(search.toLowerCase())) return false;
      if (section !== 'all' && doc.section !== section) return false;
      if (category !== 'all' && doc.category !== category) return false;
      if (year !== 'all' && doc.fiscalYear !== year) return false;
      return true;
    });
  }, [vaultDocuments, search, section, category, year]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  /* ---------------------------------------------------------------- */
  /* Everything below is resolved against the Master Compliance        */
  /* Register through one shared helper, so a single master update      */
  /* flows through the Vault, the Notices and the Risk Assessment.      */
  /* ---------------------------------------------------------------- */

  const resolve = (doc: VaultDocument) => resolveVaultDoc(doc, items);

  /** The compliance item in the master that this document belongs to */
  const linkedItem = (doc: VaultDocument): ComplianceItem | undefined => resolve(doc).item;

  /** Risk of a vault document, always derived from the master */
  const docRisk = (doc: VaultDocument): { level: 'High' | 'Critical' | 'Medium' | 'Low' | null; reason: string } => {
    const r = resolve(doc);
    return { level: r.riskLevel, reason: r.riskReason };
  };


  const sectionIcon = (s: string) => {
    switch (s) {
      case 'compliance-filings': return <FileText className="h-3.5 w-3.5" />;
      case 'sebi-notices': return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'regulatory-docs': return <BookOpen className="h-3.5 w-3.5" />;
      case 'agent-outputs': return <Bot className="h-3.5 w-3.5" />;
      default: return <FolderArchive className="h-3.5 w-3.5" />;
    }
  };

  const badgeBase = 'inline-flex items-center justify-center rounded-full border text-[10px] font-semibold whitespace-nowrap h-5 min-w-[76px] px-2 leading-none';

  const statusColor = (status?: string) => {
    switch (status) {
      case 'Pending': return 'bg-warning text-warning-foreground border-warning';
      case 'Responded': return 'bg-success text-success-foreground border-success';
      case 'Closed': return 'bg-muted text-muted-foreground border-border';
      case 'Uploaded': return 'bg-secondary text-secondary-foreground border-secondary';
      case 'Filed': return 'bg-success text-success-foreground border-success';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const sectionCounts = useMemo(() => ({
    all: vaultDocuments.length,
    'compliance-filings': vaultDocuments.filter(d => d.section === 'compliance-filings').length,
    'sebi-notices': vaultDocuments.filter(d => d.section === 'sebi-notices').length,
    'regulatory-docs': vaultDocuments.filter(d => d.section === 'regulatory-docs').length,
    'agent-outputs': vaultDocuments.filter(d => d.section === 'agent-outputs').length,
  }), [vaultDocuments]);

  const handleAction = (action: string, doc: VaultDocument) => {
    if (action === 'Download') {
      if (doc.fileUrl) {
        const a = document.createElement('a');
        a.href = doc.fileUrl;
        a.download = doc.fileName || doc.title;
        a.click();
        toast.success(`Downloaded: ${doc.fileName || doc.title}`);
        return;
      }
      downloadDocumentPlaceholder(doc.title, doc.vaultId);
      toast.success(`Downloaded: ${doc.title}`);
    } else {
      toast.success(`${action}: ${doc.title}`, { description: `Vault ID: ${doc.vaultId}` });
    }
  };

  /** Row click: notices open their notice page, agent outputs open their deliverable, everything else opens the master item */
  const openDoc = (doc: VaultDocument) => {
    if (doc.section === 'sebi-notices') {
      navigate(`/notices/${doc.id}`);
      return;
    }
    if (doc.section === 'agent-outputs') {
      navigate(`/agent-outputs/${agentOutputKindFromTitle(doc.title)}`);
      return;
    }
    const item = linkedItem(doc);
    if (item) navigate(`/compliance/${item.id}`);
    else toast.info('No linked item in the Master Compliance Register for this document');
  };

  return (
    <AppLayout title="Documentation Vault" subtitle="Module 4 — Compliance Document Repository">
      <div className="space-y-4">
        {/* Stats — palette shared with the Risk Assessment module */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'All Documents', count: sectionCounts.all, icon: <FolderArchive className="h-4 w-4" />, key: 'all', bg: STAT_COLORS.total },
            { label: 'Filings', count: sectionCounts['compliance-filings'], icon: <FileText className="h-4 w-4" />, key: 'compliance-filings', bg: STAT_COLORS.completed },
            { label: 'Notices', count: sectionCounts['sebi-notices'], icon: <AlertTriangle className="h-4 w-4" />, key: 'sebi-notices', bg: STAT_COLORS.overdue },
            { label: 'Regulatory', count: sectionCounts['regulatory-docs'], icon: <BookOpen className="h-4 w-4" />, key: 'regulatory-docs', bg: STAT_COLORS.inProgress },
            { label: 'Agent Outputs', count: sectionCounts['agent-outputs'], icon: <Bot className="h-4 w-4" />, key: 'agent-outputs', bg: STAT_COLORS.upcoming },
          ].map(s => (
            <StatTile
              key={s.key}
              icon={s.icon}
              label={s.label}
              value={s.count}
              bg={s.bg}
              active={section === s.key}
              title={`Show ${s.label} in the Document Register`}
              onClick={() => { setSection(s.key); setPage(0); }}
            />
          ))}
        </div>


        {/* Agent deliverables — live extracts of the Master Compliance Register */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-secondary" /> Agent Deliverables
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Each deliverable is rebuilt live from the Master Compliance Register — open one to see every row and export it.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {agentOutputKinds.map(kind => {
                const spec = agentOutputSpecs[kind];
                const count = buildAgentOutput(kind, items).rows.length;
                return (
                  <Link
                    key={kind}
                    to={`/agent-outputs/${kind}`}
                    className="rounded-lg border p-3 hover:bg-muted/50 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-primary">{spec.title}</p>
                      <span className="text-[10px] font-semibold rounded-full border bg-secondary/15 text-secondary border-secondary/40 h-5 min-w-[52px] px-2 inline-flex items-center justify-center whitespace-nowrap leading-none flex-shrink-0">
                        {count} Rows
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{spec.description}</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upload Form — writes back to the Master Compliance Register */}
        <DocumentUploadForm />


        {/* Filters + Document Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Document Register</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search documents..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="h-8 text-xs pl-8 w-44" />
                </div>
                <Select value={category} onValueChange={v => { setCategory(v); setPage(0); }}>
                  <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {vaultCategories.filter(c => c !== 'All Documents').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={v => { setYear(v); setPage(0); }}>
                  <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="FY2025-26">FY2025-26</SelectItem>
                    <SelectItem value="FY2024-25">FY2024-25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{filtered.length} documents</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-10"></TableHead>
                    <TableHead className="text-[10px]">Vault ID</TableHead>
                    <TableHead className="text-[10px]">Title</TableHead>
                    <TableHead className="text-[10px] hidden 2xl:table-cell">Category</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-[10px] hidden xl:table-cell">Type</TableHead>
                    <TableHead className="text-[10px]">Linked Compliance</TableHead>
                    <TableHead className="text-[10px]">Risk</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(doc => {
                    const res = resolve(doc);
                    const item = res.item;
                    const risk = { level: res.riskLevel, reason: res.riskReason };
                    return (
                    <TableRow key={doc.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDoc(doc)}>
                      <TableCell>{sectionIcon(doc.section)}</TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground whitespace-nowrap max-w-[130px] truncate">{doc.vaultId}</TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate text-primary hover:underline">{doc.title}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden 2xl:table-cell max-w-[120px] truncate">{res.category}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell whitespace-nowrap">{doc.uploadedAt}</TableCell>
                      <TableCell className="hidden xl:table-cell"><Badge variant="outline" className="text-[10px]">{doc.fileType}</Badge></TableCell>
                      <TableCell className="text-[11px] max-w-[150px]">
                        {item ? (
                          <Link
                            to={`/compliance/${item.id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                            title={item.filingName}
                          >
                            <span className="truncate max-w-[110px]">{item.filingName}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        ) : <span className="text-muted-foreground">{doc.regulation}</span>}
                      </TableCell>
                      <TableCell>
                        {risk.level ? (
                          <Link
                            to="/risk-assessment"
                            onClick={e => e.stopPropagation()}
                            className={`${badgeBase} bg-destructive/20 text-destructive border-destructive/40 gap-1 hover:bg-destructive/30`}
                            title={`${risk.level} Risk — ${risk.reason}. Open the Risk Assessment module.`}
                          >
                            <ShieldAlert className="h-3 w-3 flex-shrink-0" />
                            {risk.reason}
                          </Link>
                        ) : (
                          <span className={`${badgeBase} bg-muted text-muted-foreground border-border`}>No Risk</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.status
                          ? <span className={`${badgeBase} ${statusColor(doc.status)}`}>{doc.status}</span>
                          : res.state
                            ? <span className={`${badgeBase} bg-muted text-muted-foreground border-border`}>{res.state}</span>
                            : <span className="text-[11px] text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="View Details" onClick={() => openDoc(doc)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Download" onClick={() => handleAction('Download', doc)}><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Email" onClick={() => handleAction('Email', doc)}><Mail className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>

              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-[11px] text-muted-foreground">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEBI Notices Section - always visible */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> SEBI Notices & Inquiries
              </CardTitle>
              <Link to="/response-tracker">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" /> Open Response Tracker
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Notice No.</TableHead>
                    <TableHead className="text-[10px]">Subject</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">From</TableHead>
                    <TableHead className="text-[10px]">Response Due</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Risk</TableHead>
                    <TableHead className="text-[10px]">Linked Compliance</TableHead>
                    <TableHead className="text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaultDocuments.filter(d => d.section === 'sebi-notices').map(doc => {
                    const item = linkedItem(doc);
                    const risk = docRisk(doc);
                    return (
                    <TableRow key={doc.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/notices/${doc.id}`)}>
                      <TableCell className="text-[11px] font-mono text-primary hover:underline">{doc.noticeNo}</TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">{doc.title}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{doc.issuedBy}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{doc.responseDue}</TableCell>
                      <TableCell><span className={`${badgeBase} ${statusColor(doc.status)}`}>{doc.status}</span></TableCell>
                      <TableCell>
                        {risk.level ? (
                          <Link
                            to="/risk-assessment"
                            onClick={e => e.stopPropagation()}
                            className={`${badgeBase} bg-destructive/20 text-destructive border-destructive/40 gap-1 hover:bg-destructive/30`}
                            title={`${risk.level} Risk — ${risk.reason}. Open the Risk Assessment module.`}
                          >
                            <ShieldAlert className="h-3 w-3 flex-shrink-0" />
                            {risk.reason}
                          </Link>
                        ) : (
                          <span className={`${badgeBase} bg-muted text-muted-foreground border-border`}>No Risk</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px]">
                        {item ? (
                          <Link to={`/compliance/${item.id}`} onClick={e => e.stopPropagation()} className="text-primary hover:underline inline-flex items-center gap-1" title={item.filingName}>
                            <span className="truncate max-w-[110px]">{item.filingName}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        ) : <span className="text-muted-foreground">{doc.regulation}</span>}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="View Notice" onClick={() => navigate(`/notices/${doc.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Download" onClick={() => handleAction('Download', doc)}><Download className="h-3.5 w-3.5" /></Button>
                        </div>
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
