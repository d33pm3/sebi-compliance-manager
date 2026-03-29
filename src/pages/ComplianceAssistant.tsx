import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Search, BarChart3, Mail, Paperclip, Send, Download, Clock, CheckCircle2, Zap, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AssistantAction {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'pending';
}

const quickActions = [
  { id: 'draft', icon: FileText, label: 'Draft Notice Response', desc: 'Generate a response to SEBI/Exchange notices' },
  { id: 'pull', icon: Search, label: 'Pull Documents', desc: 'Retrieve documents from the vault' },
  { id: 'query', icon: BarChart3, label: 'Run Compliance Query', desc: 'Cross-module compliance analysis' },
  { id: 'email', icon: Mail, label: 'Email Documents', desc: 'Send compliance documents via email' },
];

const recentActions: AssistantAction[] = [
  { id: '1', type: 'Draft', title: 'Response to SCN SEBI/CFD/2026/0341', timestamp: '2026-03-28 16:30', status: 'completed' },
  { id: '2', type: 'Pull', title: '3 documents for Reg 31 compliance', timestamp: '2026-03-28 14:15', status: 'completed' },
  { id: '3', type: 'Query', title: 'Overdue items summary Q4 FY26', timestamp: '2026-03-27 11:00', status: 'completed' },
  { id: '4', type: 'Email', title: 'CG Report Q3 to Board Members', timestamp: '2026-03-26 17:45', status: 'completed' },
];

export default function ComplianceAssistant() {
  const [input, setInput] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [workspaceContent, setWorkspaceContent] = useState<string | null>(null);

  const handleQuickAction = (actionId: string) => {
    setActiveAction(actionId);
    switch (actionId) {
      case 'draft':
        setWorkspaceContent('draft');
        break;
      case 'pull':
        setWorkspaceContent('pull');
        break;
      case 'query':
        setWorkspaceContent('query');
        break;
      case 'email':
        setWorkspaceContent('email');
        break;
    }
  };

  const handleDraftGenerate = () => {
    toast.info('Generating draft response...');
    setTimeout(() => {
      setDraftContent(`To,
The General Manager
Securities and Exchange Board of India
SEBI Bhavan, Plot No. C4-A, "G" Block
Bandra Kurla Complex, Bandra (East)
Mumbai – 400051

Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}

Subject: Response to Show Cause Notice No. SEBI/CFD/2026/0341

Dear Sir/Madam,

We refer to your Show Cause Notice dated March 5, 2026, bearing reference number SEBI/CFD/2026/0341, regarding the alleged non-submission of Corporate Governance Report for Q2 FY2025-26.

We respectfully submit that:

1. The Corporate Governance Report for Q2 FY2025-26 was duly filed with both NSE and BSE on January 14, 2026, within the stipulated timeline under Regulation 27(2) of SEBI LODR 2015.

2. We attach herewith the following documentary evidence:
   a) Filing acknowledgment from NSE (Ref: NSE/LIST/CG/2026/Q2/0234)
   b) Filing acknowledgment from BSE (Ref: BSE/CORP/CG/2026/Q2/0189)
   c) Copy of the Corporate Governance Report as filed

3. We believe there may have been an administrative oversight at the exchange/regulator end, and we request you to kindly verify the filing records.

We assure complete cooperation in this matter and request the withdrawal of the Show Cause Notice.

Thanking you,

For Exco Compliance Solutions Pvt. Ltd.

___________________________
Company Secretary
`);
      toast.success('Draft response generated');
    }, 2000);
  };

  const handleQuerySubmit = () => {
    if (!input.trim()) return;
    toast.info('Running cross-module query...');
    setTimeout(() => {
      setWorkspaceContent('query-result');
      toast.success('Query completed');
    }, 1500);
  };

  return (
    <AppLayout title="Compliance Assistant" subtitle="Module 6 — AI-Powered Regulatory Action Agent">
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Quick Actions Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4 hidden lg:block">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className={`w-full text-left p-2.5 rounded-md border text-xs transition-all ${activeAction === action.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30 hover:bg-muted/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <action.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">{action.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Recent Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActions.map(action => (
                <div key={action.id} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{action.type}: {action.title}</p>
                    <p className="text-[10px] text-muted-foreground">{action.timestamp}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Workspace */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0 border-b">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Assistant Workspace</CardTitle>
              <Badge variant="outline" className="text-[10px] ml-auto">AGENT_006</Badge>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            {!workspaceContent && (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-semibold text-muted-foreground">Select a quick action or type below</h3>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-md">The Compliance Assistant can draft notice responses, pull documents, run compliance queries, and send emails.</p>
              </div>
            )}

            {workspaceContent === 'draft' && (
              <div className="space-y-4 max-w-3xl">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info('Upload simulation — attach SEBI Notice PDF here')}>
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-medium">Attach SEBI Notice / Inquiry PDF</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Drag & drop or click to browse</p>
                </div>
                <Button onClick={handleDraftGenerate} className="w-full">
                  <FileText className="h-4 w-4 mr-2" /> Generate Draft Response
                </Button>
                {draftContent && (
                  <div className="space-y-3">
                    <Textarea value={draftContent} onChange={e => setDraftContent(e.target.value)} rows={20} className="text-xs font-mono" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Download DOCX</Button>
                      <Button variant="outline" size="sm" onClick={() => toast.success('Saved to Documentation Vault')}><FileText className="h-3.5 w-3.5 mr-1" /> Save to Vault</Button>
                      <Button variant="outline" size="sm" onClick={() => toast.success('Draft emailed')}><Mail className="h-3.5 w-3.5 mr-1" /> Email Draft</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {workspaceContent === 'pull' && (
              <div className="space-y-4 max-w-3xl">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium mb-2">Document Retrieval</p>
                  <p className="text-[11px] text-muted-foreground">Enter a query to pull documents from the vault. Example: "All Q3 FY26 filings for Regulation 31 LODR"</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold">Results for: "Q3 FY26 compliance filings"</p>
                  {['Corporate Governance Report Q3', 'Trading Window Closure Notice', 'Investor Grievance Report Q3'].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium">{doc}</p>
                          <p className="text-[10px] text-muted-foreground">FY2025-26 · PDF</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Mail className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5 mr-1" /> Email All as ZIP</Button>
                </div>
              </div>
            )}

            {workspaceContent === 'query' && (
              <div className="space-y-4 max-w-3xl">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium mb-2">Cross-Module Query</p>
                  <p className="text-[11px] text-muted-foreground">Ask any compliance question — the assistant will query across all modules to find the answer.</p>
                </div>
              </div>
            )}

            {workspaceContent === 'query-result' && (
              <div className="space-y-4 max-w-3xl">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs font-semibold mb-2">Query: "{input || 'How many compliances are overdue?'}"</p>
                  <div className="text-xs space-y-2 mt-3">
                    <p>Based on analysis across all modules:</p>
                    <p className="font-medium">📊 Summary:</p>
                    <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                      <li>Total compliance items: 93</li>
                      <li>Overdue items: 20 (21.5%)</li>
                      <li>Due Soon (next 15 days): 26 items</li>
                      <li>Completed: 20 items</li>
                      <li>Pending approval in Module 3: 22 items</li>
                      <li>Documents in vault: 22</li>
                    </ul>
                    <p className="font-medium mt-3">⚠️ Critical overdue items:</p>
                    <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                      <li>Financial Results Q4 — Reg 33 LODR (15 days overdue)</li>
                      <li>Annual PIT Disclosures — Reg 7 PIT (10 days overdue)</li>
                      <li>Board Meeting Intimation — Reg 29 LODR (7 days overdue)</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export Report</Button>
                  <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5 mr-1" /> Email Summary</Button>
                </div>
              </div>
            )}

            {workspaceContent === 'email' && (
              <div className="space-y-4 max-w-3xl">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium mb-2">Email Documents</p>
                  <p className="text-[11px] text-muted-foreground">Select documents from the vault and email them to recipients.</p>
                </div>
                <div className="space-y-3">
                  <Input placeholder="Recipient emails (comma-separated)" className="h-8 text-xs" />
                  <Input placeholder="Subject line" className="h-8 text-xs" defaultValue="SEBI Compliance Documents — Exco Compliance Solutions" />
                  <Textarea placeholder="Optional message..." rows={3} className="text-xs" />
                  <Button onClick={() => toast.success('Email sent successfully')}><Mail className="h-4 w-4 mr-2" /> Send Email</Button>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t flex-shrink-0">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Paperclip className="h-4 w-4" /></Button>
              <Input
                placeholder="Ask the Compliance Assistant..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuerySubmit()}
                className="h-9 text-sm"
              />
              <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleQuerySubmit} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
