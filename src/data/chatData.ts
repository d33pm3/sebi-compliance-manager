export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: ChatSource[];
  attachedFile?: string;
}

export interface ChatSource {
  type: 'regulation' | 'vault' | 'register' | 'web';
  label: string;
  reference: string;
  url?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

export const sampleSessions: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Board Composition Requirements',
    date: '2026-03-29',
    messages: [
      { id: 'm1', role: 'assistant', content: "Hello! I'm your SEBI Compliance Assistant. I have access to all compliance requirements, documents, and regulatory updates. How can I help you today?", timestamp: '09:00' },
      { id: 'm2', role: 'user', content: 'What are the board composition requirements under SEBI LODR?', timestamp: '09:01' },
      { id: 'm3', role: 'assistant', content: "Under **Regulation 17 of SEBI LODR 2015**, the Board of Directors must comply with the following composition requirements:\n\n**1. Minimum Board Size**\n- At least 6 directors for top 2000 listed entities (by market cap)\n\n**2. Independent Directors**\n- At least 1/3rd of the Board shall be Independent Directors\n- If the Chairperson is a non-executive director: at least 1/3rd IDs\n- If the Chairperson is an executive/promoter: at least 1/2 IDs\n\n**3. Woman Director**\n- At least one woman director mandatory (Reg 17(1)(a))\n- Top 500 entities: at least one independent woman director\n- Top 1000 entities: at least one independent woman director (from April 2020)\n\n**4. Chairperson Requirements**\n- For top 500 entities: Chairperson shall be a non-executive director (Reg 17(1B))\n- Chairperson and MD/CEO shall not be related\n\n**5. Meeting Frequency**\n- At least 4 board meetings per year\n- Maximum gap of 120 days between two meetings", timestamp: '09:02', sources: [
        { type: 'regulation', label: 'SEBI LODR 2015', reference: 'Regulation 17(1)', url: 'https://www.sebi.gov.in/legal/regulations/sep-2015/securities-and-exchange-board-of-india-listing-obligations-and-disclosure-requirements-regulations-2015-last-amended-on-march-14-2025-_34260.html' },
        { type: 'vault', label: 'Corporate Governance Report FY26', reference: 'VAULT-LODR-202601-003' },
        { type: 'register', label: 'Board Composition Compliance', reference: 'LODR-001' },
      ]},
    ],
  },
  {
    id: 'session-2',
    title: 'PIT Trading Window Rules',
    date: '2026-03-28',
    messages: [
      { id: 'm4', role: 'assistant', content: "Hello! I'm your SEBI Compliance Assistant. How can I help you today?", timestamp: '14:00' },
      { id: 'm5', role: 'user', content: 'When should the trading window be closed under PIT regulations?', timestamp: '14:01' },
      { id: 'm6', role: 'assistant', content: "Under **Regulation 9 of SEBI PIT Regulations 2015**, the trading window must be closed during the following periods:\n\n**1. Financial Results**\n- Close the trading window when the Compliance Officer determines UPSI exists\n- Typically closed from end of the quarter until 48 hours after financial results are made public\n\n**2. Other Material Events**\n- Dividends, bonus, stock splits, mergers, acquisitions\n- Any event that constitutes UPSI under Reg 2(1)(n)\n\n**3. Duration**\n- Minimum closure period: typically 7-10 days before board meeting\n- Opens: 48 hours after information is made public\n\n**4. Who is restricted?**\n- Designated Persons and their immediate relatives\n- Connected Persons as defined under Reg 2(1)(d)\n\n**5. Pre-clearance**\n- Even when window is open, trades above ₹10 lakhs require pre-clearance\n- Pre-clearance valid for 7 trading days", timestamp: '14:02', sources: [
        { type: 'regulation', label: 'SEBI PIT 2015', reference: 'Regulation 9', url: 'https://www.sebi.gov.in/legal/regulations/jan-2015/securities-and-exchange-board-of-india-prohibition-of-insider-trading-regulations-2015_28989.html' },
        { type: 'vault', label: 'Trading Window Closure Notice', reference: 'VAULT-PIT-202603-001' },
      ]},
    ],
  },
  {
    id: 'session-3',
    title: 'Penalty for Late Filing',
    date: '2026-03-27',
    messages: [
      { id: 'm7', role: 'assistant', content: "Hello! How can I help with SEBI compliance today?", timestamp: '11:00' },
      { id: 'm8', role: 'user', content: 'What is the penalty for late submission of shareholding pattern?', timestamp: '11:01' },
      { id: 'm9', role: 'assistant', content: "The penalty for late submission of Shareholding Pattern under **Regulation 31 of SEBI LODR 2015** is as follows:\n\n**1. Stock Exchange Fine**\n- NSE/BSE impose a fine of **₹5,000 per day** of delay\n- This is typically auto-imposed by the exchange systems\n\n**2. SEBI Adjudication**\n- Under Section 15A of SEBI Act — penalty up to **₹1 crore per violation**\n- Under Section 23A of SCRA — penalty up to **₹25 crore**\n\n**3. Compounding**\n- Late filing can be compounded by paying a reduced penalty\n- Compounding amount depends on delay duration and company size\n\n**4. Additional Consequences**\n- Trading suspension possible for extended non-compliance\n- Freeze of promoter holdings in severe cases\n- Regulatory scrutiny and potential show-cause notice\n\n⚠️ **Current Status**: Your company has 1 pending shareholding pattern filing. Due date was March 21, 2026.", timestamp: '11:02', sources: [
        { type: 'regulation', label: 'SEBI LODR 2015', reference: 'Regulation 31; Schedule V Pt A', url: 'https://www.sebi.gov.in/legal/regulations/sep-2015/securities-and-exchange-board-of-india-listing-obligations-and-disclosure-requirements-regulations-2015-last-amended-on-march-14-2025-_34260.html' },
        { type: 'vault', label: 'NSE Penalty Notice', reference: 'VAULT-NSE-NOTICE-202602-001' },
      ]},
    ],
  },
];

export const suggestedQuestions = [
  'What are the LODR filing deadlines for Q4 FY26?',
  'List all event-triggered disclosures we need to make',
  'What is the penalty for non-compliance with Reg 30?',
  'Explain the SAST disclosure requirements',
  'What documents are pending approval?',
  'How many compliances are overdue this quarter?',
];
