import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { ComplianceDetailDrawer } from '@/components/ComplianceDetailDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, RiskBadge, NatureBadge } from '@/components/StatusBadges';
import { categories } from '@/data/complianceData';
import { Search, FileText, AlertTriangle, CheckCircle2, Clock, CalendarDays, RotateCcw, ChevronLeft, ChevronRight, FileSpreadsheet, Presentation } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialEventsSection } from '@/components/MaterialEventsSection';
import { MonthlyComplianceCalendar } from '@/components/MonthlyComplianceCalendar';

import { deriveComplianceState } from '@/data/workflowData';
import { Link, useSearchParams } from 'react-router-dom';
import { exportCategoryToXlsx, exportCategoryToPptx } from '@/lib/categoryExportUtils';
import { toast } from 'sonner';
import { CHART_COLORS, RISK_COLORS, STAT_COLORS, toTitleCaseLabel } from '@/lib/chartTheme';
import { StatTile } from '@/components/StatTile';

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

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-xs">
        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.payload.fill }} />
        <span className="text-muted-foreground">{d.name}:</span>
        <span className="font-semibold text-foreground">{d.value}</span>
      </div>
    </div>
  );
};

const CategoryYAxisTick = ({ x, y, payload, textAnchor }: any) => (
  <text x={x} y={y} dy={3} textAnchor={textAnchor} fill="hsl(var(--foreground))" fontSize={9}>
    {payload.value}
  </text>
);

const STATE_STYLE: Record<string, string> = {
  Completed: 'bg-success text-success-foreground',
  Overdue: 'bg-destructive text-destructive-foreground',
  'Documents Missing': 'bg-warning text-warning-foreground',
  'On Track': 'bg-secondary text-secondary-foreground',
};

function ComplianceStateBadge({ state }: { state: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[104px] h-5 px-2.5 leading-none ${STATE_STYLE[state]}`}>
      {state}
    </span>
  );
}

export default function Dashboard() {
  const { items, filters, setFilter, resetFilters, selectItem, filteredItems } = useComplianceStore();
  const filtered = filteredItems();
  const [page, setPage] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const perPage = 15;
  const registerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const scrollToRegister = () => {
    requestAnimationFrame(() => registerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // Deep link: /?state=Overdue (from the KPIs page) filters the register by derived compliance state
  const stateParam = searchParams.get('state');
  useEffect(() => {
    if (!stateParam) return;
    resetFilters();
    setFilter('state', stateParam);
    setPage(0);
    setSearchParams({}, { replace: true });
    scrollToRegister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateParam]);

  // One-click drill-down: any dashboard number lands on the matching rows of the Master Register
  const drillTo = (status: string) => {
    resetFilters();
    if (status) setFilter('status', status);
    setPage(0);
    scrollToRegister();
  };

  const drillToCategory = (category: string) => {
    resetFilters();
    setFilter('category', category);
    setPage(0);
    scrollToRegister();
  };

  const activeDrill = filters.status
    ? filters.status
    : filters.state
      ? filters.state
      : filters.category
        ? toTitleCaseLabel(filters.category)
        : '';

  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter(i => i.status === 'Completed').length,
    dueSoon: items.filter(i => i.status === 'Due Soon').length,
    overdue: items.filter(i => i.status === 'Overdue').length,
    upcoming: items.filter(i => i.status === 'Not Due').length,
  }), [items]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [items]);

  const categoryData = useMemo(() => {
    const formatLabel = toTitleCaseLabel;
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => {
      const formatted = formatLabel(name);
      return { name: formatted, value, fullName: formatted };
    }).sort((a, b) => b.value - a.value);
  }, [items]);

  const monthData = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    return months.map((name, i) => ({
      name,
      count: items.filter(item => {
        const d = new Date(item.dueDate);
        return d.getMonth() === (3 + i) % 12;
      }).length,
    }));
  }, [items]);

  const eventTriggered = useMemo(() => {
    return items
      .filter(i => i.complianceNature === '[E]' || i.complianceNature === '[P+E]')
      .sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return order[a.riskLevel] - order[b.riskLevel];
      })
      .slice(0, 10);
  }, [items]);

  const filingCalendar = useMemo(() => {
    const today = new Date();
    const in15Days = new Date(today);
    in15Days.setDate(today.getDate() + 15);
    return items
      .filter(i => (i.complianceNature === '[P]' || i.complianceNature === '[P+E]'))
      .filter(i => {
        const d = new Date(i.dueDate);
        return (d >= today && d <= in15Days) || i.status === 'Overdue';
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  }, [items]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <AppLayout title="Compliance Dashboard" subtitle="Module 2 — SEBI / NSE / BSE Unified Register">
      <div className="space-y-4">
        {/* Quick Stats — clickable, drill straight into the Master Compliance Register */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatTile icon={<FileText className="h-4 w-4" />} label="Total Items" value={stats.total} bg={STAT_COLORS.total} active={filters.status === ''} onClick={() => drillTo('')} />
          <StatTile icon={<Clock className="h-4 w-4" />} label="Due Soon" value={stats.dueSoon} bg={STAT_COLORS.dueSoon} active={filters.status === 'Due Soon'} onClick={() => drillTo('Due Soon')} />
          <StatTile icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={stats.overdue} bg={STAT_COLORS.overdue} active={filters.status === 'Overdue'} onClick={() => drillTo('Overdue')} />
          <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.completed} bg={STAT_COLORS.completed} active={filters.status === 'Completed'} onClick={() => drillTo('Completed')} />
          <StatTile icon={<CalendarDays className="h-4 w-4" />} label="Upcoming" value={stats.upcoming} bg={STAT_COLORS.upcoming} active={filters.status === 'Not Due'} onClick={() => drillTo('Not Due')} />
        </div>

        {/* Charts Row — Status + Filings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status Breakdown Donut */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground">Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={75}
                    innerRadius={42}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                    label={({ value, cx: cxPos, cy: cyPos, midAngle, outerRadius: oR }) => {
                      const total = statusData.reduce((s, d) => s + d.value, 0);
                      const pct = Math.round((value / total) * 100);
                      if (pct < 3) return null;
                      const RADIAN = Math.PI / 180;
                      const radius = oR + 16;
                      const x = cxPos + radius * Math.cos(-midAngle * RADIAN);
                      const y = cyPos + radius * Math.sin(-midAngle * RADIAN);
                      return <text x={x} y={y} textAnchor={x > cxPos ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '10px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>{pct}%</text>;
                    }}
                    labelLine={false}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || 'hsl(220,8%,46%)'} />
                    ))}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '20px', fontWeight: 700, fill: 'hsl(var(--foreground))' }}>
                    {stats.total}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '9px', fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}>
                    Total
                  </text>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value: string) => {
                      const count = statusData.find(d => d.name === value)?.value ?? 0;
                      return <span className="text-muted-foreground ml-1">{value} <span className="font-semibold text-foreground">({count})</span></span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Filings by Month */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground">Filings by Month</CardTitle>
              <p className="text-[10px] text-muted-foreground/70">Next 6 months outlook</p>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Filings" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: '9px', fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} formatter={(v: number) => { if (v === 0) return ''; const total = monthData.reduce((s, d) => s + d.count, 0); return total > 0 ? `${Math.round((v / total) * 100)}%` : ''; }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Material Events & Compliance Obligations */}
        <MaterialEventsSection />

        {/* By Category */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground">By Category</CardTitle>
            <p className="text-[10px] text-muted-foreground/70">Top 8 categories</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData.slice(0, 8)} layout="vertical" barCategoryGap="18%" margin={{ left: 10, right: 40, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<CategoryYAxisTick />}
                  width={170}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                <Bar dataKey="value" fill="hsl(var(--secondary))" name="Items" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: '9px', fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} formatter={(v: number) => { if (v === 0) return ''; const total = items.length; return total > 0 ? `${Math.round((v / total) * 100)}%` : ''; }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly compliance calendar */}
        <MonthlyComplianceCalendar items={items} />

        {/* Event Trigger Map + Filing Calendar */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Event Trigger Map (by Severity)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-52 overflow-auto">
              {eventTriggered.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1.5 rounded" onClick={() => selectItem(item.id)}>
                  <div className={`h-2 w-2 rounded-full flex-shrink-0`} style={{ backgroundColor: RISK_COLORS[item.riskLevel] }} />
                  <span className="truncate flex-1">{item.filingName}</span>
                  <RiskBadge level={item.riskLevel} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Filing Calendar (Next 15 Days & Overdue)</CardTitle>
              <p className="text-[10px] text-muted-foreground">Each filing shows its compliance state — the same state drives the Risk Assessment module</p>
            </CardHeader>
            <CardContent className="max-h-52 overflow-auto p-0">
              {filingCalendar.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4">No filings due in the next 15 days.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] w-20">Due</TableHead>
                      <TableHead className="text-[10px]">Filing Name</TableHead>
                      <TableHead className="text-[10px] text-right">Compliance State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filingCalendar.map(item => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectItem(item.id)}>
                        <TableCell className="text-[11px] text-muted-foreground">{new Date(item.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</TableCell>
                        <TableCell className="text-xs font-medium max-w-[190px] truncate" title={item.filingName}>{item.filingName}</TableCell>
                        <TableCell className="text-right"><ComplianceStateBadge state={deriveComplianceState(item)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Categories ({categories.length})</CardTitle>
            <p className="text-[10px] text-muted-foreground">Click a category to view its compliance items</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {categories.map(cat => {
                const count = items.filter(i => i.category === cat).length;
                const isActive = expandedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { if (isActive) { setExpandedCategory(null); resetFilters(); } else { setExpandedCategory(cat); drillToCategory(cat); } }}
                    className={`text-left p-2.5 rounded-md border text-xs transition-all ${isActive ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/20' : 'border-border hover:border-primary/30 hover:bg-muted/50'}`}
                  >
                    <div className="font-medium truncate">{toTitleCaseLabel(cat)}</div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">{count} items</div>
                  </button>
                );
              })}
            </div>

            {/* Expanded Category Table */}
            {expandedCategory && (() => {
              const catItems = items.filter(i => i.category === expandedCategory);
              return (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-primary">{toTitleCaseLabel(expandedCategory)} — {catItems.length} Compliance Items</h3>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[10px] h-7 px-2.5 gap-1"
                        onClick={() => drillToCategory(expandedCategory)}
                      >
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        View in Master Register
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-2.5 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportCategoryToXlsx(expandedCategory, catItems);
                          toast.success(`Exported ${toTitleCaseLabel(expandedCategory)} to Excel`);
                        }}
                      >
                        <FileSpreadsheet className="h-3 w-3 flex-shrink-0" />
                        Export .xlsx
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-2.5 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportCategoryToPptx(expandedCategory, catItems);
                          toast.success(`Exported ${toTitleCaseLabel(expandedCategory)} to PowerPoint`);
                        }}
                      >
                        <Presentation className="h-3 w-3 flex-shrink-0" />
                        Export .pptx
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={() => setExpandedCategory(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border max-h-[320px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] w-10">#</TableHead>
                          <TableHead className="text-[10px]">Filing Name</TableHead>
                          <TableHead className="text-[10px] hidden md:table-cell">Nature</TableHead>
                          <TableHead className="text-[10px]">Status</TableHead>
                          <TableHead className="text-[10px] hidden md:table-cell">Risk</TableHead>
                          <TableHead className="text-[10px] hidden lg:table-cell">Due Date</TableHead>
                          <TableHead className="text-[10px] hidden lg:table-cell">Regulation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catItems.map(item => (
                          <TableRow
                            key={item.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => selectItem(item.id)}
                          >
                            <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                            <TableCell className="text-xs font-medium max-w-[220px] truncate">{item.filingName}</TableCell>
                            <TableCell className="hidden md:table-cell"><NatureBadge nature={item.complianceNature} /></TableCell>
                            <TableCell><StatusBadge status={item.status} /></TableCell>
                            <TableCell className="hidden md:table-cell"><RiskBadge level={item.riskLevel} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{item.dueDate}</TableCell>
                            <TableCell className="text-[10px] text-muted-foreground hidden lg:table-cell">{item.regReference}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Filters + Master Register Table */}
        <div ref={registerRef} className="scroll-mt-20">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">Master Compliance Register</CardTitle>
                {activeDrill && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground">Filtered by:</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {activeDrill}
                      <button onClick={resetFilters} className="ml-0.5 text-primary/70 hover:text-primary">×</button>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search filings..."
                    value={filters.search}
                    onChange={e => setFilter('search', e.target.value)}
                    className="h-8 text-xs pl-8 w-48"
                  />
                </div>
                <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Due Soon">Due Soon</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Due">Not Due</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.complianceNature || 'all'} onValueChange={v => setFilter('complianceNature', v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue placeholder="Nature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Nature</SelectItem>
                    <SelectItem value="[P]">Periodic</SelectItem>
                    <SelectItem value="[E]">Event</SelectItem>
                    <SelectItem value="[P+E]">Both</SelectItem>
                    <SelectItem value="[A]">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 px-3"
                  onClick={() => {
                    exportCategoryToXlsx('Master_Compliance_Register', items);
                    toast.success('Downloaded Master Compliance Register (.xlsx)');
                  }}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" />
                  Download .xlsx
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetFilters}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{filtered.length} of {items.length} items</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-[10px]">#</TableHead>
                    <TableHead className="text-[10px]">Filing Name</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Nature</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Risk</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Due Date</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Tier</TableHead>
                    <TableHead className="text-[10px]">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(item => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => selectItem(item.id)}
                    >
                      <TableCell className="text-xs text-muted-foreground">{item.sNo}</TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">{item.filingName}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{toTitleCaseLabel(item.category)}</TableCell>
                      <TableCell className="hidden lg:table-cell"><NatureBadge nature={item.complianceNature} /></TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="hidden md:table-cell"><RiskBadge level={item.riskLevel} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{item.dueDate}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground hidden lg:table-cell">{toTitleCaseLabel(item.obligorTier)}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Link to={`/compliance/${item.id}`} className="text-[10px] font-medium text-secondary hover:underline">Full Detail</Link>
                          <Link to={`/timeline?item=${item.id}`} className="text-[10px] font-medium text-secondary hover:underline">Timeline</Link>
                        </span>

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
          </CardContent>
        </Card>

        </div>

        <ComplianceDetailDrawer />
      </div>
    </AppLayout>
  );
}
