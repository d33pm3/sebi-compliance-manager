import { ComplianceItem } from '@/data/complianceData';

function downloadBlob(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n');
}

const dateSuffix = () => new Date().toISOString().slice(0, 10);

export function downloadMasterRegister(items: ComplianceItem[]) {
  const headers = ['#', 'Filing Name', 'Reg Reference', 'Category', 'Frequency', 'Due Date', 'Status', 'Risk Level', 'Owner', 'Approver', 'Compliance Nature', 'Obligor Tier'];
  const rows = items.map(i => [
    String(i.id), i.filingName, i.regReference, i.category, i.frequency,
    i.dueDate, i.status, i.riskLevel, i.owner, i.approver, i.complianceNature, i.obligorTier,
  ]);
  downloadBlob(toCsv(headers, rows), `Master_Register_${dateSuffix()}.csv`);
}

export function downloadFilingCalendar(items: ComplianceItem[]) {
  const headers = ['Due Date', 'Filing Name', 'Reg Reference', 'Frequency', 'Status', 'Owner'];
  const sorted = [...items].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const rows = sorted.map(i => [i.dueDate, i.filingName, i.regReference, i.frequency, i.status, i.owner]);
  downloadBlob(toCsv(headers, rows), `Filing_Calendar_${dateSuffix()}.csv`);
}

export function downloadEventTriggerMap(items: ComplianceItem[]) {
  const eventBased = items.filter(i => i.frequency === 'Event-based' || i.riskLevel === 'Critical' || i.riskLevel === 'High');
  const headers = ['Filing Name', 'Reg Reference', 'Risk Level', 'Category', 'Trigger', 'Status', 'Due Date', 'Owner'];
  const rows = eventBased.map(i => [i.filingName, i.regReference, i.riskLevel, i.category, i.trigger, i.status, i.dueDate, i.owner]);
  downloadBlob(toCsv(headers, rows), `Event_Trigger_Map_${dateSuffix()}.csv`);
}

export function downloadAmendmentTracker(items: ComplianceItem[]) {
  const headers = ['Filing Name', 'Reg Reference', 'Category', 'Compliance Nature', 'Timeline', 'Penalty'];
  const rows = items.map(i => [i.filingName, i.regReference, i.category, i.complianceNature, i.timeline, i.penalty]);
  downloadBlob(toCsv(headers, rows), `Amendment_Tracker_${dateSuffix()}.csv`);
}

export function downloadOtherItems(items: ComplianceItem[]) {
  const headers = ['#', 'Filing Name', 'Reg Reference', 'Category', 'Status', 'Due Date', 'Format'];
  const rows = items.map(i => [String(i.id), i.filingName, i.regReference, i.category, i.status, i.dueDate, i.format]);
  downloadBlob(toCsv(headers, rows), `All_Items_${dateSuffix()}.csv`);
}

export function downloadGenericCsv(headers: string[], rows: string[][], filename: string) {
  downloadBlob(toCsv(headers, rows), filename);
}

export function downloadDocumentPlaceholder(title: string, vaultId: string) {
  const content = `Document: ${title}\nVault ID: ${vaultId}\nGenerated: ${new Date().toISOString()}\n\nThis is a placeholder document export from deriskadvisory.\nIn a production environment, this would download the actual document file.`;
  downloadBlob(content, `${vaultId}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, 'text/plain');
}
