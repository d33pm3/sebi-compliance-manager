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

/**
 * ONE task per Master Compliance Register item — the Task Manager is a strict
 * 1:1 mirror of the master, so Total Tasks always equals the master item count
 * (plus any task a user adds manually).
 */
const taskTemplateByStatus: Record<string, string> = {
  Completed: 'Archive filed papers and close the compliance file',
  Overdue: 'Escalate and file immediately — deadline breached',
  'Due Soon': 'Prepare draft filing and obtain approver sign-off',
  'In Progress': 'Complete the draft and upload supporting evidence',
  'Not Started': 'Collect supporting data and start the filing',
  'Not Due': 'Track the deadline and gather supporting data',
};

/** Master status → task status. Single source of truth used everywhere. */
export function taskStatusForItem(item: ComplianceItem): TaskStatus {
  switch (item.status) {
    case 'Completed':
      return 'Done';
    case 'Overdue':
      return 'Blocked';
    case 'Due Soon':
    case 'In Progress':
      return 'In Progress';
    default:
      return 'Open';
  }
}

export function taskTitleForItem(item: ComplianceItem): string {
  return taskTemplateByStatus[item.status] ?? 'Complete the compliance obligation';
}

export function seedTasks(items: ComplianceItem[]): ComplianceTask[] {
  return items.map(item => ({
    id: `T-${item.id}`,
    itemId: item.id,
    title: taskTitleForItem(item),
    // Owner and deadline mirror the master register exactly
    owner: item.owner,
    deadline: item.dueDate,
    status: taskStatusForItem(item),
    createdAt: '2026-04-01',
  }));
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
  /* ---- Detail-page fields (illustrative data) ---- */
  noticeType?: string;
  referenceOfficer?: string;
  background?: string;
  allegations?: string[];
  informationSought?: string[];
  penaltyExposure?: string;
  internalActions?: { date: string; action: string; by: string }[];
  correspondence?: { date: string; direction: 'Received' | 'Sent'; document: string }[];
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
    noticeType: 'Show Cause Notice',
    referenceOfficer: 'Adjudicating Officer, Corporation Finance Department, SEBI',
    background: 'SEBI observed that the Corporate Governance Report for the quarter ended September 2025 was not submitted on the exchange portal within 21 days of the quarter end as required under Regulation 27(2)(a) of the SEBI (LODR) Regulations, 2015.',
    allegations: [
      'Corporate Governance Report for Q2 FY 2025-26 filed 9 days beyond the prescribed timeline',
      'No intimation of delay furnished to the stock exchanges',
    ],
    informationSought: [
      'Reasons for the delay, supported by internal records',
      'Copy of the Corporate Governance Report as filed with both exchanges',
      'Details of the compliance officer responsible and remedial steps taken',
    ],
    penaltyExposure: 'Fine of Rs 5,000 per day of delay under the SEBI SOP Circular; Regulation 98 of LODR',
    internalActions: [
      { date: '2026-03-06', action: 'Notice logged in the Response Tracker and linked to the Compliance Master', by: 'Priya Sharma (CS)' },
      { date: '2026-03-10', action: 'Board Committee briefed; draft reply circulated', by: 'Anita Desai (Legal)' },
      { date: '2026-03-18', action: 'Reply filed with SEBI along with the filed report', by: 'Priya Sharma (CS)' },
    ],
    correspondence: [
      { date: '2026-03-05', direction: 'Received', document: 'Show Cause Notice SEBI/CFD/2026/0341.pdf' },
      { date: '2026-03-18', direction: 'Sent', document: 'Reply to SCN dated 18 Mar 2026.pdf' },
    ],
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
    noticeType: 'Inquiry / Summons under Section 11C(2) of the SEBI Act',
    referenceOfficer: 'Investigating Authority, Integrated Surveillance Department, SEBI',
    background: 'SEBI has commenced a preliminary inquiry into trading in the scrip during the period 12 February 2026 to 04 March 2026, being the window immediately preceding the announcement of the Q3 results. The inquiry examines whether Unpublished Price Sensitive Information (UPSI) was shared or traded upon in contravention of Regulation 3 and Regulation 4 of the SEBI (Prohibition of Insider Trading) Regulations, 2015.',
    allegations: [
      'Trades by two designated persons during a closed trading window (PIT Reg 9 read with Schedule B)',
      'Structured Digital Database entries for the UPSI period appear incomplete (PIT Reg 3(5))',
      'Continual disclosure in Form D for one designated person filed beyond 2 trading days (PIT Reg 7(2))',
    ],
    informationSought: [
      'Extract of the Structured Digital Database for 01 Feb 2026 to 15 Mar 2026 with audit trail',
      'Trading window closure and re-opening intimations sent to NSE and BSE',
      'List of designated persons and their immediate relatives as on 31 Mar 2026 (PIT Reg 7(3))',
      'Copies of Form C and Form D disclosures received during the inquiry period',
      'Minutes of the meeting at which the Q3 results became UPSI, with the time-stamp of announcement',
    ],
    penaltyExposure: 'Section 15G of the SEBI Act — up to Rs 25 crore or 3 times the profit made, whichever is higher; prosecution for insider trading',
    internalActions: [
      { date: '2026-04-03', action: 'Notice logged; external counsel engaged and SDD frozen for audit', by: 'Anita Desai (Legal)' },
      { date: '2026-04-08', action: 'Trading window records and Form C/D disclosures compiled for the inquiry period', by: 'Priya Sharma (CS)' },
      { date: '2026-04-15', action: 'Draft reply under review by the Audit Committee Chair', by: 'Kavita Rao (Audit Chair)' },
    ],
    correspondence: [
      { date: '2026-04-02', direction: 'Received', document: 'Inquiry Letter SEBI/ISD/2026/0198.pdf' },
      { date: '2026-04-09', direction: 'Sent', document: 'Acknowledgement and request for 15-day extension.pdf' },
    ],
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
    noticeType: 'Penalty Notice',
    referenceOfficer: 'Listing Compliance Department, National Stock Exchange of India Ltd',
    background: 'The shareholding pattern for the quarter ended December 2025 was submitted 4 days after the 21-day deadline prescribed under Regulation 31(1)(b) of the SEBI (LODR) Regulations, 2015.',
    allegations: ['Delayed submission of the quarterly shareholding pattern by 4 days'],
    informationSought: [
      'Payment of the fine computed under the SEBI SOP Circular',
      'Written explanation for the delay and preventive measures adopted',
    ],
    penaltyExposure: 'Rs 5,000 per day of delay — Rs 20,000 levied and paid',
    internalActions: [
      { date: '2026-02-19', action: 'Fine computation verified against the SOP Circular', by: 'Rajesh Kumar (CFO)' },
      { date: '2026-02-28', action: 'Fine paid and explanation letter filed; exchange confirmed closure', by: 'Rajesh Kumar (CFO)' },
    ],
    correspondence: [
      { date: '2026-02-18', direction: 'Received', document: 'Penalty Notice NSE/LIST/2026/0412.pdf' },
      { date: '2026-02-28', direction: 'Sent', document: 'Penalty payment challan.pdf' },
    ],
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
    noticeType: 'Advisory',
    referenceOfficer: 'Corporate Relationship Department, BSE Ltd',
    background: 'BSE has advised all listed entities of a revised XBRL taxonomy for the submission of financial results under Regulation 33 of the SEBI (LODR) Regulations, 2015, effective from the quarter ending June 2026.',
    allegations: [],
    informationSought: [
      'Confirmation of readiness to file in the revised XBRL taxonomy',
      'Name and contact details of the person authorised for XBRL submissions',
    ],
    penaltyExposure: 'No monetary penalty; non-adoption will result in rejection of the results filing',
    internalActions: [
      { date: '2026-04-11', action: 'Advisory circulated to Finance and the Secretarial team', by: 'Vikram Singh (Compliance)' },
      { date: '2026-04-20', action: 'Test filing completed on the exchange portal in the new taxonomy', by: 'Neha Patel (Finance)' },
    ],
    correspondence: [
      { date: '2026-04-10', direction: 'Received', document: 'Advisory BSE/CORP/2026/0087.pdf' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Notice-derived risk register items                                  */
/* ------------------------------------------------------------------ */

export interface NoticeRiskItem {
  id: string;
  noticeId: string;
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
      noticeId: n.noticeId,
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
  'Suresh Mehta (Director)': 'suresh.mehta@deriskadvisory.example',
  'Kavita Rao (Audit Chair)': 'kavita.rao@deriskadvisory.example',
  'Deepak Gupta (MD)': 'deepak.gupta@deriskadvisory.example',
  'Ritu Agarwal (ID)': 'ritu.agarwal@deriskadvisory.example',
};

export function approverEmail(name: string): string {
  if (approverDirectory[name]) return approverDirectory[name];
  const slug = name.replace(/\(.*\)/, '').trim().toLowerCase().replace(/[^a-z]+/g, '.');
  return `${slug || 'approver'}@deriskadvisory.example`;
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

/* ------------------------------------------------------------------ */
/* Notice -> Compliance Master linkage                                 */
/* Derived from the regulation reference so it never breaks when the    */
/* Master Compliance Register changes.                                 */
/* ------------------------------------------------------------------ */

export function linkedComplianceItems<T extends { regReference: string; category: string }>(
  regulation: string,
  items: T[],
): T[] {
  const m = regulation.match(/(PIT|LODR|SAST|ICDR|NCS|SBEB|BRSR)\s*Reg\.?\s*([0-9]+)/i);
  if (!m) return [];
  const family = m[1].toUpperCase();
  const num = m[2];
  const inFamily = items.filter(i => `${i.regReference} ${i.category}`.toUpperCase().includes(family));
  const exact = inFamily.filter(i => new RegExp(`\\bReg\\.?\\s*${num}\\b`, 'i').test(i.regReference));
  const rest = inFamily.filter(i => !exact.includes(i));
  return [...exact, ...rest].slice(0, 12);
}

/* ------------------------------------------------------------------ */
/* Document Vault -> Compliance Master resolution                      */
/* Every vault document resolves its category, regulation, state and   */
/* risk from the Master Compliance Register, so a single master update  */
/* flows through the Vault, the Notices and the Risk Assessment.       */
/* ------------------------------------------------------------------ */

export interface ResolvedVaultDoc {
  item?: ComplianceItem;
  /** Category shown in the Vault — the master's category when linked */
  category: string;
  /** Regulation reference — the master's regReference when linked */
  regulation: string;
  state?: ComplianceState;
  riskLevel: RiskLevel | null;
  riskReason: string;
  reasons: string[];
  dueDate?: string;
  owner?: string;
}

export function resolveVaultDoc(
  doc: {
    itemId?: number;
    regulation: string;
    category: string;
    section: string;
    status?: string;
    responseDue?: string;
  },
  items: ComplianceItem[],
): ResolvedVaultDoc {
  const item = doc.itemId != null
    ? items.find(i => i.id === doc.itemId)
    : linkedComplianceItems(doc.regulation, items)[0];

  // Notices carry their own risk: an unanswered notice is High risk by default.
  if (doc.section === 'sebi-notices' && doc.status === 'Pending') {
    return {
      item,
      category: doc.category,
      regulation: item?.regReference ?? doc.regulation,
      state: item ? deriveComplianceState(item) : undefined,
      riskLevel: 'High',
      riskReason: 'Response Pending',
      reasons: [
        `Response to the notice is still pending${doc.responseDue ? ` — due by ${doc.responseDue}` : ''}`,
        ...(item ? riskReasons(item) : []),
      ],
      dueDate: doc.responseDue ?? item?.dueDate,
      owner: item?.owner,
    };
  }

  if (!item) {
    return {
      item: undefined,
      category: doc.category,
      regulation: doc.regulation,
      riskLevel: null,
      riskReason: '',
      reasons: ['Reference document — not linked to a filing obligation'],
    };
  }

  const state = deriveComplianceState(item);
  let riskLevel: RiskLevel | null = null;
  let riskReason = '';
  if (state === 'Overdue') {
    riskLevel = effectiveRiskLevel(item);
    riskReason = 'Overdue Filing';
  } else if (state === 'Documents Missing') {
    riskLevel = 'High';
    riskReason = 'Documents Missing';
  }

  return {
    item,
    category: item.category,
    regulation: item.regReference,
    state,
    riskLevel,
    riskReason,
    reasons: riskReasons(item),
    dueDate: item.dueDate,
    owner: item.owner,
  };
}
