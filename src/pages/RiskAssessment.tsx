import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { buildNoticeRisks, buildOverdueTaskRisks, effectiveRiskLevel, riskReasons } from '@/data/workflowData';
import { CHART_COLORS, COMPARISON_COLORS, RISK_TILE_COLORS, STAT_COLORS, toTitleCaseLabel } from '@/lib/chartTheme';
import { StatTile } from '@/components/StatTile';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ComplianceDetailDrawer } from '@/components/ComplianceDetailDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, RiskBadge, ApprovalBadge } from '@/components/StatusBadges';
import { categories, ComplianceItem, RiskLevel, ApprovalStatus } from '@/data/complianceData';
import { Search, RotateCcw, CheckCircle2, XCircle, RotateCw, Upload, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, FileWarning, Clock, CircleDot, FileSpreadsheet, AlertTriangle, X, ExternalLink, ShieldQuestion } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

function exportRiskItemsToXlsx(title: string, riskItems: ComplianceItem[], flag: string) {
  import('xlsx').then((XLSX) => {
    const wsData = [
      ['#', 'Filing Name', 'Category', 'Risk Level', 'Flag', 'Status', 'Due Date', 'Owner', 'Approval Status', 'Regulation', 'Frequency'],
      ...riskItems.map(item => [
        item.sNo, item.filingName, item.category, 'High', flag,
        item.status, item.dueDate, item.owner, item.approvalStatus,
        item.regReference, item.frequency,
      ]),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 45 }, { wch: 25 }, { wch: 10 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    const fileName = `${title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Downloaded ${fileName}`);
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function RiskAssessment() {
  const navigate = useNavigate();
  const { items, filters, setFilter, resetFilters, selectItem, filteredItems, updateApprovalStatus, toggleEvidence, notices, tasks } = useComplianceStore();
  const filtered = filteredItems();

  const overdueTaskRisks = useMemo(() => buildOverdueTaskRisks(tasks, items), [tasks, items]);

  const exportOverdueTaskRisks = () => {
    import('xlsx').then(XLSX => {
      const wsData = [
        ['Task ID', 'Task', 'Compliance Item', 'Category', 'Risk Level', 'Flag', 'Task Status', 'Deadline', 'Days Overdue', 'Owner'],
        ...overdueTaskRisks.map(r => [r.taskId, r.title, r.filingName, r.category, r.riskLevel, 'Task Overdue', r.status, r.deadline, Math.abs(r.daysLeft), r.owner]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 45 }, { wch: 25 }, { wch: 11 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 13 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Overdue Task Risks');
      XLSX.writeFile(wb, 'Overdue_Task_High_Risks.xlsx');
      toast.success('Downloaded Overdue_Task_High_Risks.xlsx');
    });
  };

  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('all');
  const perPage = 12;

  const registerRef = useRef<HTMLDivElement>(null);
  const scrollToRegister = () => {
    requestAnimationFrame(() => registerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  /* Deep link from the Response Tracker: /risk-assessment?noticeRisk=<RISK-ID>
     scrolls to the notice risk table and highlights that exact row. The id is
     derived from the notice number, so it stays valid as notices change. */
  const noticeRiskSectionRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedNoticeRisk = searchParams.get('noticeRisk');
  useEffect(() => {
    if (!focusedNoticeRisk) return;
    const t = window.setTimeout(() => {
      noticeRiskSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [focusedNoticeRisk]);

  /* Deep link from the Risk Action Plan: /risk-assessment?level=Critical
     applies the matching risk-level drill-down and scrolls to the register. */
  const linkedLevel = searchParams.get('level');
  useEffect(() => {
    if (!linkedLevel || !['Critical', 'High', 'Medium', 'Low'].includes(linkedLevel)) return;
    drillTo('riskLevel', linkedLevel);
    const next = new URLSearchParams(searchParams);
    next.delete('level');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedLevel]);

  /* One-click drill-down: every number on this page lands on the matching rows of
     the Master Compliance Register, read live from the shared compliance store. */
  const drillTo = (key: 'approvalStatus' | 'status' | 'riskLevel', value: string) => {
    resetFilters();
    setTab('all');
    if (value) setFilter(key, value);
    setPage(0);
    scrollToRegister();
  };

  const activeDrill = filters.approvalStatus
    ? `Approval: ${filters.approvalStatus}`
    : filters.status
      ? `Status: ${filters.status}`
      : filters.riskLevel
        ? `Risk: ${filters.riskLevel}`
        : filters.category
          ? `Category: ${toTitleCaseLabel(filters.category)}`
          : '';

  // Overdue items automatically become High Risk
  const overdueRisks = useMemo(() =>
    items.filter(i => i.status === 'Overdue'),
  [items]);

  const docMissingRisks = useMemo(() =>
    items.filter(i => i.approvalStatus === 'Doc Missing'),
  [items]);

  const summaryStats = useMemo(() => ({
    approved: items.filter(i => i.approvalStatus === 'Approved').length,
    pending: items.filter(i => i.approvalStatus === 'Pending').length,
    docMissing: items.filter(i => i.approvalStatus === 'Doc Missing').length,
    overdue: overdueRisks.length,
    notStarted: items.filter(i => i.approvalStatus === 'Not Started').length,
  }), [items, overdueRisks]);

  const riskStats = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    items.forEach(i => { counts[effectiveRiskLevel(i)] = (counts[effectiveRiskLevel(i)] || 0) + 1; });
    return counts;
  }, [items]);

  const tabFiltered = useMemo(() => {
    if (tab === 'my-queue') return filtered.filter(i => i.owner.includes('Priya') || i.owner.includes('Rajesh'));
    if (tab === 'pending-approval') return filtered.filter(i => i.approvalStatus === 'Pending');
    return filtered;
  }, [filtered, tab]);

  const paged = tabFiltered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(tabFiltered.length / perPage);

  const execSummary = useMemo(() => {
    const catMap: Record<string, { total: number; completed: number; nonCompliant: number }> = {};
    items.forEach(i => {
      if (!catMap[i.category]) catMap[i.category] = { total: 0, completed: 0, nonCompliant: 0 };
      catMap[i.category].total++;
      if (i.status === 'Completed') catMap[i.category].completed++;
      if (i.status === 'Overdue' || i.approvalStatus === 'Doc Missing') catMap[i.category].nonCompliant++;
    });
    return Object.entries(catMap)
      .map(([name, d]) => {
        const label = toTitleCaseLabel(name);
        return {
          name: label.length > 20 ? label.slice(0, 18) + '…' : label,
          completed: d.completed,
          nonCompliant: d.nonCompliant,
          total: d.total,
          completedPct: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
          nonCompliantPct: d.total > 0 ? Math.round((d.nonCompliant / d.total) * 100) : 0,
        };
      })
      .filter(d => d.completed + d.nonCompliant > 0)
      .sort((a, b) => (b.completed + b.nonCompliant) - (a.completed + a.nonCompliant))
      .slice(0, 12);
  }, [items]);

  return (
    <AppLayout title="Risk Assessment" subtitle="Module 3 — Compliance Risk Monitoring & Workflow">
      <div className="space-y-4">
        {/* Summary Status Bar — every tile drills into the Master Compliance Register */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatTile icon={<ShieldCheck className="h-4 w-4" />} label="Approved" value={summaryStats.approved} bg={STAT_COLORS.completed} active={filters.approvalStatus === 'Approved'} onClick={() => drillTo('approvalStatus', 'Approved')} />
          <StatTile icon={<Clock className="h-4 w-4" />} label="Pending" value={summaryStats.pending} bg={STAT_COLORS.inProgress} active={filters.approvalStatus === 'Pending'} onClick={() => drillTo('approvalStatus', 'Pending')} />
          <StatTile icon={<FileWarning className="h-4 w-4" />} label="Doc Missing" value={summaryStats.docMissing} bg={STAT_COLORS.dueSoon} active={filters.approvalStatus === 'Doc Missing'} onClick={() => drillTo('approvalStatus', 'Doc Missing')} />
          <StatTile icon={<ShieldAlert className="h-4 w-4" />} label="Overdue / High Risk" value={summaryStats.overdue} bg={STAT_COLORS.overdue} active={filters.status === 'Overdue'} onClick={() => drillTo('status', 'Overdue')} />
          <StatTile icon={<CircleDot className="h-4 w-4" />} label="Not Started" value={summaryStats.notStarted} bg={STAT_COLORS.notStarted} active={filters.approvalStatus === 'Not Started'} onClick={() => drillTo('approvalStatus', 'Not Started')} />
        </div>

        {/* Risk Level Tiles — click any level to see every item behind that number */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldQuestion className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground">Risk Levels — Click Any Level For The Full List</CardTitle>
              <span className="text-[10px] text-muted-foreground/70 ml-auto">{items.length} items in the Master Compliance Register</span>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Critical', 'High', 'Medium', 'Low'] as RiskLevel[]).map(level => (
                <StatTile
                  key={level}
                  icon={<ShieldAlert className="h-4 w-4" />}
                  label={`${level} Risk`}
                  value={riskStats[level] || 0}
                  bg={RISK_TILE_COLORS[level]}
                  active={filters.riskLevel === level}
                  onClick={() => drillTo('riskLevel', level)}
                  title={`View every ${level} risk item in the Risk Register`}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2.5">
              Overdue filings count as Critical and filings with missing documents count as High, so these numbers always reconcile with the register below.
            </p>
          </CardContent>
        </Card>

        {/* Executive Summary Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground">Executive Summary</CardTitle>
            <p className="text-[10px] text-muted-foreground/70">Completed vs Non-Compliant by Category (% of each category)</p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={execSummary} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                  formatter={(value: string) => <span className="text-muted-foreground ml-1">{value}</span>}
                />
                <Bar dataKey="completed" fill={COMPARISON_COLORS.completed} name="Completed" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  <LabelList dataKey="completedPct" position="top" style={{ fontSize: '9px', fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} formatter={(v: number) => v === 0 ? '' : `${v}%`} />
                </Bar>
                <Bar dataKey="nonCompliant" fill={COMPARISON_COLORS.nonCompliant} name="Non-Compliant" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  <LabelList dataKey="nonCompliantPct" position="top" style={{ fontSize: '9px', fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} formatter={(v: number) => v === 0 ? '' : `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overdue Risks — Real-time from Dashboard */}
        {overdueRisks.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold text-destructive">
                  Open High Risks — Overdue Compliances ({overdueRisks.length})
                </CardTitle>
                <Button variant="outline" size="sm" className="ml-auto text-[10px] h-7 px-2.5 gap-1" onClick={() => exportRiskItemsToXlsx('Overdue_High_Risks', overdueRisks, 'Overdue')}>
                  <FileSpreadsheet className="h-3 w-3" /> Export .xlsx
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Every overdue filing in the Master Compliance Register becomes an open Critical risk here — click a row for the reasons</p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-destructive/20 max-h-[280px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] w-10">#</TableHead>
                      <TableHead className="text-[10px]">Filing Name</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-[10px]">Risk</TableHead>
                      <TableHead className="text-[10px]">Due Date</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Owner</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Approval</TableHead>
                      <TableHead className="text-[10px] w-[220px]">Reason</TableHead>
                      <TableHead className="text-[10px] w-16">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueRisks.map(item => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-destructive/5" onClick={() => selectItem(item.id)}>
                        <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{item.filingName}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{toTitleCaseLabel(item.category)}</TableCell>
                        <TableCell><RiskBadge level={effectiveRiskLevel(item)} /></TableCell>
                        <TableCell className="text-xs text-destructive font-semibold whitespace-nowrap">{item.dueDate}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell truncate">{item.owner}</TableCell>
                        <TableCell className="hidden md:table-cell"><ApprovalBadge status={item.approvalStatus} /></TableCell>
                        <TableCell className="text-[10px] text-muted-foreground max-w-[220px] truncate" title={riskReasons(item).join(' · ')}>{riskReasons(item)[0]}</TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Link to={`/compliance/${item.id}`} className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary hover:underline">
                            <ExternalLink className="h-3 w-3 flex-shrink-0" /> Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Doc Missing Risks */}
        {docMissingRisks.length > 0 && (
          <Card className="border-warning/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-semibold text-warning">
                  Open High Risks — Documents Missing ({docMissingRisks.length})
                </CardTitle>
                <Button variant="outline" size="sm" className="ml-auto text-[10px] h-7 px-2.5 gap-1" onClick={() => exportRiskItemsToXlsx('DocMissing_High_Risks', docMissingRisks, 'Doc Missing')}>
                  <FileSpreadsheet className="h-3 w-3" /> Export .xlsx
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Every filing with missing documents becomes an open risk here — click a row for the reasons</p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-warning/20 max-h-[280px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] w-10">#</TableHead>
                      <TableHead className="text-[10px]">Filing Name</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-[10px]">Risk</TableHead>
                      <TableHead className="text-[10px]">Flag</TableHead>
                      <TableHead className="text-[10px]">Due Date</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Owner</TableHead>
                      <TableHead className="text-[10px] w-[220px]">Reason</TableHead>
                      <TableHead className="text-[10px] w-16">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docMissingRisks.map(item => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-warning/5" onClick={() => selectItem(item.id)}>
                        <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{item.filingName}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{toTitleCaseLabel(item.category)}</TableCell>
                        <TableCell><RiskBadge level={effectiveRiskLevel(item)} /></TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning border border-warning/30 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap">
                            <FileWarning className="h-2.5 w-2.5" /> Doc Missing
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium whitespace-nowrap">{item.dueDate}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell truncate">{item.owner}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground max-w-[220px] truncate" title={riskReasons(item).join(' · ')}>{riskReasons(item)[0]}</TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Link to={`/compliance/${item.id}`} className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary hover:underline">
                            <ExternalLink className="h-3 w-3 flex-shrink-0" /> Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEBI Notices — auto-created risk items from the Response Tracker */}
        {(() => {
          const noticeRisks = buildNoticeRisks(notices).filter(r => r.riskStatus !== 'Closed');
          if (noticeRisks.length === 0) return null;
          const exportNoticeRisks = () => {
            import('xlsx').then((XLSX) => {
              const wsData = [
                ['Risk ID', 'Notice No.', 'Subject', 'Source', 'Regulation', 'Risk Level', 'Risk Status', 'Response Status', 'Deadline', 'Days To Deadline', 'Owner'],
                ...noticeRisks.map(r => [r.id, r.noticeNo, r.subject, r.source, r.regulation, r.riskLevel, r.riskStatus, r.responseStatus, r.deadline, r.daysToDeadline, r.owner]),
              ];
              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.aoa_to_sheet(wsData);
              ws['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 50 }, { wch: 10 }, { wch: 14 }, { wch: 11 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 22 }];
              XLSX.utils.book_append_sheet(wb, ws, 'Notice Risks');
              XLSX.writeFile(wb, 'SEBI_Notice_Risk_Items.xlsx');
              toast.success('Downloaded SEBI_Notice_Risk_Items.xlsx');
            });
          };
          return (
            <Card ref={noticeRiskSectionRef} className="border-destructive/30 scroll-mt-4">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm font-semibold text-destructive">
                    Open High Risks — SEBI Notices & Inquiries ({noticeRisks.length})
                  </CardTitle>
                  <Link to="/response-tracker" className="text-[10px] font-medium text-secondary hover:underline">Open Response Tracker</Link>
                  <Button variant="outline" size="sm" className="ml-auto text-[10px] h-7 px-2.5 gap-1" onClick={exportNoticeRisks}>
                    <FileSpreadsheet className="h-3 w-3 flex-shrink-0" /> Export .xlsx
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Each notice in the Response Tracker automatically creates a risk item here with its own status and deadline</p>
                {focusedNoticeRisk && (
                  <button
                    type="button"
                    onClick={() => { const next = new URLSearchParams(searchParams); next.delete('noticeRisk'); setSearchParams(next, { replace: true }); }}
                    className="mt-1 inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 text-primary text-[10px] font-medium px-2.5 py-1 hover:bg-primary/20"
                  >
                    Highlighted: {focusedNoticeRisk} <X className="h-3 w-3" />
                  </button>
                )}
                {focusedNoticeRisk && !noticeRisks.some(r => r.id === focusedNoticeRisk) && (
                  <p className="text-[10px] text-muted-foreground">That notice risk is now closed, so it no longer appears in the open list.</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-destructive/20 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Notice No.</TableHead>
                        <TableHead className="text-[10px]">Subject</TableHead>
                        <TableHead className="text-[10px] hidden md:table-cell">Source</TableHead>
                        <TableHead className="text-[10px]">Risk</TableHead>
                        <TableHead className="text-[10px]">Risk Status</TableHead>
                        <TableHead className="text-[10px]">Response</TableHead>
                        <TableHead className="text-[10px]">Deadline</TableHead>
                        <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                        <TableHead className="text-[10px]">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noticeRisks.map(r => (
                        <TableRow
                          key={r.id}
                          id={r.id}
                          className={`hover:bg-destructive/5 cursor-pointer ${focusedNoticeRisk === r.id ? 'bg-secondary/15 ring-2 ring-secondary/50' : ''}`}
                          onClick={() => navigate(`/notices/${r.noticeId}`)}
                        >
                          <TableCell className="text-[11px] font-mono">{r.noticeNo}</TableCell>
                          <TableCell className="text-xs font-medium max-w-[220px] truncate" title={r.subject}>{r.subject}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{r.source}</TableCell>
                          <TableCell><RiskBadge level={r.riskLevel} /></TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[76px] h-5 px-2.5 leading-none ${r.riskStatus === 'Open' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>{r.riskStatus}</span>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{r.responseStatus}</TableCell>
                          <TableCell className={`text-xs font-semibold ${r.daysToDeadline < 0 ? 'text-destructive' : ''}`}>
                            {r.deadline}
                            <span className="block text-[10px] font-normal text-muted-foreground">
                              {r.daysToDeadline < 0 ? `${Math.abs(r.daysToDeadline)} days overdue` : `${r.daysToDeadline} days left`}
                            </span>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{r.owner}</TableCell>
                          <TableCell>
                            <Link to={`/notices/${r.noticeId}`} onClick={e => e.stopPropagation()} className="text-[10px] font-medium text-secondary hover:underline">View Notice</Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Open High Risks — Overdue Tasks */}
        {overdueTaskRisks.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold text-destructive">
                  Open High Risks — Overdue Tasks ({overdueTaskRisks.length})
                </CardTitle>
                <Link to="/tasks" className="text-[10px] font-medium text-secondary hover:underline">Open Task Manager</Link>
                <Button variant="outline" size="sm" className="ml-auto text-[10px] h-7 px-2.5 gap-1" onClick={exportOverdueTaskRisks}>
                  <FileSpreadsheet className="h-3 w-3 flex-shrink-0" /> Export .xlsx
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Every task past its deadline in the Task Manager appears here as an open high risk with days left</p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-destructive/20 overflow-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Task</TableHead>
                      <TableHead className="text-[10px]">Compliance Item</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-[10px]">Risk</TableHead>
                      <TableHead className="text-[10px]">Task Status</TableHead>
                      <TableHead className="text-[10px]">Deadline</TableHead>
                      <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueTaskRisks.map(r => (
                      <TableRow key={r.taskId} className="hover:bg-destructive/5">
                        <TableCell className="text-xs font-medium max-w-[220px]">{r.title}</TableCell>
                        <TableCell className="text-[11px] max-w-[200px] truncate">
                          <Link to={`/compliance/${r.itemId}`} className="text-secondary hover:underline" title={r.filingName}>{r.filingName}</Link>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{toTitleCaseLabel(r.category)}</TableCell>
                        <TableCell><RiskBadge level={r.riskLevel} /></TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[76px] h-5 px-2.5 leading-none bg-destructive text-destructive-foreground">{r.status}</span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-destructive">
                          {r.deadline}
                          <span className="block text-[10px] font-normal text-muted-foreground">{Math.abs(r.daysLeft)} days overdue</span>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{r.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Risk Register — the single view of the Master Compliance Register */}
        <Card ref={registerRef} className="scroll-mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-semibold">Risk Register</CardTitle>
                {activeDrill && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
                    title="Clear this filter"
                  >
                    {activeDrill} <X className="h-2.5 w-2.5 flex-shrink-0" />
                  </button>
                )}
                <span className="text-[10px] text-muted-foreground">{tabFiltered.length} of {items.length} items</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={filters.search}
                    onChange={e => setFilter('search', e.target.value)}
                    className="h-8 text-xs pl-8 w-40"
                  />
                </div>
                <Select value={filters.category || 'all'} onValueChange={v => setFilter('category', v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.riskLevel || 'all'} onValueChange={v => setFilter('riskLevel', v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue placeholder="Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetFilters}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={v => { setTab(v); setPage(0); }}>
              <TabsList className="mb-3">
                <TabsTrigger value="all" className="text-xs">All Items ({filtered.length})</TabsTrigger>
                <TabsTrigger value="my-queue" className="text-xs">My Queue</TabsTrigger>
                <TabsTrigger value="pending-approval" className="text-xs">Pending Approval</TabsTrigger>
              </TabsList>

              <TabsContent value={tab}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-[10px]">#</TableHead>
                        <TableHead className="text-[10px]">Filing Name</TableHead>
                        <TableHead className="text-[10px] hidden md:table-cell">Category</TableHead>
                        <TableHead className="text-[10px]">Risk</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                        <TableHead className="text-[10px] hidden md:table-cell">Approval</TableHead>
                        <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                        <TableHead className="text-[10px] hidden lg:table-cell">Evidence</TableHead>
                        <TableHead className="text-[10px]">Detail</TableHead>
                        <TableHead className="text-[10px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map(item => (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectItem(item.id)}>
                          <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                          <TableCell className="text-xs font-medium max-w-[180px] truncate">{item.filingName}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[100px] truncate">{toTitleCaseLabel(item.category)}</TableCell>
                          <TableCell><RiskBadge level={effectiveRiskLevel(item)} /></TableCell>
                          <TableCell><StatusBadge status={item.status} /></TableCell>
                          <TableCell className="hidden md:table-cell"><ApprovalBadge status={item.approvalStatus} /></TableCell>
                          <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell max-w-[100px] truncate">{item.owner}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className={`text-[11px] ${item.evidenceUploaded ? 'text-success' : 'text-destructive'}`}>
                              {item.evidenceUploaded ? '✓' : '✗'}
                            </span>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Link to={`/compliance/${item.id}`} className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary hover:underline">
                              <ExternalLink className="h-3 w-3 flex-shrink-0" /> Open
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              {item.approvalStatus === 'Pending' && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Approve" onClick={() => updateApprovalStatus(item.id, 'Approved')}>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Reject" onClick={() => updateApprovalStatus(item.id, 'Rejected')}>
                                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Send Back" onClick={() => updateApprovalStatus(item.id, 'Doc Missing')}>
                                    <RotateCw className="h-3.5 w-3.5 text-warning" />
                                  </Button>
                                </>
                              )}
                              {!item.evidenceUploaded && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Upload Evidence" onClick={() => toggleEvidence(item.id)}>
                                  <Upload className="h-3.5 w-3.5" />
                                </Button>
                              )}
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
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <ComplianceDetailDrawer />
      </div>
    </AppLayout>
  );
}
