import { ComplianceItem } from '@/data/complianceData';

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
