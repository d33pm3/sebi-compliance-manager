import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MonthlyComplianceCalendar } from '@/components/MonthlyComplianceCalendar';
import { StatTile } from '@/components/StatTile';
import { useComplianceStore } from '@/store/complianceStore';
import { ComplianceState, deriveComplianceState } from '@/data/workflowData';
import { STAT_COLORS, toTitleCaseLabel } from '@/lib/chartTheme';
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, ExternalLink, FileSpreadsheet, MailWarning } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const badge = 'inline-flex items-center justify-center rounded-full border text-[10px] font-semibold whitespace-nowrap h-5 min-w-[92px] px-2 leading-none';

const stateStyle: Record<ComplianceState, string> = {
  Completed: 'bg-success/15 text-success border-success/40',
  Overdue: 'bg-destructive/15 text-destructive border-destructive/40',
  'Documents Missing': 'bg-warning/15 text-warning border-warning/40',
  'On Track': 'bg-secondary/15 text-secondary border-secondary/40',
};

const days = (from: string, to: string) => Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000);

export default function ComplianceCalendar() {
  const items = useComplianceStore(s => s.items);
  const notices = useComplianceStore(s => s.notices);
  const [horizon, setHorizon] = useState('90');
  const [stateFilter, setStateFilter] = useState<'all' | ComplianceState>('all');

  const today = new Date().toISOString().split('T')[0];

  /** Every row is resolved live from the Master Compliance Register */
  const upcoming = useMemo(() => {
    const limit = Number(horizon);
    return items
      .filter(i => !!i.dueDate)
      .map(i => ({ item: i, state: deriveComplianceState(i), daysLeft: days(today, i.dueDate) }))
      .filter(r => (Number.isNaN(limit) ? true : r.daysLeft <= limit))
      .filter(r => stateFilter === 'all' || r.state === stateFilter)
      .sort((a, b) => a.item.dueDate.localeCompare(b.item.dueDate));
  }, [items, horizon, stateFilter, today]);

  const noticeRows = useMemo(() => notices
    .map(n => ({ n, daysLeft: days(today, n.responseDue) }))
    .sort((a, b) => a.n.responseDue.localeCompare(b.n.responseDue)), [notices, today]);

  const stats = useMemo(() => {
    const all = items.filter(i => !!i.dueDate).map(i => ({ i, state: deriveComplianceState(i), d: days(today, i.dueDate) }));
    return {
      total: all.length,
      overdue: all.filter(r => r.state === 'Overdue').length,
      next30: all.filter(r => r.d >= 0 && r.d <= 30 && r.state !== 'Completed').length,
      completed: all.filter(r => r.state === 'Completed').length,
      notices: notices.filter(n => n.responseStatus !== 'Closed').length,
    };
  }, [items, notices, today]);

  const exportXlsx = () => {
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      const filings = [
        ['Due Date', 'Days Left', 'Filing Name', 'Category', 'Regulation', 'Status', 'Owner'],
        ...upcoming.map(r => [r.item.dueDate, r.daysLeft, r.item.filingName, toTitleCaseLabel(r.item.category), r.item.regReference, r.state, r.item.owner]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(filings);
      ws1['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 45 }, { wch: 28 }, { wch: 24 }, { wch: 20 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Upcoming Filings');
      const noticeSheet = [
        ['Response Due', 'Days Left', 'Notice No.', 'Subject', 'Issued By', 'Response Status', 'Owner'],
        ...noticeRows.map(r => [r.n.responseDue, r.daysLeft, r.n.noticeNo, r.n.subject, r.n.issuedBy, r.n.responseStatus, r.n.owner]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(noticeSheet);
      ws2['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 45 }, { wch: 20 }, { wch: 18 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Notice Responses');
      XLSX.writeFile(wb, 'Compliance_Calendar.xlsx');
      toast.success('Downloaded Compliance_Calendar.xlsx');
    });
  };

  return (
    <AppLayout title="Compliance Calendar" subtitle="Upcoming filings, deadlines and notice responses">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatTile icon={<CalendarDays className="h-4 w-4" />} label="Dated Obligations" value={stats.total} bg={STAT_COLORS.total} active={stateFilter === 'all'} onClick={() => setStateFilter('all')} title="Show every dated obligation" />
          <StatTile icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={stats.overdue} bg={STAT_COLORS.overdue} active={stateFilter === 'Overdue'} onClick={() => setStateFilter('Overdue')} title="Show overdue obligations" />
          <StatTile icon={<CalendarClock className="h-4 w-4" />} label="Due Within 30 Days" value={stats.next30} bg={STAT_COLORS.dueSoon} active={horizon === '30'} onClick={() => { setHorizon('30'); setStateFilter('all'); }} title="Show deadlines in the next 30 days" />
          <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.completed} bg={STAT_COLORS.completed} active={stateFilter === 'Completed'} onClick={() => setStateFilter('Completed')} title="Show completed obligations" />
          <StatTile icon={<MailWarning className="h-4 w-4" />} label="Open Notice Responses" value={stats.notices} bg={STAT_COLORS.inProgress} onClick={() => toast.info('Open notice responses are listed below')} title="Notice responses still open" />
        </div>

        <MonthlyComplianceCalendar />

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-secondary" /> Upcoming Filings & Deadlines
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">{upcoming.length} obligations · dates read live from the Master Compliance Register</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Next 30 Days</SelectItem>
                    <SelectItem value="60">Next 60 Days</SelectItem>
                    <SelectItem value="90">Next 90 Days</SelectItem>
                    <SelectItem value="365">Next 12 Months</SelectItem>
                    <SelectItem value="NaN">All Dates</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportXlsx}>
                  <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" /> Export .xlsx
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Due Date</TableHead>
                    <TableHead className="text-[10px]">Days Left</TableHead>
                    <TableHead className="text-[10px]">Filing Name</TableHead>
                    <TableHead className="text-[10px] hidden lg:table-cell">Category</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px] hidden xl:table-cell">Owner</TableHead>
                    <TableHead className="text-[10px]">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map(r => (
                    <TableRow key={r.item.id} className="hover:bg-muted/50">
                      <TableCell className="text-[11px] whitespace-nowrap">{r.item.dueDate}</TableCell>
                      <TableCell className={`text-[11px] font-semibold whitespace-nowrap ${r.daysLeft < 0 ? 'text-destructive' : r.daysLeft <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)} Days Overdue` : `${r.daysLeft} Days`}
                      </TableCell>
                      <TableCell className="text-xs font-medium max-w-[260px]">
                        <Link to={`/compliance/${r.item.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                          <span className="truncate max-w-[230px]">{r.item.filingName}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell max-w-[150px] truncate">{toTitleCaseLabel(r.item.category)}</TableCell>
                      <TableCell><span className={`${badge} ${stateStyle[r.state]}`}>{r.state}</span></TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden xl:table-cell">{r.item.owner}</TableCell>
                      <TableCell>
                        <Link to={`/timeline?item=${r.item.id}`} className="text-[11px] text-primary hover:underline">Timeline</Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MailWarning className="h-4 w-4 text-destructive" /> Notice Response Deadlines
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
                    <TableHead className="text-[10px]">Response Due</TableHead>
                    <TableHead className="text-[10px]">Days Left</TableHead>
                    <TableHead className="text-[10px]">Notice No.</TableHead>
                    <TableHead className="text-[10px]">Subject</TableHead>
                    <TableHead className="text-[10px] hidden md:table-cell">Issued By</TableHead>
                    <TableHead className="text-[10px]">Response Status</TableHead>
                    <TableHead className="text-[10px] hidden xl:table-cell">Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticeRows.map(r => (
                    <TableRow key={r.n.noticeId} className="hover:bg-muted/50">
                      <TableCell className="text-[11px] whitespace-nowrap">{r.n.responseDue}</TableCell>
                      <TableCell className={`text-[11px] font-semibold whitespace-nowrap ${r.daysLeft < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)} Days Overdue` : `${r.daysLeft} Days`}
                      </TableCell>
                      <TableCell className="text-[11px] font-mono">
                        <Link to={`/notices/${r.n.noticeId}`} className="text-primary hover:underline">{r.n.noticeNo}</Link>
                      </TableCell>
                      <TableCell className="text-xs max-w-[240px] truncate" title={r.n.subject}>{r.n.subject}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{r.n.issuedBy}</TableCell>
                      <TableCell><span className={`${badge} ${r.n.responseStatus === 'Closed' ? 'bg-muted text-muted-foreground border-border' : r.n.responseStatus === 'Submitted' ? 'bg-success/15 text-success border-success/40' : 'bg-warning/15 text-warning border-warning/40'}`}>{r.n.responseStatus}</span></TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden xl:table-cell">{r.n.owner}</TableCell>
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
