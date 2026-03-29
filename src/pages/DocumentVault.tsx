import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { vaultDocuments, vaultCategories, VaultDocument } from '@/data/vaultData';
import { Search, Download, Mail, FileText, AlertTriangle, BookOpen, Bot, Upload, Eye, ChevronLeft, ChevronRight, FolderArchive } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

export default function DocumentVault() {
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
  }, [search, section, category, year]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const sectionIcon = (s: string) => {
    switch (s) {
      case 'compliance-filings': return <FileText className="h-3.5 w-3.5" />;
      case 'sebi-notices': return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'regulatory-docs': return <BookOpen className="h-3.5 w-3.5" />;
      case 'agent-outputs': return <Bot className="h-3.5 w-3.5" />;
      default: return <FolderArchive className="h-3.5 w-3.5" />;
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case 'Pending': return 'bg-warning/15 text-warning border-warning/30';
      case 'Responded': return 'bg-success/15 text-success border-success/30';
      case 'Closed': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  const sectionCounts = useMemo(() => ({
    all: vaultDocuments.length,
    'compliance-filings': vaultDocuments.filter(d => d.section === 'compliance-filings').length,
    'sebi-notices': vaultDocuments.filter(d => d.section === 'sebi-notices').length,
    'regulatory-docs': vaultDocuments.filter(d => d.section === 'regulatory-docs').length,
    'agent-outputs': vaultDocuments.filter(d => d.section === 'agent-outputs').length,
  }), []);

  const handleAction = (action: string, doc: VaultDocument) => {
    toast.success(`${action}: ${doc.title}`, { description: `Vault ID: ${doc.vaultId}` });
  };

  return (
    <AppLayout title="Documentation Vault" subtitle="Module 4 — Compliance Document Repository">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'All Documents', count: sectionCounts.all, icon: <FolderArchive className="h-4 w-4" />, key: 'all' },
            { label: 'Filings', count: sectionCounts['compliance-filings'], icon: <FileText className="h-4 w-4" />, key: 'compliance-filings' },
            { label: 'Notices', count: sectionCounts['sebi-notices'], icon: <AlertTriangle className="h-4 w-4" />, key: 'sebi-notices' },
            { label: 'Regulatory', count: sectionCounts['regulatory-docs'], icon: <BookOpen className="h-4 w-4" />, key: 'regulatory-docs' },
            { label: 'Agent Outputs', count: sectionCounts['agent-outputs'], icon: <Bot className="h-4 w-4" />, key: 'agent-outputs' },
          ].map(s => (
            <Card
              key={s.key}
              className={`cursor-pointer transition-all ${section === s.key ? 'border-primary ring-1 ring-primary/20' : 'hover:border-primary/30'}`}
              onClick={() => { setSection(s.key); setPage(0); }}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={section === s.key ? 'text-primary' : 'text-muted-foreground'}>{s.icon}</div>
                <div>
                  <p className={`text-xl font-bold ${section === s.key ? 'text-primary' : 'text-foreground'}`}>{s.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Zone */}
        <Card>
          <CardContent className="p-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info('Upload simulation — no backend connected')}>
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Drag & drop files or click to browse</p>
              <p className="text-[11px] text-muted-foreground mt-1">Supported: PDF, XLSX, DOCX, PPTX, XML, XBRL, CSV, ZIP</p>
            </div>
          </CardContent>
        </Card>

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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-10"></TableHead>
                    <TableHead className="text-[10px]">Vault ID</TableHead>
                    <TableHead className="text-[10px]">Title</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Size</TableHead>
                    {section === 'sebi-notices' && <TableHead className="text-[10px]">Status</TableHead>}
                    <TableHead className="text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(doc => (
                    <TableRow key={doc.id} className="hover:bg-muted/50">
                      <TableCell>{sectionIcon(doc.section)}</TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground">{doc.vaultId.slice(0, 20)}…</TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">{doc.title}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{doc.category}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{doc.uploadedAt}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{doc.fileType}</Badge></TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{doc.fileSize}</TableCell>
                      {section === 'sebi-notices' && (
                        <TableCell>
                          {doc.status && <Badge variant="outline" className={`text-[10px] ${statusColor(doc.status)}`}>{doc.status}</Badge>}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="View" onClick={() => handleAction('View', doc)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Download" onClick={() => handleAction('Download', doc)}><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Email" onClick={() => handleAction('Email', doc)}><Mail className="h-3.5 w-3.5" /></Button>
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
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> SEBI Notices & Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Notice No.</TableHead>
                    <TableHead className="text-[10px]">Subject</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">From</TableHead>
                    <TableHead className="text-[10px]">Response Due</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaultDocuments.filter(d => d.section === 'sebi-notices').map(doc => (
                    <TableRow key={doc.id} className="hover:bg-muted/50">
                      <TableCell className="text-[11px] font-mono">{doc.noticeNo}</TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">{doc.title}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{doc.issuedBy}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{doc.responseDue}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${statusColor(doc.status)}`}>{doc.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAction('View', doc)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAction('Download', doc)}><Download className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
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
