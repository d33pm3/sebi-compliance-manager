import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Upload, Download, Clock, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';
import { useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { downloadMasterRegister, downloadFilingCalendar, downloadEventTriggerMap, downloadAmendmentTracker, downloadOtherItems } from '@/lib/downloadUtils';

const agentLogs = [
  'Initialising SEBI Compliance Agent v2.0...',
  'Loading LODR 2015 (last amended Jan 22, 2026)...',
  'Loading PIT Regulations 2015...',
  'Loading SAST Regulations 2011...',
  'Loading NCS Regulations 2021...',
  'Scanning SEBI circular repository...',
  'Parsing regulation text — Chapter III (Periodic Filings)...',
  'Parsing regulation text — Chapter IV (Material Events)...',
  'Extracting Reg 33 — Financial Results obligations...',
  'Extracting Reg 31 — Shareholding Pattern obligations...',
  'Extracting Reg 27 — Corporate Governance obligations...',
  'Extracting Reg 23 — Related Party Transactions...',
  'Extracting Reg 30 — Material Event disclosures (Schedule III Part A)...',
  'Extracting Reg 30 — Material Event disclosures (Schedule III Part B)...',
  'Extracting Reg 30A — Market Rumour Verification...',
  'Extracting Reg 29 — Board Meeting intimations...',
  'Extracting Reg 42 — Record Date / Dividend obligations...',
  'Extracting SEBI PIT Reg 7 — Insider Trading disclosures...',
  'Extracting SEBI SAST Reg 29 — Takeover obligations...',
  'Extracting LODR Chapter V — Debt Securities obligations...',
  'Extracting Capital Actions — Buyback/Rights/QIP/OFS...',
  'Extracting ESG/BRSR obligations — Reg 34(2)(f)...',
  'Applying Anti-Duplication mechanism — [P+E] single-row resolver...',
  'Cross-referencing LODR Master Circular Jan 30, 2026...',
  'Integrating 3rd Amendment Dec 2024 changes (Integrated Filing)...',
  'Integrating 5th Amendment Nov 2025 changes (RPT Schedule XII)...',
  'Integrating 6th Amendment Dec 2025 changes (RTA terminology)...',
  'Integrating Jan 2026 Amendment (HVDLE ₹5,000 cr threshold)...',
  'Building Filing Calendar — April 2026 to March 2027...',
  'Building Event Trigger Map — sorted by response timeline...',
  'Building Amendment Tracker — 2024–2026 changes...',
  'Classifying Compliance Nature: [P], [E], [P+E], [A]...',
  'Classifying Obligor Tiers: ALL, TOP 1000, TOP 500, TOP 250...',
  'Calculating risk scores...',
  'Generating Master Register output...',
  '✅ Extraction complete. 93 compliance items found.',
];

export default function RegisterAgent() {
  const { items, agent, startAgent, stopAgent, addAgentLog, setAgentSchedule, setAgentStatus, setAgentCompleted } = useComplianceStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIndexRef = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.logs]);

  const handleRun = useCallback(() => {
    startAgent();
    logIndexRef.current = 0;
    intervalRef.current = setInterval(() => {
      if (logIndexRef.current < agentLogs.length) {
        addAgentLog(agentLogs[logIndexRef.current]);
        logIndexRef.current++;
      } else {
        clearInterval(intervalRef.current!);
        setAgentCompleted(93);
      }
    }, 400);
  }, [startAgent, addAgentLog, setAgentCompleted]);

  const handleStop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopAgent();
  }, [stopAgent]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const statusColor = agent.status === 'Running' ? 'text-success' : agent.status === 'Completed' ? 'text-secondary' : agent.status === 'Error' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <AppLayout title="Compliance Agent" subtitle="Module 1 — Automated SEBI Compliance Extraction">
      <div className="space-y-4 max-w-6xl">
        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Agent Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={handleRun} disabled={agent.status === 'Running'} size="sm" className="flex-1">
                  <Play className="h-3.5 w-3.5 mr-1" /> Run
                </Button>
                <Button onClick={handleStop} disabled={agent.status !== 'Running'} variant="destructive" size="sm" className="flex-1">
                  <Square className="h-3.5 w-3.5 mr-1" /> Stop
                </Button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Schedule</label>
                <Select value={agent.schedule} onValueChange={setAgentSchedule}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">Every 30 minutes</SelectItem>
                    <SelectItem value="2hrs">Every 2 hours</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${agent.status === 'Running' ? 'bg-success animate-pulse' : agent.status === 'Completed' ? 'bg-secondary' : 'bg-muted-foreground'}`} />
                <span className={`text-sm font-medium ${statusColor}`}>{agent.status}</span>
              </div>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last Run: {agent.lastRunTime || 'Never'}</div>
                <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Items Extracted: {agent.itemsExtracted}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">PDF Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-secondary transition-colors cursor-pointer">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Drag & drop SEBI circular PDFs</p>
                <p className="text-[10px] text-muted-foreground/60">or click to browse</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Log */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Agent Progress Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 rounded-md border bg-foreground/5 p-3">
              <div className="agent-log space-y-0.5">
                {agent.logs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet. Click "Run" to start the agent.</p>
                ) : (
                  agent.logs.map((log, i) => (
                    <p key={i} className={log.includes('✅') ? 'text-success font-medium' : log.includes('Error') ? 'text-destructive' : 'text-foreground/80'}>
                      {log}
                    </p>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Download Outputs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Download Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { name: 'Master Register', fn: downloadMasterRegister },
                { name: 'Filing Calendar', fn: downloadFilingCalendar },
                { name: 'Event Trigger Map', fn: downloadEventTriggerMap },
                { name: 'Amendment Tracker', fn: downloadAmendmentTracker },
                { name: 'All Items', fn: downloadOtherItems },
              ].map(({ name, fn }) => (
                <Button key={name} variant="outline" size="sm" className="text-xs h-9 gap-1.5" onClick={() => { fn(items); toast.success(`Downloaded ${name}`); }}>
                  <Download className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
