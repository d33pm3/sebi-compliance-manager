import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useComplianceStore } from '@/store/complianceStore';
import { AgentOutputKind, agentOutputKinds, agentOutputSpecs, buildAgentOutput } from '@/data/agentOutputs';
import { ArrowLeft, Bot, ExternalLink, FileSpreadsheet, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function AgentOutputDetail() {
  const { kind } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const items = useComplianceStore(s => s.items);
  const [search, setSearch] = useState('');

  const activeKind: AgentOutputKind = agentOutputKinds.includes(kind as AgentOutputKind)
    ? (kind as AgentOutputKind)
    : 'register-extract';

  const { spec, rows } = useMemo(() => buildAgentOutput(activeKind, items), [activeKind, items]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => Object.values(r.cells).some(v => v.toLowerCase().includes(q)));
  }, [rows, search]);

  const exportXlsx = () => {
    import('xlsx').then(XLSX => {
      const data = [
        spec.columns.map(c => c.label),
        ...filtered.map(r => spec.columns.map(c => r.cells[c.key] ?? '')),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = spec.columns.map(c => ({ wch: c.width ?? 20 }));
      XLSX.utils.book_append_sheet(wb, ws, spec.title.slice(0, 30));
      const file = `${spec.title.replace(/[^A-Za-z0-9]+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, file);
      toast.success(`Downloaded ${file}`);
    });
  };

  return (
    <AppLayout title="Agent Deliverable" subtitle="Generated live from the Master Compliance Register">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/doc-vault')}>
            <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" /> Back to Document Vault
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            {agentOutputKinds.map(k => (
              <Link key={k} to={`/agent-outputs/${k}`}>
                <Button
                  variant={k === activeKind ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                >
                  {agentOutputSpecs[k].title}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-secondary" /> {spec.title}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">{spec.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rows..." className="h-8 text-xs pl-8 w-44" />
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportXlsx}>
                  <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" /> Export .xlsx
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{filtered.length} of {rows.length} rows · every row links back to its Master Register entry</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {spec.columns.map(c => (
                      <TableHead key={c.key} className="text-[10px] whitespace-nowrap">{c.label}</TableHead>
                    ))}
                    <TableHead className="text-[10px]">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow
                      key={`${r.itemId}-${idx}`}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/compliance/${r.itemId}`)}
                    >
                      {spec.columns.map(c => (
                        <TableCell key={c.key} className="text-[11px] max-w-[240px] truncate" title={r.cells[c.key]}>
                          {r.cells[c.key]}
                        </TableCell>
                      ))}
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Link to={`/compliance/${r.itemId}`} className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]">
                          Detail <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </Link>
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
