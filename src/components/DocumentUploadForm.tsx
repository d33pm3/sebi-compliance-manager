import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileUp, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useComplianceStore } from '@/store/complianceStore';
import { VaultDocument } from '@/data/vaultData';
import { toTitleCaseLabel } from '@/lib/chartTheme';

const FISCAL_YEARS = ['FY2025-26', 'FY2024-25'];
const DOC_TYPES = ['Filing', 'Report', 'Disclosure', 'Statement', 'Certificate', 'Board Minutes', 'Notice Response', 'Supporting Evidence'];

export function DocumentUploadForm() {
  const items = useComplianceStore(s => s.items);
  const uploadDocuments = useComplianceStore(s => s.uploadDocuments);
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [itemId, setItemId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState('Filing');
  const [fiscalYear, setFiscalYear] = useState('FY2025-26');
  const [uploadedBy, setUploadedBy] = useState('');
  const [docStatus, setDocStatus] = useState<'Uploaded' | 'Filed'>('Uploaded');
  const [remarks, setRemarks] = useState('');
  const [dragging, setDragging] = useState(false);

  const sortedItems = useMemo(
    () => [...items]
      .filter(i => !search || `${i.filingName} ${i.regReference} ${i.category}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.filingName.localeCompare(b.filingName))
      .slice(0, 60),
    [items, search],
  );

  const selected = items.find(i => String(i.id) === itemId);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(prev => [...prev, ...Array.from(list)]);
  };

  const reset = () => {
    setFiles([]);
    setRemarks('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = () => {
    if (files.length === 0) {
      toast.error('Choose at least one file to upload');
      return;
    }
    if (!itemId) {
      toast.error('Link the document to an item in the Master Compliance Register');
      return;
    }
    uploadDocuments({
      itemId: Number(itemId),
      section: 'compliance-filings' as VaultDocument['section'],
      documentType,
      fiscalYear,
      uploadedBy: uploadedBy.trim() || 'Compliance Team',
      docStatus,
      remarks,
      files: files.map(f => ({
        name: f.name,
        sizeBytes: f.size,
        extension: (f.name.split('.').pop() || 'FILE').toLowerCase(),
        url: URL.createObjectURL(f),
      })),
    });
    toast.success(`${files.length} document(s) uploaded`, {
      description: `${selected?.filingName} updated in the Master Register${docStatus === 'Filed' ? ' and marked as completed' : ''}. Risk Assessment refreshed.`,
    });
    reset();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileUp className="h-4 w-4 text-primary flex-shrink-0" /> Upload Documents
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Every upload is linked to the Master Compliance Register, so the register, this vault and the Risk Assessment update together.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Drag & drop files or click to browse</p>
          <p className="text-[11px] text-muted-foreground mt-1">Supported: PDF, XLSX, DOCX, PPTX, XML, XBRL, CSV, ZIP</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, idx) => (
              <Badge key={`${f.name}-${idx}`} variant="outline" className="text-[10px] gap-1 h-6 px-2">
                <span className="truncate max-w-[180px]">{f.name}</span>
                <span className="text-muted-foreground flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  className="flex-shrink-0 hover:text-destructive"
                  onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px]">Link To Master Compliance Register</Label>
            <Input
              placeholder="Search the register by filing name, category or regulation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a compliance item" /></SelectTrigger>
              <SelectContent>
                {sortedItems.map(i => (
                  <SelectItem key={i.id} value={String(i.id)} className="text-xs">
                    {i.filingName} — {i.regReference}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Link2 className="h-3 w-3 flex-shrink-0" />
                {toTitleCaseLabel(selected.category)} · Due {selected.dueDate} · Owner {selected.owner}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Fiscal Year</Label>
            <Select value={fiscalYear} onValueChange={setFiscalYear}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FISCAL_YEARS.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Uploaded By</Label>
            <Input value={uploadedBy} onChange={e => setUploadedBy(e.target.value)} placeholder="Your name" className="h-8 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px]">Status Update To Master Register</Label>
            <Select value={docStatus} onValueChange={v => setDocStatus(v as 'Uploaded' | 'Filed')}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Uploaded" className="text-xs">Evidence Uploaded — Pending Approval</SelectItem>
                <SelectItem value="Filed" className="text-xs">Filed — Mark Compliance Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px]">Remarks</Label>
            <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional note recorded against the compliance item" className="text-xs min-h-[60px]" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset} disabled={files.length === 0}>Clear</Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={submit}>
            <Upload className="h-3.5 w-3.5 flex-shrink-0" /> Upload To Vault
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
