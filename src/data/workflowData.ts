import { ComplianceItem, RiskLevel } from '@/data/complianceData';

/* ------------------------------------------------------------------ */
/* Filing submissions                                                  */
/* ------------------------------------------------------------------ */

export interface FilingSubmission {
  id: string;
  itemId: number;
  filingName: string;
  category: string;
  referenceNo: string;
  filingDate: string;
  submittedBy: string;
  approver: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedOn: string | null;
  documents: string[];
  remarks: string;
  vaultId: string;
}

/* ------------------------------------------------------------------ */
/* To-do tasks attached to a compliance item                           */
/* ------------------------------------------------------------------ */

export type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'Done';

export interface ComplianceTask {
  id: string;
  itemId: number;
  title: string;
  owner: string;
  deadline: string;
  status: TaskStatus;
  createdAt: string;
}

const taskTemplates = [
  'Collect supporting data from Finance',
  'Prepare draft filing and internal checklist',
  'Obtain approver sign-off',
  'Upload evidence to the Document Vault',
];

const taskOwners = ['Priya Sharma (CS)', 'Rajesh Kumar (CFO)', 'Anita Desai (Legal)', 'Vikram Singh (Compliance)'];

export function seedTasks(items: ComplianceItem[]): ComplianceTask[] {
  const tasks: ComplianceTask[] = [];
  items.forEach((item, idx) => {
    // Seed a to-do list for every item that is not already closed out
    const count = item.status === 'Completed' ? 1 : item.status === 'Overdue' ? 3 : 2;
    for (let t = 0; t < count; t++) {
      const due = new Date(item.dueDate);
      due.setDate(due.getDate() - (count - t) * 3);
      tasks.push({
        id: `T-${item.id}-${t + 1}`,
        itemId: item.id,
        title: taskTemplates[t % taskTemplates.length],
        owner: taskOwners[(idx + t) % taskOwners.length],
        deadline: due.toISOString().split('T')[0],
        status:
          item.status === 'Completed'
            ? 'Done'
            : item.status === 'Overdue'
              ? t === 0
                ? 'Done'
                : 'Blocked'
              : t === 0
                ? 'In Progress'
                : 'Open',
        createdAt: '2026-04-01',
      });
    }
  });
  return tasks;
}

/* ------------------------------------------------------------------ */
/* SEBI notice response tracker                                        */
/* ------------------------------------------------------------------ */

export type NoticeResponseStatus = 'Awaiting Response' | 'Drafting' | 'Submitted' | 'Closed';

export interface NoticeResponse {
  noticeId: string;
  noticeNo: string;
  subject: string;
  issuedBy: string;
  regulation: string;
  receivedOn: string;
  responseDue: string;
  responseStatus: NoticeResponseStatus;
  responseDate: string | null;
  submittedDocuments: string[];
  owner: string;
  remarks: string;
  riskStatus: 'Open' | 'Mitigating' | 'Closed';
}

export const noticeResponses: NoticeResponse[] = [
  {
    noticeId: '11',
    noticeNo: 'SEBI/CFD/2026/0341',
    subject: 'Show Cause Notice — Non-submission of Corporate Governance Report Q2',
    issuedBy: 'SEBI',
    regulation: 'LODR Reg 27',
    receivedOn: '2026-03-05',
    responseDue: '2026-03-20',
    responseStatus: 'Submitted',
    responseDate: '2026-03-18',
    submittedDocuments: ['Reply to SCN dated 18 Mar 2026.pdf', 'Corporate Governance Report Q2.pdf'],
    owner: 'Priya Sharma (CS)',
    remarks: 'Reply filed within timeline; awaiting SEBI acknowledgement.',
    riskStatus: 'Mitigating',
  },
  {
    noticeId: '12',
    noticeNo: 'SEBI/ISD/2026/0198',
    subject: 'Inquiry — Insider Trading Allegation',
    issuedBy: 'SEBI',
    regulation: 'PIT Reg 3',
    receivedOn: '2026-04-02',
    responseDue: '2026-04-25',
    responseStatus: 'Drafting',
    responseDate: null,
    submittedDocuments: [],
    owner: 'Anita Desai (Legal)',
    remarks: 'Legal counsel engaged; trading window records under compilation.',
    riskStatus: 'Open',
  },
  {
    noticeId: '13',
    noticeNo: 'NSE/LIST/2026/0412',
    subject: 'Penalty Notice — Late Filing of Shareholding Pattern',
    issuedBy: 'NSE',
    regulation: 'LODR Reg 31',
    receivedOn: '2026-02-18',
    responseDue: '2026-03-05',
    responseStatus: 'Closed',
    responseDate: '2026-02-28',
    submittedDocuments: ['Penalty payment challan.pdf', 'Explanation letter.pdf'],
    owner: 'Rajesh Kumar (CFO)',
    remarks: 'Fine paid; exchange confirmed closure.',
    riskStatus: 'Closed',
  },
  {
    noticeId: '14',
    noticeNo: 'BSE/CORP/2026/0087',
    subject: 'Advisory — New XBRL Filing Format',
    issuedBy: 'BSE',
    regulation: 'LODR Reg 33',
    receivedOn: '2026-04-10',
    responseDue: '2026-05-01',
    responseStatus: 'Awaiting Response',
    responseDate: null,
    submittedDocuments: [],
    owner: 'Vikram Singh (Compliance)',
    remarks: 'Confirmation of readiness to be filed on the exchange portal.',
    riskStatus: 'Open',
  },
];

/* ------------------------------------------------------------------ */
/* Notice-derived risk register items                                  */
/* ------------------------------------------------------------------ */

export interface NoticeRiskItem {
  id: string;
  noticeNo: string;
  subject: string;
  source: string;
  regulation: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  riskStatus: 'Open' | 'Mitigating' | 'Closed';
  deadline: string;
  owner: string;
  responseStatus: NoticeResponseStatus;
  daysToDeadline: number;
}

export function buildNoticeRisks(responses: NoticeResponse[], today = new Date()): NoticeRiskItem[] {
  return responses.map(n => {
    const due = new Date(n.responseDue);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    const riskLevel: NoticeRiskItem['riskLevel'] =
      n.riskStatus === 'Closed' ? 'Low' : days < 0 ? 'Critical' : n.responseStatus === 'Submitted' ? 'Medium' : 'High';
    return {
      id: `RISK-NOTICE-${n.noticeNo.replace(/[^A-Za-z0-9]/g, '-')}`,
      noticeNo: n.noticeNo,
      subject: n.subject,
      source: n.issuedBy,
      regulation: n.regulation,
      riskLevel,
      riskStatus: n.riskStatus,
      deadline: n.responseDue,
      owner: n.owner,
      responseStatus: n.responseStatus,
      daysToDeadline: days,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Shared compliance state derivation (single source of truth)         */
/* ------------------------------------------------------------------ */

export type ComplianceState = 'Completed' | 'Overdue' | 'Documents Missing' | 'On Track';

export function deriveComplianceState(item: ComplianceItem): ComplianceState {
  if (item.status === 'Completed') return 'Completed';
  if (item.status === 'Overdue') return 'Overdue';
  if (item.approvalStatus === 'Doc Missing' || !item.evidenceUploaded) return 'Documents Missing';
  return 'On Track';
}

/**
 * The effective risk level of a compliance item, used everywhere (tiles, register,
 * filters, exports) so the numbers always reconcile with the Master Register.
 * Overdue items and items with missing documents are automatically elevated.
 */
export function effectiveRiskLevel(item: ComplianceItem): RiskLevel {
  if (item.status === 'Overdue') return 'Critical';
  if (item.approvalStatus === 'Doc Missing') return 'High';
  return item.riskLevel;
}

/** Plain-language reasons why an item currently carries risk */
export function riskReasons(item: ComplianceItem): string[] {
  const reasons: string[] = [];
  if (item.status === 'Overdue') reasons.push(`Past its due date of ${item.dueDate} — statutory deadline missed`);
  if (item.approvalStatus === 'Doc Missing') reasons.push('Supporting documents have not been provided to the approver');
  if (!item.evidenceUploaded) reasons.push('No evidence uploaded to the Document Vault');
  if (item.approvalStatus === 'Rejected') reasons.push('Approver rejected the submission — rework required');
  if (item.approvalStatus === 'Pending') reasons.push(`Awaiting approval from ${item.owner}`);
  if (item.approvalStatus === 'Not Started') reasons.push('Work has not started on this filing');
  if (item.riskLevel === 'Critical' || item.riskLevel === 'High') reasons.push(`Inherent risk rating of the filing is ${item.riskLevel}`);
  if (reasons.length === 0) reasons.push('No open risk — filing is complete and approved');
  return reasons;
}


/* ------------------------------------------------------------------ */
/* Approval requests + email notifications                             */
/* ------------------------------------------------------------------ */

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
  'Suresh Mehta (Director)': 'suresh.mehta@e-cxo.example',
  'Kavita Rao (Audit Chair)': 'kavita.rao@e-cxo.example',
  'Deepak Gupta (MD)': 'deepak.gupta@e-cxo.example',
  'Ritu Agarwal (ID)': 'ritu.agarwal@e-cxo.example',
};

export function approverEmail(name: string): string {
  if (approverDirectory[name]) return approverDirectory[name];
  const slug = name.replace(/\(.*\)/, '').trim().toLowerCase().replace(/[^a-z]+/g, '.');
  return `${slug || 'approver'}@e-cxo.example`;
}

/* ------------------------------------------------------------------ */
/* Overdue task risks (feed the Risk Assessment High Risks tables)     */
/* ------------------------------------------------------------------ */

export interface OverdueTaskRisk {
  taskId: string;
  itemId: number;
  title: string;
  owner: string;
  deadline: string;
  status: TaskStatus;
  daysLeft: number;
  filingName: string;
  category: string;
  riskLevel: 'Critical' | 'High';
}

export function buildOverdueTaskRisks(
  tasks: ComplianceTask[],
  items: ComplianceItem[],
  today = new Date(),
): OverdueTaskRisk[] {
  const byId = new Map(items.map(i => [i.id, i]));
  const midnight = new Date(today.toISOString().split('T')[0]);
  return tasks
    .filter(t => t.status !== 'Done')
    .map(t => {
      const days = Math.ceil((new Date(t.deadline).getTime() - midnight.getTime()) / 86400000);
      const item = byId.get(t.itemId);
      return {
        taskId: t.id,
        itemId: t.itemId,
        title: t.title,
        owner: t.owner,
        deadline: t.deadline,
        status: t.status,
        daysLeft: days,
        filingName: item?.filingName ?? '—',
        category: item?.category ?? '—',
        riskLevel: (days < -7 ? 'Critical' : 'High') as 'Critical' | 'High',
      };
    })
    .filter(t => t.daysLeft < 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/* ------------------------------------------------------------------ */
/* Compliance timeline (dates, approvals and milestones per filing)    */
/* ------------------------------------------------------------------ */

export type MilestoneKind = 'Due Date' | 'Filing' | 'Approval' | 'Task' | 'Document' | 'Comment';

export interface TimelineMilestone {
  id: string;
  date: string;
  kind: MilestoneKind;
  title: string;
  detail: string;
  state: 'done' | 'pending' | 'late';
}

export function buildItemTimeline(
  item: ComplianceItem,
  filings: FilingSubmission[],
  approvals: ApprovalRequest[],
  tasks: ComplianceTask[],
  today = new Date(),
): TimelineMilestone[] {
  const todayStr = today.toISOString().split('T')[0];
  const ms: TimelineMilestone[] = [];

  ms.push({
    id: `due-${item.id}`,
    date: item.dueDate,
    kind: 'Due Date',
    title: `Statutory deadline — ${item.frequency}`,
    detail: `${item.regReference} · ${item.filingAuthority}`,
    state: item.status === 'Completed' ? 'done' : item.dueDate < todayStr ? 'late' : 'pending',
  });

  tasks.filter(t => t.itemId === item.id).forEach(t => {
    ms.push({
      id: `task-${t.id}`,
      date: t.deadline,
      kind: 'Task',
      title: t.title,
      detail: `${t.owner} · ${t.status}`,
      state: t.status === 'Done' ? 'done' : t.deadline < todayStr ? 'late' : 'pending',
    });
  });

  filings.filter(f => f.itemId === item.id).forEach(f => {
    ms.push({
      id: `filing-${f.id}`,
      date: f.filingDate,
      kind: 'Filing',
      title: `Filed — ${f.referenceNo}`,
      detail: `Submitted by ${f.submittedBy} · ${f.documents.length} document(s)`,
      state: 'done',
    });
    f.documents.forEach((d, i) => {
      ms.push({
        id: `doc-${f.id}-${i}`,
        date: f.filingDate,
        kind: 'Document',
        title: d,
        detail: `Vault ID ${f.vaultId}`,
        state: 'done',
      });
    });
  });

  approvals.filter(a => a.itemId === item.id).forEach(a => {
    ms.push({
      id: `appr-req-${a.id}`,
      date: a.requestedOn,
      kind: 'Approval',
      title: `Approval requested from ${a.approver}`,
      detail: `Raised by ${a.requestedBy} · Due by ${a.dueBy}`,
      state: 'done',
    });
    if (a.status !== 'Pending' && a.decidedOn) {
      ms.push({
        id: `appr-dec-${a.id}`,
        date: a.decidedOn,
        kind: 'Approval',
        title: `Approval ${a.status.toLowerCase()} by ${a.decidedBy ?? a.approver}`,
        detail: a.decisionNote || 'No remarks recorded',
        state: a.status === 'Approved' ? 'done' : 'late',
      });
    } else {
      ms.push({
        id: `appr-wait-${a.id}`,
        date: a.dueBy,
        kind: 'Approval',
        title: `Awaiting decision from ${a.approver}`,
        detail: a.note || 'Approval pending',
        state: a.dueBy < todayStr ? 'late' : 'pending',
      });
    }
  });

  return ms.sort((a, b) => a.date.localeCompare(b.date));
}
