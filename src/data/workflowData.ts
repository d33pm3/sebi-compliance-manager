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
    owner: item.owner,
    deadline: item.dueDate,
    status: taskStatusForItem(item),
    createdAt: '2026-04-01',
  }));
}
