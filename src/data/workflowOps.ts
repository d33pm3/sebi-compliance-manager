import { ComplianceItem, RiskLevel } from '@/data/complianceData';
import { FilingSubmission, ComplianceTask, TaskStatus } from '@/data/workflowTypes';
import { deriveComplianceState, effectiveRiskLevel, riskReasons, ComplianceState } from '@/data/workflowState';
import { ApprovalRequest } from '@/data/workflowApprovals';

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

export interface ResolvedVaultDoc {
  item?: ComplianceItem;
  category: string;
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
