import { ComplianceItem, RiskLevel } from '@/data/complianceData';

export type ComplianceState = 'Completed' | 'Overdue' | 'Documents Missing' | 'On Track';

export function deriveComplianceState(item: ComplianceItem): ComplianceState {
  if (item.status === 'Completed') return 'Completed';
  if (item.status === 'Overdue') return 'Overdue';
  if (item.approvalStatus === 'Doc Missing' || !item.evidenceUploaded) return 'Documents Missing';
  return 'On Track';
}

export function effectiveRiskLevel(item: ComplianceItem): RiskLevel {
  if (item.status === 'Overdue') return 'Critical';
  if (item.approvalStatus === 'Doc Missing') return 'High';
  return item.riskLevel;
}

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
