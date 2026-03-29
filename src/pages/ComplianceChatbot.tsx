import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sampleSessions, suggestedQuestions, ChatMessage, ChatSession, ChatSource } from '@/data/chatData';
import { Send, Plus, Paperclip, FileText, Database, BookOpen, MessageSquare, Zap, ExternalLink, Globe, Search, Bot, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type AIModel = 'perplexity' | 'claude' | 'gemini';

const modelInfo: Record<AIModel, { label: string; description: string; icon: string; badge: string }> = {
  perplexity: { label: 'Perplexity', description: 'Real-time web search & grounded answers', icon: '🔍', badge: 'Search + AI' },
  claude: { label: 'Claude (Anthropic)', description: 'Deep reasoning & analysis', icon: '🧠', badge: 'Reasoning' },
  gemini: { label: 'Google Gemini', description: 'Multimodal intelligence & large context', icon: '✨', badge: 'Multimodal' },
};

export default function ComplianceChatbot() {
  const [sessions, setSessions] = useState<ChatSession[]>(sampleSessions);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('perplexity');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [showScrapePanel, setShowScrapePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [activeSession?.messages.length]);

  const handleSend = () => {
    if (!input.trim() || !activeSession) return;
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    setInput('');
    setIsTyping(true);

    const delay = selectedModel === 'perplexity' ? 2000 : selectedModel === 'claude' ? 1800 : 1500;

    setTimeout(() => {
      const response: ChatMessage = {
        id: `m-${Date.now() + 1}`, role: 'assistant', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: generateMockResponse(input.trim(), selectedModel),
        sources: generateMockSources(input.trim(), selectedModel),
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, response] } : s));
      setIsTyping(false);
    }, delay);
  };

  const handleScrape = () => {
    if (!scrapeUrl.trim() || !activeSession) return;
    setIsScraping(true);

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`, role: 'user',
      content: `🌐 Scrape compliance requirements from: ${scrapeUrl.trim()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

    setTimeout(() => {
      const response: ChatMessage = {
        id: `m-${Date.now() + 1}`, role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: generateScrapeMockResponse(scrapeUrl.trim(), selectedModel),
        sources: [
          { type: 'regulation', label: 'Web Source', reference: scrapeUrl.trim(), url: scrapeUrl.trim() },
          { type: 'regulation', label: 'SEBI Official', reference: 'Cross-referenced', url: 'https://www.sebi.gov.in' },
        ],
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, response] } : s));
      setIsScraping(false);
      setScrapeUrl('');
      setShowScrapePanel(false);
    }, 3000);
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`, title: 'New Conversation', date: new Date().toISOString().split('T')[0],
      messages: [{ id: `m-${Date.now()}`, role: 'assistant', content: `Hello! I'm your SEBI Compliance Assistant powered by **${modelInfo[selectedModel].label}**. I can:\n\n- 📋 Answer questions about SEBI regulations (LODR, PIT, SAST)\n- 🌐 Scrape websites for the latest compliance requirements\n- 📊 Analyze your compliance register and risk exposure\n- 📄 Search through your document vault\n\nHow can I help you today?`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const sourceIcon = (type: string) => {
    switch (type) {
      case 'regulation': return <BookOpen className="h-3 w-3" />;
      case 'vault': return <FileText className="h-3 w-3" />;
      case 'register': return <Database className="h-3 w-3" />;
      case 'web': return <Globe className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <AppLayout title="Compliance Chatbot" subtitle="Module 5 — AI-Powered SEBI Compliance Assistant">
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Session Sidebar */}
        <Card className="w-64 flex-shrink-0 flex flex-col hidden lg:flex">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold">Chat History</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewChat}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-2 space-y-1">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${s.id === activeSessionId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'}`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{s.title}</span>
                </div>
                <p className="text-[10px] opacity-60 ml-5">{s.date}</p>
              </button>
            ))}
          </CardContent>

          {/* AI Model Selector */}
          <div className="p-3 border-t space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">AI Assistant</p>
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modelInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <div>
                        <span className="font-medium">{info.label}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">{modelInfo[selectedModel].description}</p>
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0 border-b">
            <div className="flex items-center gap-2 flex-wrap">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">SEBI Compliance Intelligence</CardTitle>
              <Badge variant="outline" className="text-[10px] gap-1">
                <span>{modelInfo[selectedModel].icon}</span>
                {modelInfo[selectedModel].label}
              </Badge>
              <Badge className="text-[10px] ml-auto bg-primary/10 text-primary hover:bg-primary/20 border-0">
                {modelInfo[selectedModel].badge}
              </Badge>

              {/* Mobile model selector */}
              <div className="lg:hidden">
                <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
                  <SelectTrigger className="h-7 text-[10px] w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(modelInfo).map(([key, info]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        <span>{info.icon} {info.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          {/* Web Scrape Panel */}
          {showScrapePanel && (
            <div className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                <Input
                  placeholder="Enter URL to scrape compliance requirements (e.g., https://www.sebi.gov.in/...)"
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScrape()}
                  className="h-8 text-xs flex-1"
                />
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleScrape} disabled={!scrapeUrl.trim() || isScraping}>
                  {isScraping ? (
                    <>
                      <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3" />
                      Scrape
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowScrapePanel(false)}>Cancel</Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-3xl mx-auto pl-6">
                Powered by {modelInfo[selectedModel].label} — extracts and analyzes compliance requirements from any URL
              </p>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {activeSession?.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <div className="text-xs whitespace-pre-wrap leading-relaxed">
                      {msg.content.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold mt-2 mb-1">{line.slice(2, -2)}</p>;
                        if (line.startsWith('- ')) return <p key={i} className="ml-3">• {line.slice(2)}</p>;
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/30 space-y-1">
                        <p className="text-[10px] font-semibold opacity-70">💡 Sources:</p>
                        {msg.sources.map((src, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] opacity-70 hover:opacity-100 cursor-pointer">
                            {sourceIcon(src.type)}
                            <span>[{src.label}] {src.reference}</span>
                            {src.url && <ExternalLink className="h-2.5 w-2.5" />}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{modelInfo[selectedModel].label} is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              {isScraping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-[10px] text-muted-foreground">Scraping and analyzing with {modelInfo[selectedModel].label}...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {activeSession?.messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Suggested questions</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <Button key={i} variant="outline" size="sm" className="text-[11px] h-7" onClick={() => { setInput(q); }}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t flex-shrink-0">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <Button
                variant={showScrapePanel ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                onClick={() => setShowScrapePanel(!showScrapePanel)}
                title="Scrape website for compliance requirements"
              >
                <Globe className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Paperclip className="h-4 w-4" /></Button>
              <Input
                placeholder={`Ask ${modelInfo[selectedModel].label} about SEBI compliance...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="h-9 text-sm"
              />
              <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSend} disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function generateMockResponse(query: string, model: AIModel): string {
  const q = query.toLowerCase();
  const modelLabel = modelInfo[model].label;

  const perplexityPrefix = model === 'perplexity' ? '🔍 **Web Search Results** (real-time)\n\n' : '';
  const claudePrefix = model === 'claude' ? '🧠 **Deep Analysis**\n\n' : '';
  const geminiPrefix = model === 'gemini' ? '✨ **Gemini Analysis**\n\n' : '';
  const prefix = perplexityPrefix || claudePrefix || geminiPrefix;

  if (q.includes('deadline') || q.includes('due')) {
    return `${prefix}Based on ${model === 'perplexity' ? 'the latest SEBI circulars and' : ''} the current compliance register, here are the upcoming deadlines for Q4 FY26:\n\n**1. Financial Results (Reg 33)**\n- Standalone: Due within 45 days of quarter end (May 15, 2026)\n- Consolidated: Due within 45 days of quarter end (May 15, 2026)\n\n**2. Shareholding Pattern (Reg 31)**\n- Due within 21 days of quarter end (April 21, 2026)\n\n**3. Corporate Governance Report (Reg 27)**\n- Due within 15 days of quarter end (April 15, 2026)\n\n**4. Statement of Deviation (Reg 32)**\n- Due along with financial results\n\n⚠️ 3 items are currently marked as Due Soon in your register.${model === 'perplexity' ? '\n\n📰 Latest: SEBI Circular dated Mar 15, 2026 extends the deadline for listed entities with market cap below ₹250 Cr.' : ''}`;
  }
  if (q.includes('overdue') || q.includes('pending')) {
    return `${prefix}Currently, there are **20 overdue** compliance items in the register. Here's a breakdown:\n\n**By Category:**\n- Financial Results & Statements: 4 items\n- Corporate Governance: 3 items\n- Shareholding Disclosures: 2 items\n- Insider Trading (PIT): 3 items\n- Other categories: 8 items\n\n**Highest Risk:**\n- LODR Reg 33 Financial Results — 15 days overdue (Critical)\n- PIT Reg 7 Annual Disclosures — 10 days overdue (High)\n\n${model === 'claude' ? '**Root Cause Analysis:**\nBased on pattern analysis, 60% of overdue items are due to delayed board approvals. Consider implementing automated reminders 7 days before due dates.\n\n' : ''}Would you like me to generate a detailed report or help prioritize the remediation?`;
  }
  if (q.includes('penalty') || q.includes('fine')) {
    return `${prefix}Here are the key penalty provisions under SEBI regulations:\n\n**1. SEBI Act Section 15A — Non-disclosure penalty**\n- Up to ₹1 crore per violation\n- Applicable for: Late filing, non-filing of reports\n\n**2. Stock Exchange Fines**\n- NSE/BSE: ₹5,000 per day of delay (auto-imposed)\n- Extended delay: Trading suspension possible\n\n**3. SEBI Act Section 15H — Insider Trading**\n- Up to ₹25 crore or 3x profit (whichever is higher)\n\n**4. Companies Act 2013**\n- Section 450: ₹10,000 per day (general default)\n- Section 447: Fraud — imprisonment up to 10 years\n\nFor your company, the estimated exposure for current overdue items is approximately **₹3.5 lakhs** in exchange fines.${model === 'perplexity' ? '\n\n📰 Recent enforcement: SEBI imposed ₹2.5 Cr fine on XYZ Ltd for repeated non-compliance with Reg 33 (Source: SEBI Order dated Mar 10, 2026).' : ''}`;
  }
  if (q.includes('latest') || q.includes('circular') || q.includes('update') || q.includes('new')) {
    return `${prefix}${model === 'perplexity' ? '**Latest SEBI Regulatory Updates (March 2026):**\n\n' : '**Recent Compliance Updates:**\n\n'}**1. SEBI/HO/CFD/PoD2/CIR/P/2026/42 (Mar 22, 2026)**\n- ESG Reporting: Enhanced BRSR Core framework for Top 150 listed companies\n- Mandatory from FY2026-27; Reasonable Assurance required from FY2027-28\n\n**2. SEBI/HO/MIRSD/DOP/CIR/P/2026/38 (Mar 18, 2026)**\n- Revised timelines for dematerialization-related compliances\n- Applicable to all listed entities\n\n**3. SEBI/HO/CFD/CMD2/CIR/P/2026/35 (Mar 12, 2026)**\n- Amendments to Related Party Transaction framework under LODR\n- Enhanced disclosure requirements for material RPTs\n\n${model === 'gemini' ? '**Impact Analysis for Your Company:**\nBased on your market cap category (Top 500), all 3 circulars are applicable. I recommend updating 5 compliance items in your register to reflect these changes.\n\n' : ''}Would you like me to map these to your compliance register?`;
  }
  return `${prefix}That's a great question about SEBI compliance. Based on my analysis${model === 'perplexity' ? ' of the latest web sources and' : ''} of the regulatory framework and your company's compliance register:\n\n**Key Points:**\n- The relevant regulation covers this requirement under the LODR/PIT/SAST framework\n- Your company's current compliance status shows this area needs attention\n- I recommend reviewing the specific regulation reference and associated documents in the vault\n\n**Recommended Actions:**\n- Check the Master Compliance Register for related items\n- Review any pending approvals in Module 3\n- Consult the Documentation Vault for supporting evidence\n\n${model === 'claude' ? '**Strategic Recommendation:**\nConsidering the regulatory trend analysis, I suggest proactively updating your compliance framework to align with the anticipated Q2 2026 SEBI amendments.\n\n' : ''}Would you like me to provide more specific details on any of these points?`;
}

function generateMockSources(query: string, model: AIModel): ChatSource[] {
  const baseSources: ChatSource[] = [
    { type: 'regulation', label: 'SEBI LODR 2015', reference: 'Relevant Regulation', url: 'https://www.sebi.gov.in' },
    { type: 'regulation', label: 'SEBI LODR Amendment (20 Jan 2026)', reference: 'SEBI/HO/CFD/CFD-PoD-2/P/CIR/2026/07', url: 'https://www.sebi.gov.in' },
    { type: 'register', label: 'Compliance Register', reference: 'Related Items' },
  ];

  if (model === 'perplexity') {
    return [
      ...baseSources,
      { type: 'web', label: 'SEBI Circular', reference: 'sebi.gov.in/circulars', url: 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=2&ssid=9' },
      { type: 'web', label: 'NSE India', reference: 'nseindia.com/regulations', url: 'https://www.nseindia.com/regulations' },
    ];
  }
  return baseSources;
}

function generateScrapeMockResponse(url: string, model: AIModel): string {
  const modelLabel = modelInfo[model].label;
  const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();

  return `🌐 **Web Scraping Complete** — Powered by ${modelLabel}\n\n**Source:** ${domain}\n**Pages Analyzed:** 3\n**Compliance Items Found:** 7\n\n**Extracted Requirements:**\n\n**1. Quarterly Financial Disclosure**\n- Regulation: LODR Reg 33(3)(a)\n- Frequency: Quarterly\n- Due: Within 45 days of quarter end\n- Status: ⚠️ Not in your register — recommend adding\n\n**2. Annual Secretarial Compliance Report**\n- Regulation: LODR Reg 24A\n- Frequency: Annual\n- Due: Within 60 days of FY end\n- Status: ✅ Already in register (Item #42)\n\n**3. Related Party Transaction Disclosure**\n- Regulation: LODR Reg 23(9)\n- Frequency: Half-yearly\n- Due: Within 15 days of half-year end\n- Status: ⚠️ Details need updating in register\n\n**4. Corporate Governance Compliance**\n- Regulation: LODR Reg 27(2)\n- Frequency: Quarterly\n- Due: Within 15 days of quarter end\n- Status: ✅ Already in register (Item #15)\n\n**5. Insider Trading Code Updates**\n- Regulation: PIT Reg 8(1)\n- Frequency: Event-based\n- Trigger: Any amendment to code of conduct\n- Status: ⚠️ Last review was 8 months ago\n\n**6. Structured Digital Database**\n- Regulation: PIT Reg 3(5)\n- Frequency: Continuous\n- Status: ✅ Active\n\n**7. Substantial Acquisition Disclosure**\n- Regulation: SAST Reg 29(2)\n- Frequency: Event-based\n- Status: ✅ Already in register\n\n**Summary:**\n- ✅ 4 items already tracked in your register\n- ⚠️ 2 items need updates\n- 🆕 1 new item recommended for addition\n\nWould you like me to:\n1. Add the missing item to your compliance register?\n2. Update the 2 items that need revision?\n3. Generate a detailed comparison report?`;
}
