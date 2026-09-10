export type ApprovalDecision = 'Pending' | 'Approved' | 'Declined';

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface ApprovalRequest {
  id: string;
  itemId: number;
  filingId: string | null;
  requestedBy: string;
  approver: string;
  approverEmail: string;
  requestedOn: string;
  dueBy: string;
  note: string;
  status: ApprovalDecision;
  decidedOn: string | null;
  decidedBy: string | null;
  decisionNote: string;
  notifications: EmailNotification[];
}

export const approverDirectory: Record<string, string> = {
  'Suresh Mehta (Director)': 'suresh.mehta@example.com',
  'Kavita Rao (Audit Chair)': 'kavita.rao@example.com',
  'Deepak Gupta (MD)': 'deepak.gupta@example.com',
  'Ritu Agarwal (ID)': 'ritu.agarwal@example.com',
};

export function approverEmail(name: string): string {
  if (approverDirectory[name]) return approverDirectory[name];
  const slug = name.replace(/\(.*\)/, '').trim().toLowerCase().replace(/[^a-z]+/g, '.');
  return `${slug || 'approver'}@example.com`;
}
