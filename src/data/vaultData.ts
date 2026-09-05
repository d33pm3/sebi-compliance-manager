export type VaultDocStatus = 'Pending' | 'Responded' | 'Closed' | 'Uploaded' | 'Filed';

export interface VaultDocument {
  id: string;
  vaultId: string;
  title: string;
  category: string;
  section: 'compliance-filings' | 'sebi-notices' | 'regulatory-docs' | 'agent-outputs';
  documentType: string;
  fiscalYear: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  fileType: string;
  regulation: string;
  status?: VaultDocStatus;
  responseDue?: string;
  issuedBy?: string;
  noticeNo?: string;
  /** Explicit link to the Master Compliance Register item (single source of truth) */
  itemId?: number;
  /** Object URL of a genuinely uploaded file, so it can be opened / downloaded */
  fileUrl?: string;
  fileName?: string;
}


export const vaultDocuments: VaultDocument[] = [
  // Section A: Compliance Filings
  { id: '1', vaultId: 'VAULT-LODR-202604-001', title: 'Q4 Financial Results BSE Filing', category: 'Financial Results & Statements', section: 'compliance-filings', documentType: 'Filing', fiscalYear: 'FY2025-26', uploadedBy: 'Priya Mehta', uploadedAt: '2026-04-15', fileSize: '2.4 MB', fileType: 'PDF', regulation: 'LODR Reg 33' },
  { id: '2', vaultId: 'VAULT-LODR-202604-002', title: 'Q4 Shareholding Pattern NSE', category: 'Shareholding & Ownership Disclosures', section: 'compliance-filings', documentType: 'Filing', fiscalYear: 'FY2025-26', uploadedBy: 'Priya Mehta', uploadedAt: '2026-04-18', fileSize: '1.8 MB', fileType: 'XLSX', regulation: 'LODR Reg 31' },
  { id: '3', vaultId: 'VAULT-LODR-202601-003', title: 'Corporate Governance Report Q3', category: 'Corporate Governance', section: 'compliance-filings', documentType: 'Filing', fiscalYear: 'FY2025-26', uploadedBy: 'Rajesh Kumar', uploadedAt: '2026-01-14', fileSize: '3.1 MB', fileType: 'PDF', regulation: 'LODR Reg 27' },
  { id: '4', vaultId: 'VAULT-PIT-202603-001', title: 'Trading Window Closure Notice', category: 'Insider Trading (PIT)', section: 'compliance-filings', documentType: 'Notice', fiscalYear: 'FY2025-26', uploadedBy: 'Rajesh Kumar', uploadedAt: '2026-03-01', fileSize: '0.5 MB', fileType: 'PDF', regulation: 'PIT Reg 9' },
  { id: '5', vaultId: 'VAULT-LODR-202603-004', title: 'Annual Secretarial Compliance Report', category: 'Secretarial & Board Governance', section: 'compliance-filings', documentType: 'Report', fiscalYear: 'FY2025-26', uploadedBy: 'Priya Mehta', uploadedAt: '2026-03-28', fileSize: '4.2 MB', fileType: 'PDF', regulation: 'LODR Reg 24A' },
  { id: '6', vaultId: 'VAULT-LODR-202602-005', title: 'Related Party Transactions Report H2', category: 'Related Party Transactions', section: 'compliance-filings', documentType: 'Report', fiscalYear: 'FY2025-26', uploadedBy: 'Anjali Desai', uploadedAt: '2026-02-20', fileSize: '1.2 MB', fileType: 'PDF', regulation: 'LODR Reg 23' },
  { id: '7', vaultId: 'VAULT-LODR-202604-006', title: 'Statement of Deviation Q4', category: 'Fund Raising & Capital Events', section: 'compliance-filings', documentType: 'Statement', fiscalYear: 'FY2025-26', uploadedBy: 'Rajesh Kumar', uploadedAt: '2026-04-20', fileSize: '0.8 MB', fileType: 'PDF', regulation: 'LODR Reg 32' },
  { id: '8', vaultId: 'VAULT-LODR-202601-007', title: 'Investor Grievance Report Q3', category: 'Investor Relations & Grievance', section: 'compliance-filings', documentType: 'Report', fiscalYear: 'FY2025-26', uploadedBy: 'Anjali Desai', uploadedAt: '2026-01-15', fileSize: '0.6 MB', fileType: 'PDF', regulation: 'LODR Reg 13' },
  { id: '9', vaultId: 'VAULT-LODR-202604-008', title: 'AGM Outcome Intimation', category: 'Annual & General Compliance', section: 'compliance-filings', documentType: 'Filing', fiscalYear: 'FY2025-26', uploadedBy: 'Priya Mehta', uploadedAt: '2026-04-25', fileSize: '1.1 MB', fileType: 'PDF', regulation: 'LODR Reg 30' },
  { id: '10', vaultId: 'VAULT-SAST-202603-001', title: 'SAST Disclosure Feb 2026', category: 'Takeover & Buyback (SAST)', section: 'compliance-filings', documentType: 'Disclosure', fiscalYear: 'FY2025-26', uploadedBy: 'Rajesh Kumar', uploadedAt: '2026-03-10', fileSize: '0.4 MB', fileType: 'PDF', regulation: 'SAST Reg 29' },

  // Section B: SEBI Notices
  { id: '11', vaultId: 'VAULT-SEBI-NOTICE-202603-001', title: 'SCN — Non-submission of CG Report Q2', category: 'SEBI Notice', section: 'sebi-notices', documentType: 'Show Cause Notice', fiscalYear: 'FY2025-26', uploadedBy: 'Admin', uploadedAt: '2026-03-05', fileSize: '1.8 MB', fileType: 'PDF', regulation: 'LODR Reg 27', status: 'Responded', responseDue: '2026-03-20', issuedBy: 'SEBI', noticeNo: 'SEBI/CFD/2026/0341' },
  { id: '12', vaultId: 'VAULT-SEBI-NOTICE-202604-002', title: 'Inquiry — Insider Trading Allegation', category: 'SEBI Notice', section: 'sebi-notices', documentType: 'Inquiry', fiscalYear: 'FY2025-26', uploadedBy: 'Admin', uploadedAt: '2026-04-02', fileSize: '2.3 MB', fileType: 'PDF', regulation: 'PIT Reg 3', status: 'Pending', responseDue: '2026-04-25', issuedBy: 'SEBI', noticeNo: 'SEBI/ISD/2026/0198' },
  { id: '13', vaultId: 'VAULT-NSE-NOTICE-202602-001', title: 'Penalty Notice — Late Filing Shareholding Pattern', category: 'Exchange Notice', section: 'sebi-notices', documentType: 'Penalty Notice', fiscalYear: 'FY2025-26', uploadedBy: 'Admin', uploadedAt: '2026-02-18', fileSize: '0.9 MB', fileType: 'PDF', regulation: 'LODR Reg 31', status: 'Closed', responseDue: '2026-03-05', issuedBy: 'NSE', noticeNo: 'NSE/LIST/2026/0412' },
  { id: '14', vaultId: 'VAULT-BSE-NOTICE-202604-001', title: 'Advisory — New XBRL Filing Format', category: 'Exchange Notice', section: 'sebi-notices', documentType: 'Advisory', fiscalYear: 'FY2025-26', uploadedBy: 'Admin', uploadedAt: '2026-04-10', fileSize: '0.3 MB', fileType: 'PDF', regulation: 'LODR Reg 33', status: 'Pending', responseDue: '2026-05-01', issuedBy: 'BSE', noticeNo: 'BSE/CORP/2026/0087' },

  // Section C: Regulatory Docs
  { id: '15', vaultId: 'VAULT-CIRC-202601-001', title: 'Master Circular — LODR Compliance', category: 'Master Circular', section: 'regulatory-docs', documentType: 'Circular', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-01-10', fileSize: '5.6 MB', fileType: 'PDF', regulation: 'LODR 2015' },
  { id: '16', vaultId: 'VAULT-CIRC-202603-002', title: 'Amendment — PIT Regulations 2015 (Jan 2026)', category: 'Amendment', section: 'regulatory-docs', documentType: 'Amendment', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-03-15', fileSize: '1.2 MB', fileType: 'PDF', regulation: 'PIT 2015' },
  { id: '17', vaultId: 'VAULT-CIRC-202604-003', title: 'Circular — ESG Disclosure Framework', category: 'Circular', section: 'regulatory-docs', documentType: 'Circular', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-04-05', fileSize: '2.1 MB', fileType: 'PDF', regulation: 'LODR Reg 34' },

  // Section D: Agent Outputs
  { id: '18', vaultId: 'VAULT-AGENT-20260415-001', title: 'Master Compliance Register — Run Apr 15', category: 'Agent Output', section: 'agent-outputs', documentType: 'Excel', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-04-15', fileSize: '0.9 MB', fileType: 'XLSX', regulation: 'All' },
  { id: '19', vaultId: 'VAULT-AGENT-20260415-002', title: 'Filing Calendar — Run Apr 15', category: 'Agent Output', section: 'agent-outputs', documentType: 'Excel', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-04-15', fileSize: '0.4 MB', fileType: 'XLSX', regulation: 'All' },
  { id: '20', vaultId: 'VAULT-AGENT-20260415-003', title: 'Event Trigger Map — Run Apr 15', category: 'Agent Output', section: 'agent-outputs', documentType: 'Excel', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-04-15', fileSize: '0.3 MB', fileType: 'XLSX', regulation: 'All' },
  { id: '21', vaultId: 'VAULT-AGENT-20260415-004', title: 'Amendment Tracker — Run Apr 15', category: 'Agent Output', section: 'agent-outputs', documentType: 'Excel', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-04-15', fileSize: '0.5 MB', fileType: 'XLSX', regulation: 'All' },
  { id: '22', vaultId: 'VAULT-AGENT-20260401-001', title: 'Master Compliance Register — Run Apr 1', category: 'Agent Output', section: 'agent-outputs', documentType: 'Excel', fiscalYear: 'FY2025-26', uploadedBy: 'System Agent', uploadedAt: '2026-04-01', fileSize: '0.8 MB', fileType: 'XLSX', regulation: 'All' },
];

export const vaultSections = [
  { key: 'compliance-filings', label: 'Compliance Filings', icon: 'FileText' },
  { key: 'sebi-notices', label: 'SEBI Notices & Orders', icon: 'AlertTriangle' },
  { key: 'regulatory-docs', label: 'Regulatory Documents', icon: 'BookOpen' },
  { key: 'agent-outputs', label: 'Agent Outputs', icon: 'Bot' },
] as const;

export const vaultCategories = [
  'All Documents',
  'Financial Results & Statements',
  'Shareholding & Ownership Disclosures',
  'Corporate Governance',
  'Insider Trading (PIT)',
  'Secretarial & Board Governance',
  'Related Party Transactions',
  'Fund Raising & Capital Events',
  'Investor Relations & Grievance',
  'Annual & General Compliance',
  'Takeover & Buyback (SAST)',
  'SEBI Notice',
  'Exchange Notice',
  'Master Circular',
  'Amendment',
  'Circular',
  'Agent Output',
];
