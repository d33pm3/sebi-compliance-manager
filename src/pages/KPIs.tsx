import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle2, AlertTriangle, Clock, ListTodo, ShieldAlert, FileCheck, MailWarning, TrendingUp, CalendarClock } from 'lucide-react';
import { useMemo } from 'react';
import { deriveComplianceState } from '@/data/workflowData';
import { toTitleCaseLabel } from '@/lib/chartTheme';
import { Link, useNavigate } from 'react-router-dom';

const CHART_COLORS = {
  Completed: 'hsl(145, 63%, 62%)',
  Overdue: 'hsl(350, 80%, 72%)',
  'In Progress': 'hsl(197, 78%, 54%)',
  'Not Started': 'hsl(220, 8%, 64%)',
  'Due Soon': 'hsl(38, 80%, 52%)',
  High: 'hsl(350, 80%, 72%)',
  Medium: 'hsl(197, 78%, 54%)',
  Low: 'hsl(145, 63%, 62%)',
  Open: 'hsl(350, 80%, 72%)',
  Done: 'hsl(145, 63%, 62%)',
};

function daysBetween(a: string, b: string) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  colorClass,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  href?: string;
  colorClass?: string;
}) {
  const content = (
    <Card className={`${href ? 'cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all' : ''} ${colorClass || ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link to={href}>{content}</Link>;
  return content;
}

export default function KPIs() {
  const { items, tasks, filings, notices } = useComplianceStore();
  const navigate = useNavigate();

  // Clicking a state tile drills into the Master Compliance Register filtered to that state
  const drillToState = (state: string) => navigate(`/?state=${encodeURIComponent(state)}`);

  const complianceStats = useMemo(() => {
    const total = items.length;
    const completed = items.filter(i => i.status === 'Completed').length;
    const overdue = items.filter(i => i.status === 'Overdue').length;
    const inProgress = items.filter(i => i.status === 'In Progress').length;
    const notStarted = items.filter(i => i.status === 'Not Started').length;
    return {
      total,
      completed,
      overdue,
      inProgress,
      notStarted,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      overdueRate: total ? Math.round((overdue / total) * 100) : 0,
      inProgressRate: total ? Math.round((inProgress / total) * 100) : 0,
    };
  }, [items]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'Done').length;
    const open = tasks.filter(t => t.status === 'Open').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const overdueTasks = tasks.filter(t => t.status !== 'Done' && t.deadline && new Date(t.deadline) < new Date()).length;
    return { total, done, open, inProgress, blocked, overdueTasks, completionRate: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const responseStats = useMemo(() => {
    const completedFilings = filings.filter(f => f.approvalStatus === 'Approved');
    const onTime = completedFilings.filter(f => {
      const item = items.find(i => i.id === f.itemId);
      if (!item) return false;
      return daysBetween(item.dueDate, f.filingDate) <= 0;
    }).length;
    const responseDays = completedFilings
      .map(f => {
        const item = items.find(i => i.id === f.itemId);
        if (!item) return null;
        return daysBetween(item.dueDate, f.filingDate);
      })
      .filter((d): d is number => d !== null);
    const avgResponseDays = responseDays.length ? Math.round(responseDays.reduce((a, b) => a + b, 0) / responseDays.length) : 0;
    const onTimeRate = completedFilings.length ? Math.round((onTime / completedFilings.length) * 100) : 0;

    const noticeTotal = notices.length;
    const noticeSubmitted = notices.filter(n => n.responseStatus === 'Submitted' || n.responseStatus === 'Closed').length;
    const noticePending = notices.filter(n => n.responseStatus === 'Awaiting Response' || n.responseStatus === 'Drafting').length;
    const noticeOverdue = notices.filter(n => n.responseStatus !== 'Closed' && n.responseStatus !== 'Submitted' && new Date(n.responseDue) < new Date()).length;
    const noticeOnTimeRate = noticeSubmitted ? Math.round((noticeSubmitted / noticeTotal) * 100) : 0;

    return { onTimeRate, avgResponseDays, completedFilings: completedFilings.length, noticeTotal, noticeSubmitted, noticePending, noticeOverdue, noticeOnTimeRate };
  }, [filings, items, notices]);

  const riskStats = useMemo(() => {
    const high = items.filter(i => i.riskLevel === 'High').length;
    const medium = items.filter(i => i.riskLevel === 'Medium').length;
    const low = items.filter(i => i.riskLevel === 'Low').length;
    return { high, medium, low };
  }, [items]);

  const stateDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const state = deriveComplianceState(item);
      counts[state] = (counts[state] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: CHART_COLORS[name as keyof typeof CHART_COLORS] || 'hsl(220, 8%, 64%)' }));
  }, [items]);

  const statusData = useMemo(() => [
    { name: 'Completed', value: complianceStats.completed, fill: CHART_COLORS.Completed },
    { name: 'In Progress', value: complianceStats.inProgress, fill: CHART_COLORS['In Progress'] },
    { name: 'Overdue', value: complianceStats.overdue, fill: CHART_COLORS.Overdue },
    { name: 'Not Started', value: complianceStats.notStarted, fill: CHART_COLORS['Not Started'] },
  ], [complianceStats]);

  const taskData = useMemo(() => [
    { name: 'Done', value: taskStats.done, fill: CHART_COLORS.Done },
    { name: 'Open', value: taskStats.open, fill: CHART_COLORS.Open },
    { name: 'In Progress', value: taskStats.inProgress, fill: CHART_COLORS['In Progress'] },
    { name: 'Blocked', value: taskStats.blocked, fill: CHART_COLORS.Overdue },
  ], [taskStats]);

  const riskData = useMemo(() => [
    { name: 'High', value: riskStats.high, fill: CHART_COLORS.High },
    { name: 'Medium', value: riskStats.medium, fill: CHART_COLORS.Medium },
    { name: 'Low', value: riskStats.low, fill: CHART_COLORS.Low },
  ], [riskStats]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: toTitleCaseLabel(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items]);

  return (
    <AppLayout title="Compliance KPIs" subtitle="Live metrics wired to the Master Compliance Register">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Compliance KPIs</h1>
          <p className="text-xs text-muted-foreground">Live metrics wired to the Master Compliance Register</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard title="Completion Rate" value={`${complianceStats.completionRate}%`} subtitle={`${complianceStats.completed} of ${complianceStats.total} filings`} icon={CheckCircle2} href="/" />
          <KpiCard title="Overdue Rate" value={`${complianceStats.overdueRate}%`} subtitle={`${complianceStats.overdue} overdue items`} icon={AlertTriangle} href="/risk-assessment" colorClass="border-l-4 border-l-destructive" />
          <KpiCard title="On-time Filing" value={`${responseStats.onTimeRate}%`} subtitle={`${responseStats.completedFilings} approved filings`} icon={FileCheck} />
          <KpiCard title="Avg Response Time" value={`${responseStats.avgResponseDays}d`} subtitle="Days before/after due date" icon={Clock} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard title="Task Completion" value={`${taskStats.completionRate}%`} subtitle={`${taskStats.done} of ${taskStats.total} tasks done`} icon={ListTodo} href="/tasks" />
          <KpiCard title="Overdue Tasks" value={String(taskStats.overdueTasks)} subtitle="Past deadline, not done" icon={CalendarClock} href="/risk-assessment" colorClass="border-l-4 border-l-warning" />
          <KpiCard title="High Risk Items" value={String(riskStats.high)} subtitle="Open high-risk compliances" icon={ShieldAlert} href="/risk-assessment" colorClass="border-l-4 border-l-destructive" />
          <KpiCard title="Notice Response" value={`${responseStats.noticeOnTimeRate}%`} subtitle={`${responseStats.noticeSubmitted} of ${responseStats.noticeTotal} closed`} icon={MailWarning} href="/response-tracker" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Compliance Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{d.value} ({complianceStats.total ? Math.round((d.value / complianceStats.total) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                Task Completion Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ value, percent }: any) => (value > 0 ? `${value} (${Math.round(percent * 100)}%)` : '')}
                      labelLine={false}
                      fontSize={10}
                    >
                      {taskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value: string, entry: any) => `${value} (${entry.payload.value})`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Overall Task Completion</span>
                  <span className="font-semibold">{taskStats.completionRate}%</span>
                </div>
                <Progress value={taskStats.completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Risk Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      label={({ value, percent }: any) => (value > 0 ? `${value} (${Math.round(percent * 100)}%)` : '')}
                      labelLine={false}
                      fontSize={10}
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value: string, entry: any) => `${value} (${entry.payload.value})`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Categories by Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--foreground))' }} width={150} interval={0} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              Compliance State Distribution (Master Register)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stateDistribution} dataKey="value" nameKey="name" cx="35%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} label={({ name, percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                    {stateDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {stateDistribution.map(d => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => drillToState(d.name)}
                  title={`View ${d.name} items in the Master Compliance Register`}
                  className="rounded-lg border p-2 text-center transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.fill }} />
                    {d.name}
                  </p>
                  <p className="text-lg font-bold">{d.value}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
