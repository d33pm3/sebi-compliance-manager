import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { ComplianceItem } from '@/data/complianceData';
import { deriveComplianceState, ComplianceState } from '@/data/workflowData';
import { useComplianceStore } from '@/store/complianceStore';
import { Link } from 'react-router-dom';

const stateStyle: Record<ComplianceState, string> = {
  Completed: 'bg-success/15 text-success border-success/40',
  Overdue: 'bg-destructive/15 text-destructive border-destructive/40',
  'Documents Missing': 'bg-warning/15 text-warning border-warning/40',
  'On Track': 'bg-secondary/15 text-secondary border-secondary/40',
};

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  items?: ComplianceItem[];
  onDrillCategory?: (category: string) => void;
}

export function MonthlyComplianceCalendar({ items: itemsProp }: Props) {
  const storeItems = useComplianceStore(s => s.items);
  // Always resolve against the Master Compliance Register so any change there flows through.
  const items = useMemo(() => {
    if (!itemsProp) return storeItems;
    const ids = new Set(itemsProp.map(i => i.id));
    return storeItems.filter(i => ids.has(i.id));
  }, [itemsProp, storeItems]);

  const firstDue = useMemo(() => {
    const dates = items.map(i => i.dueDate).filter(Boolean).sort();
    return dates[0] ? new Date(dates[0]) : new Date();
  }, [items]);

  const [cursor, setCursor] = useState(() => new Date(firstDue.getFullYear(), firstDue.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const year = cursor.getFullYear();
  const month = cursor.getMonth();


  const byDate = useMemo(() => {
    const map = new Map<string, ComplianceItem[]>();
    items.forEach(i => {
      if (!i.dueDate) return;
      const list = map.get(i.dueDate) ?? [];
      list.push(i);
      map.set(i.dueDate, list);
    });
    return map;
  }, [items]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);

  const monthItems = useMemo(
    () => items.filter(i => i.dueDate?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)),
    [items, year, month],
  );

  const selectedItems = selectedDay ? byDate.get(selectedDay) ?? [] : [];

  const daysUntil = (date: string) =>
    Math.ceil((new Date(date).getTime() - new Date(todayStr).getTime()) / 86400000);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-secondary flex-shrink-0" /> Monthly Compliance Calendar
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1">
              {monthItems.length} deadline{monthItems.length === 1 ? '' : 's'} in {monthNames[month]} {year} — click a date to see filings, status and days until due
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setCursor(new Date(year, month - 1, 1)); setSelectedDay(null); }}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium w-32 text-center">{monthNames[month]} {year}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setCursor(new Date(year, month + 1, 1)); setSelectedDay(null); }}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map(d => (
            <div key={d} className="text-[10px] text-muted-foreground text-center font-medium pb-1">{d}</div>
          ))}
          {cells.map((date, idx) => {
            if (!date) return <div key={`e-${idx}`} className="min-h-[74px] rounded-md bg-muted/20" />;
            const dayItems = byDate.get(date) ?? [];
            const isToday = date === todayStr;
            const isSelected = date === selectedDay;
            const shown = dayItems.slice(0, 2);
            const extra = dayItems.length - shown.length;
            return (
              <div
                key={date}
                className={`min-h-[74px] rounded-md border p-1.5 text-left transition-colors ${
                  isSelected ? 'border-secondary bg-secondary/10'
                    : isToday ? 'border-secondary/60 bg-secondary/5'
                    : dayItems.length ? 'border-border' : 'border-transparent bg-muted/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => dayItems.length && setSelectedDay(isSelected ? null : date)}
                  className={`text-[10px] font-semibold ${isToday ? 'text-secondary' : 'text-muted-foreground'} ${dayItems.length ? 'hover:text-secondary' : 'cursor-default'}`}
                >
                  {Number(date.slice(-2))}
                </button>
                <div className="mt-1 space-y-0.5">
                  {shown.map(i => {
                    const s = deriveComplianceState(i);
                    return (
                      <Link
                        key={i.id}
                        to={`/compliance/${i.id}`}
                        title={`${i.filingName} — ${s}`}
                        className={`block rounded-sm border px-1 text-[9px] leading-4 truncate hover:brightness-95 ${stateStyle[s]}`}
                      >
                        {i.filingName}
                      </Link>
                    );
                  })}
                  {extra > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(isSelected ? null : date)}
                      className="block w-full text-left rounded-sm px-1 text-[9px] leading-4 text-muted-foreground hover:text-secondary"
                    >
                      +{extra} More
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        </div>

        <div className="flex items-center gap-3 flex-wrap pt-1">
          {(Object.keys(stateStyle) as ComplianceState[]).map(s => (
            <span key={s} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-full border ${stateStyle[s]}`} /> {s}
            </span>
          ))}
        </div>

        {selectedDay && (
          <div className="rounded-md border divide-y">
            <div className="px-3 py-2 bg-muted/40">
              <p className="text-xs font-semibold">Deadlines On {selectedDay}</p>
              <p className="text-[10px] text-muted-foreground">{selectedItems.length} filing(s) — open any row for the full detail in the Master Compliance Register</p>
            </div>
            {selectedItems.map(i => {
              const state = deriveComplianceState(i);
              const days = daysUntil(i.dueDate);
              return (
                <Link key={i.id} to={`/compliance/${i.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40">
                  <span className={`inline-flex items-center justify-center rounded-full border text-[10px] font-semibold whitespace-nowrap min-w-[100px] h-5 px-2 ${stateStyle[state]}`}>
                    {state}
                  </span>
                  <span className="text-xs flex-1 truncate">{i.filingName}</span>
                  <span className="text-[10px] text-muted-foreground hidden md:inline">{i.regReference}</span>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${days < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {days < 0 ? `${Math.abs(days)} Days Overdue` : days === 0 ? 'Due Today' : `${days} Days Left`}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
