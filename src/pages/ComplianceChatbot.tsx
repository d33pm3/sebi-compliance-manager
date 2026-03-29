import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { sampleSessions, suggestedQuestions, ChatMessage, ChatSession } from '@/data/chatData';
import { Send, Plus, Paperclip, FileText, Database, BookOpen, MessageSquare, Zap, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ComplianceChatbot() {
  const [sessions, setSessions] = useState<ChatSession[]>(sampleSessions);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

    setTimeout(() => {
      const response: ChatMessage = {
        id: `m-${Date.now() + 1}`, role: 'assistant', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: generateMockResponse(input.trim()),
        sources: [
          { type: 'regulation', label: 'SEBI LODR 2015', reference: 'Relevant Regulation', url: 'https://www.sebi.gov.in' },
          { type: 'register', label: 'Compliance Register', reference: 'Related Items' },
        ],
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, response] } : s));
      setIsTyping(false);
    }, 1500);
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`, title: 'New Conversation', date: new Date().toISOString().split('T')[0],
      messages: [{ id: `m-${Date.now()}`, role: 'assistant', content: "Hello! I'm your SEBI Compliance Assistant. I have access to all compliance requirements, documents, and regulatory updates. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const sourceIcon = (type: string) => {
    switch (type) {
      case 'regulation': return <BookOpen className="h-3 w-3" />;
      case 'vault': return <FileText className="h-3 w-3" />;
      case 'register': return <Database className="h-3 w-3" />;
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
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0 border-b">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">SEBI Compliance Intelligence</CardTitle>
              <Badge variant="outline" className="text-[10px] ml-auto">AI Assistant</Badge>
            </div>
          </CardHeader>

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
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Paperclip className="h-4 w-4" /></Button>
              <Input
                placeholder="Ask about SEBI compliance..."
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

function generateMockResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('deadline') || q.includes('due')) {
    return "Based on the current compliance register, here are the upcoming deadlines for Q4 FY26:\n\n**1. Financial Results (Reg 33)**\n- Standalone: Due within 45 days of quarter end (May 15, 2026)\n- Consolidated: Due within 45 days of quarter end (May 15, 2026)\n\n**2. Shareholding Pattern (Reg 31)**\n- Due within 21 days of quarter end (April 21, 2026)\n\n**3. Corporate Governance Report (Reg 27)**\n- Due within 15 days of quarter end (April 15, 2026)\n\n**4. Statement of Deviation (Reg 32)**\n- Due along with financial results\n\n⚠️ 3 items are currently marked as Due Soon in your register.";
  }
  if (q.includes('overdue') || q.includes('pending')) {
    return "Currently, there are **20 overdue** compliance items in the register. Here's a breakdown:\n\n**By Category:**\n- Financial Results & Statements: 4 items\n- Corporate Governance: 3 items\n- Shareholding Disclosures: 2 items\n- Insider Trading (PIT): 3 items\n- Other categories: 8 items\n\n**Highest Risk:**\n- LODR Reg 33 Financial Results — 15 days overdue (Critical)\n- PIT Reg 7 Annual Disclosures — 10 days overdue (High)\n\nWould you like me to generate a detailed report or help prioritize the remediation?";
  }
  if (q.includes('penalty') || q.includes('fine')) {
    return "Here are the key penalty provisions under SEBI regulations:\n\n**1. SEBI Act Section 15A — Non-disclosure penalty**\n- Up to ₹1 crore per violation\n- Applicable for: Late filing, non-filing of reports\n\n**2. Stock Exchange Fines**\n- NSE/BSE: ₹5,000 per day of delay (auto-imposed)\n- Extended delay: Trading suspension possible\n\n**3. SEBI Act Section 15H — Insider Trading**\n- Up to ₹25 crore or 3x profit (whichever is higher)\n\n**4. Companies Act 2013**\n- Section 450: ₹10,000 per day (general default)\n- Section 447: Fraud — imprisonment up to 10 years\n\nFor your company, the estimated exposure for current overdue items is approximately **₹3.5 lakhs** in exchange fines.";
  }
  return "That's a great question about SEBI compliance. Based on my analysis of the regulatory framework and your company's compliance register:\n\n**Key Points:**\n- The relevant regulation covers this requirement under the LODR/PIT/SAST framework\n- Your company's current compliance status shows this area needs attention\n- I recommend reviewing the specific regulation reference and associated documents in the vault\n\n**Recommended Actions:**\n- Check the Master Compliance Register for related items\n- Review any pending approvals in Module 3\n- Consult the Documentation Vault for supporting evidence\n\nWould you like me to provide more specific details on any of these points?";
}
