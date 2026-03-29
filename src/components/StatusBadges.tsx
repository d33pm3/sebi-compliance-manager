import { cn } from '@/lib/utils';
import { ComplianceStatus, RiskLevel, ApprovalStatus, ComplianceNature } from '@/data/complianceData';

const statusColors: Record<ComplianceStatus, string> = {
  'Completed': 'bg-success text-success-foreground',
  'Due Soon': 'bg-warning text-warning-foreground',
  'Overdue': 'bg-destructive text-destructive-foreground',
  'Not Due': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-secondary text-secondary-foreground',
  'Not Started': 'bg-muted text-muted-foreground',
};

const riskColors: Record<RiskLevel, string> = {
  'Critical': 'bg-destructive text-destructive-foreground',
  'High': 'bg-warning text-warning-foreground',
  'Medium': 'bg-secondary text-secondary-foreground',
  'Low': 'bg-success text-success-foreground',
};

const approvalColors: Record<ApprovalStatus, string> = {
  'Approved': 'bg-success text-success-foreground',
  'Pending': 'bg-warning text-warning-foreground',
  'Doc Missing': 'bg-destructive/80 text-destructive-foreground',
  'Rejected': 'bg-destructive text-destructive-foreground',
  'Not Started': 'bg-muted text-muted-foreground',
};

const natureColors: Record<ComplianceNature, string> = {
  '[P]': 'bg-success/20 text-success border border-success/30',
  '[E]': 'bg-destructive/20 text-destructive border border-destructive/30',
  '[P+E]': 'bg-warning/20 text-warning border border-warning/30',
  '[A]': 'bg-muted text-muted-foreground border border-border',
};

const badgeBase = 'inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[70px] h-5 px-2.5 leading-none';

export function StatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span className={cn(badgeBase, statusColors[status])}>
      {status}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={cn(badgeBase, 'min-w-[56px]', riskColors[level])}>
      {level}
    </span>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={cn(badgeBase, approvalColors[status])}>
      {status}
    </span>
  );
}

export function NatureBadge({ nature }: { nature: ComplianceNature }) {
  const labels: Record<ComplianceNature, string> = {
    '[P]': 'Periodic',
    '[E]': 'Event',
    '[P+E]': 'Both',
    '[A]': 'Admin',
  };
  return (
    <span className={cn(badgeBase, 'min-w-[52px] font-medium', natureColors[nature])}>
      {labels[nature]}
    </span>
  );
}
