import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { ComplianceDetailDrawer } from '@/components/ComplianceDetailDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, RiskBadge, ApprovalBadge } from '@/components/StatusBadges';
import { categories, ComplianceItem, RiskLevel, ApprovalStatus } from '@/data/complianceData';
import { Search, RotateCcw, CheckCircle2, XCircle, RotateCw, Upload, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, FileWarning, Clock, CircleDot } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { useMemo, useState } from 'react';

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
  const { items, filters, setFilter, resetFilters, selectItem, filteredItems, updateApprovalStatus, toggleEvidence } = useComplianceStore();
  const filtered = filteredItems();
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('all');
  const perPage = 12;

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

  const tabFiltered = useMemo(() => {
    if (tab === 'my-queue') return filtered.filter(i => i.owner.includes('Priya') || i.owner.includes('Rajesh'));
    if (tab === 'pending-approval') return filtered.filter(i => i.approvalStatus === 'Pending');
    return filtered;
  }, [filtered, tab]);

  const paged = tabFiltered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(tabFiltered.length / perPage);

  const execSummary = useMemo(() => {
    const catMap: Record<string, { completed: number; nonCompliant: number }> = {};
    items.forEach(i => {
      if (!catMap[i.category]) catMap[i.category] = { completed: 0, nonCompliant: 0 };
      if (i.status === 'Completed') catMap[i.category].completed++;
      else if (i.status === 'Overdue' || i.approvalStatus === 'Doc Missing') catMap[i.category].nonCompliant++;
    });
    return Object.entries(catMap)
      .map(([name, d]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, ...d }))
      .filter(d => d.completed + d.nonCompliant > 0)
      .slice(0, 10);
  }, [items]);

  const totalItemsCount = items.length;

  return (
    <AppLayout title="Risk Assessment" subtitle="Module 3 — Compliance Risk Monitoring & Workflow">
      <div className="space-y-4">
        {/* Summary Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard icon={<ShieldCheck className="h-4 w-4" />} label="Approved" value={summaryStats.approved} color="text-success" />
          <SummaryCard icon={<Clock className="h-4 w-4" />} label="Pending" value={summaryStats.pending} color="text-warning" />
          <SummaryCard icon={<FileWarning className="h-4 w-4" />} label="Doc Missing" value={summaryStats.docMissing} color="text-destructive" />
          <SummaryCard icon={<ShieldAlert className="h-4 w-4" />} label="Overdue / High Risk" value={summaryStats.overdue} color="text-destructive" />
          <SummaryCard icon={<CircleDot className="h-4 w-4" />} label="Not Started" value={summaryStats.notStarted} color="text-muted-foreground" />
        </div>

        {/* Executive Summary Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground">Executive Summary</CardTitle>
            <p className="text-[10px] text-muted-foreground/70">Completed vs Non-Compliant by Category</p>
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
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                  formatter={(value: string) => <span className="text-muted-foreground ml-1">{value}</span>}
                />
                <Bar dataKey="completed" fill="hsl(145, 63%, 62%)" name="Completed" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  <LabelList dataKey="completed" position="top" style={{ fontSize: '9px', fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} formatter={(v: number) => v === 0 ? '' : `${Math.round((v / totalItemsCount) * 100)}%`} />
                </Bar>
                <Bar dataKey="nonCompliant" fill="hsl(350, 80%, 72%)" name="Non-Compliant" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  <LabelList dataKey="nonCompliant" position="top" style={{ fontSize: '9px', fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} formatter={(v: number) => v === 0 ? '' : `${Math.round((v / totalItemsCount) * 100)}%`} />
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
              </div>
              <p className="text-[10px] text-muted-foreground">All overdue compliance items are automatically flagged as High Risk</p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueRisks.map(item => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-destructive/5" onClick={() => selectItem(item.id)}>
                        <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{item.filingName}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{item.category}</TableCell>
                        <TableCell><RiskBadge level="High" /></TableCell>
                        <TableCell className="text-xs text-destructive font-semibold">{item.dueDate}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell truncate">{item.owner}</TableCell>
                        <TableCell className="hidden md:table-cell"><ApprovalBadge status={item.approvalStatus} /></TableCell>
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
              </div>
              <p className="text-[10px] text-muted-foreground">All compliance items with missing documents are automatically flagged as High Risk</p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docMissingRisks.map(item => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-warning/5" onClick={() => selectItem(item.id)}>
                        <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{item.filingName}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{item.category}</TableCell>
                        <TableCell><RiskBadge level="High" /></TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning border border-warning/30 text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap">
                            <FileWarning className="h-2.5 w-2.5" /> Doc Missing
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{item.dueDate}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell truncate">{item.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Risk Register</CardTitle>
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
                        <TableHead className="text-[10px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map(item => (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectItem(item.id)}>
                          <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                          <TableCell className="text-xs font-medium max-w-[180px] truncate">{item.filingName}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[100px] truncate">{item.category}</TableCell>
                          <TableCell><RiskBadge level={(item.status === 'Overdue' || item.approvalStatus === 'Doc Missing') ? 'High' : item.riskLevel} /></TableCell>
                          <TableCell><StatusBadge status={item.status} /></TableCell>
                          <TableCell className="hidden md:table-cell"><ApprovalBadge status={item.approvalStatus} /></TableCell>
                          <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell max-w-[100px] truncate">{item.owner}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className={`text-[11px] ${item.evidenceUploaded ? 'text-success' : 'text-destructive'}`}>
                              {item.evidenceUploaded ? '✓' : '✗'}
                            </span>
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

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
