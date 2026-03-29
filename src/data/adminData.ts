export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Compliance Officer' | 'Company Secretary' | 'Board Member' | 'Auditor' | 'Legal Counsel' | 'Viewer';
  department: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
  assignedOwner: number;
  assignedApprover: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  module: string;
  ip: string;
}

export interface SystemHealth {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency?: string;
  details?: string;
}

export const mockUsers: User[] = [
  { id: '1', name: 'Priya Mehta', email: 'priya.mehta@e-cxo.com', role: 'Compliance Officer', department: 'Legal & Compliance', lastLogin: '2026-03-29 09:15', status: 'Active', assignedOwner: 28, assignedApprover: 0 },
  { id: '2', name: 'Rajesh Kumar', email: 'rajesh.kumar@e-cxo.com', role: 'Company Secretary', department: 'Corporate Secretarial', lastLogin: '2026-03-29 08:30', status: 'Active', assignedOwner: 35, assignedApprover: 15 },
  { id: '3', name: 'Anjali Desai', email: 'anjali.desai@e-cxo.com', role: 'Compliance Officer', department: 'Legal & Compliance', lastLogin: '2026-03-28 17:45', status: 'Active', assignedOwner: 20, assignedApprover: 0 },
  { id: '4', name: 'Vikram Singh', email: 'vikram.singh@e-cxo.com', role: 'Administrator', department: 'IT', lastLogin: '2026-03-29 10:00', status: 'Active', assignedOwner: 0, assignedApprover: 0 },
  { id: '5', name: 'Neha Sharma', email: 'neha.sharma@e-cxo.com', role: 'Board Member', department: 'Board', lastLogin: '2026-03-25 14:00', status: 'Active', assignedOwner: 0, assignedApprover: 25 },
  { id: '6', name: 'Arjun Patel', email: 'arjun.patel@e-cxo.com', role: 'Auditor', department: 'Internal Audit', lastLogin: '2026-03-27 11:30', status: 'Active', assignedOwner: 10, assignedApprover: 18 },
  { id: '7', name: 'Sunita Rao', email: 'sunita.rao@e-cxo.com', role: 'Legal Counsel', department: 'Legal', lastLogin: '2026-03-28 16:20', status: 'Active', assignedOwner: 0, assignedApprover: 35 },
  { id: '8', name: 'Amit Gupta', email: 'amit.gupta@e-cxo.com', role: 'Viewer', department: 'Finance', lastLogin: '2026-03-20 09:00', status: 'Inactive', assignedOwner: 0, assignedApprover: 0 },
];

export const mockAuditLogs: AuditLog[] = [
  { id: '1', timestamp: '2026-03-29 10:15:32', user: 'Priya Mehta', action: 'UPDATE_STATUS', entityType: 'ComplianceItem', entityId: 'LODR-012', details: 'Status changed from Pending to Completed', module: 'M3', ip: '192.168.1.45' },
  { id: '2', timestamp: '2026-03-29 09:48:11', user: 'Rajesh Kumar', action: 'APPROVE', entityType: 'ComplianceItem', entityId: 'LODR-005', details: 'Approved Statement of Deviation Q4', module: 'M3', ip: '192.168.1.22' },
  { id: '3', timestamp: '2026-03-29 09:15:00', user: 'Priya Mehta', action: 'LOGIN', entityType: 'User', entityId: 'USR-001', details: 'Successful login', module: 'Auth', ip: '192.168.1.45' },
  { id: '4', timestamp: '2026-03-28 17:30:05', user: 'System Agent', action: 'AGENT_RUN', entityType: 'Agent', entityId: 'RUN-20260328', details: 'Compliance Agent completed — 93 items extracted', module: 'M1', ip: '10.0.0.1' },
  { id: '5', timestamp: '2026-03-28 16:22:18', user: 'Anjali Desai', action: 'UPLOAD', entityType: 'Document', entityId: 'VAULT-LODR-202603-004', details: 'Uploaded Annual Secretarial Compliance Report', module: 'M4', ip: '192.168.1.67' },
  { id: '6', timestamp: '2026-03-28 15:10:44', user: 'Rajesh Kumar', action: 'REJECT', entityType: 'ComplianceItem', entityId: 'PIT-003', details: 'Rejected — insufficient documentation', module: 'M3', ip: '192.168.1.22' },
  { id: '7', timestamp: '2026-03-28 14:05:30', user: 'Neha Sharma', action: 'COMMENT', entityType: 'ComplianceItem', entityId: 'LODR-027', details: 'Added review comment on RPT disclosure', module: 'M3', ip: '192.168.1.100' },
  { id: '8', timestamp: '2026-03-28 11:30:00', user: 'Vikram Singh', action: 'CREATE_USER', entityType: 'User', entityId: 'USR-008', details: 'Created user Amit Gupta with Viewer role', module: 'M7', ip: '192.168.1.10' },
  { id: '9', timestamp: '2026-03-27 16:45:12', user: 'Arjun Patel', action: 'DOWNLOAD', entityType: 'Document', entityId: 'VAULT-LODR-202604-001', details: 'Downloaded Q4 Financial Results BSE Filing', module: 'M4', ip: '192.168.1.88' },
  { id: '10', timestamp: '2026-03-27 10:20:33', user: 'Sunita Rao', action: 'APPROVE', entityType: 'ComplianceItem', entityId: 'SAST-001', details: 'Approved SAST disclosure filing', module: 'M3', ip: '192.168.1.55' },
  { id: '11', timestamp: '2026-03-26 14:30:00', user: 'System', action: 'ESCALATION', entityType: 'ComplianceItem', entityId: 'LODR-019', details: 'Auto-escalated — 5 days overdue', module: 'M2', ip: '10.0.0.1' },
  { id: '12', timestamp: '2026-03-26 09:00:00', user: 'System', action: 'NOTIFICATION', entityType: 'ComplianceItem', entityId: 'LODR-033', details: 'Due date reminder sent — 3 days remaining', module: 'M2', ip: '10.0.0.1' },
];

export const systemHealthItems: SystemHealth[] = [
  { name: 'API Server', status: 'online', latency: '12ms' },
  { name: 'Database', status: 'online', latency: '2ms' },
  { name: 'Redis Cache', status: 'online', latency: '1ms' },
  { name: 'S3 Storage', status: 'online' },
  { name: 'Claude API', status: 'online', latency: '180ms' },
  { name: 'SEBI Website', status: 'online', latency: '340ms' },
];

export const queueStats = [
  { name: 'AgentRunQueue', waiting: 0, active: 0 },
  { name: 'EmailQueue', waiting: 2, active: 0 },
  { name: 'PPTXQueue', waiting: 0, active: 0 },
];

export const last24hStats = {
  apiRequests: 1247,
  emailsSent: 34,
  documentsUploaded: 12,
  agentRuns: 2,
};

export const companySettings = {
  companyName: 'e-cxo Compliance Solutions Pvt. Ltd.',
  companyPAN: 'AABCE1234F',
  companyISIN: 'INE123A01016',
  listedNSE: true,
  listedBSE: true,
  marketCapCategory: 'Top 500',
  fiscalYearStart: 'April',
  complianceEmail: 'compliance@exco.com',
  cin: 'L12345MH2020PLC123456',
};
