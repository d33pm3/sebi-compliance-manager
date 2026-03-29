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
import { Search, FileText, AlertTriangle, CheckCircle2, Clock, CalendarDays, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { useMemo, useState } from 'react';

const CHART_COLORS = {
  Completed: 'hsl(145, 63%, 62%)',
  'Due Soon': 'hsl(38, 80%, 52%)',
  Overdue: 'hsl(350, 80%, 72%)',
  'Not Due': 'hsl(220, 8%, 46%)',
  'In Progress': 'hsl(197, 78%, 54%)',
  'Not Started': 'hsl(220, 8%, 64%)',
};

const RISK_COLORS = {
  Critical: 'hsl(350, 80%, 72%)',
  High: 'hsl(38, 80%, 52%)',
  Medium: 'hsl(197, 78%, 54%)',
  Low: 'hsl(145, 63%, 62%)',
};

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

export default function Dashboard() {
  const { items, filters, setFilter, resetFilters, selectItem, filteredItems } = useComplianceStore();
  const filtered = filteredItems();
  const [page, setPage] = useState(0);
  const perPage = 15;

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
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, value, fullName: name })).sort((a, b) => b.value - a.value);
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
        return d >= today && d <= in15Days;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8);
  }, [items]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <AppLayout title="Compliance Dashboard" subtitle="Module 2 — SEBI / NSE / BSE Unified Register">
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={<FileText className="h-4 w-4" />} label="Total Items" value={stats.total} color="text-foreground" />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Due Soon" value={stats.dueSoon} color="text-warning" />
          <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={stats.overdue} color="text-destructive" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.completed} color="text-success" />
          <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Upcoming" value={stats.upcoming} color="text-muted-foreground" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Status Breakdown Donut */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Status Breakdown</CardTitle>
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
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || 'hsl(220,8%,46%)'} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value: string) => <span className="text-muted-foreground ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Filings by Month */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Filings by Month</CardTitle>
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
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Filings" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* By Category */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">By Category</CardTitle>
              <p className="text-[10px] text-muted-foreground/70">Top 8 categories</p>
            </CardHeader>
            <CardContent className="px-1 pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData.slice(0, 8)} layout="vertical" barCategoryGap="16%">
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
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" name="Items" radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

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
              <CardTitle className="text-xs font-semibold">Filing Calendar (Next 15 Days)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-52 overflow-auto">
              {filingCalendar.length === 0 ? (
                <p className="text-xs text-muted-foreground">No filings due in the next 15 days.</p>
              ) : (
                filingCalendar.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1.5 rounded" onClick={() => selectItem(item.id)}>
                    <span className="text-muted-foreground flex-shrink-0 w-16">{new Date(item.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    <span className="truncate flex-1">{item.filingName}</span>
                    <StatusBadge status={item.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Categories ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {categories.map(cat => {
                const count = items.filter(i => i.category === cat).length;
                const isActive = filters.category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilter('category', isActive ? '' : cat)}
                    className={`text-left p-2.5 rounded-md border text-xs transition-all ${isActive ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/30 hover:bg-muted/50'}`}
                  >
                    <div className="font-medium truncate">{cat}</div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">{count} items</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters + Master Register Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Master Compliance Register</CardTitle>
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
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{item.category}</TableCell>
                      <TableCell className="hidden lg:table-cell"><NatureBadge nature={item.complianceNature} /></TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="hidden md:table-cell"><RiskBadge level={item.riskLevel} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{item.dueDate}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground hidden lg:table-cell">{item.obligorTier}</TableCell>
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

        <ComplianceDetailDrawer />
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
