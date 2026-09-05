/**
 * Agent deliverables.
 *
 * Every agent output in the Document Vault is a live extract of the Master
 * Compliance Register — nothing is stored separately. The rows are rebuilt
 * from the master on every render, so a single master update flows straight
 * through to the deliverable, its detail page and its export.
 */
import { ComplianceItem } from '@/data/complianceData';
import { deriveComplianceState, effectiveRiskLevel } from '@/data/workflowData';

export type AgentOutputKind =
  | 'register-extract'
  | 'filing-calendar'
  | 'event-trigger-map'
  | 'amendment-tracker'
  | 'risk-snapshot';

export interface AgentOutputColumn {
  key: string;
  label: string;
  width?: number;
}

export interface AgentOutputRow {
  itemId: number;
  cells: Record<string, string>;
}

export interface AgentOutputSpec {
  kind: AgentOutputKind;
  title: string;
  description: string;
  columns: AgentOutputColumn[];
  build: (items: ComplianceItem[]) => AgentOutputRow[];
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

export const agentOutputSpecs: Record<AgentOutputKind, AgentOutputSpec> = {
  'register-extract': {
    kind: 'register-extract',
    title: 'Master Compliance Register',
    description: 'Full extract of every obligation held in the Master Compliance Register.',
    columns: [
      { key: 'sNo', label: 'S.No', width: 8 },
      { key: 'filingName', label: 'Filing Name', width: 45 },
      { key: 'category', label: 'Category', width: 28 },
      { key: 'regReference', label: 'Regulation', width: 22 },
      { key: 'frequency', label: 'Frequency', width: 16 },
      { key: 'dueDate', label: 'Due Date', width: 13 },
      { key: 'state', label: 'Status', width: 20 },
    ],
    build: items => items.map(i => ({
      itemId: i.id,
      cells: {
        sNo: String(i.sNo),
        filingName: i.filingName,
        category: i.category,
        regReference: i.regReference,
        frequency: i.frequency,
        dueDate: i.dueDate,
        state: deriveComplianceState(i),
      },
    })),
  },

  'filing-calendar': {
    kind: 'filing-calendar',
    title: 'Filing Calendar',
    description: 'Every dated obligation in due-date order, with days to deadline and current state.',
    columns: [
      { key: 'dueDate', label: 'Due Date', width: 13 },
      { key: 'filingName', label: 'Filing Name', width: 45 },
      { key: 'category', label: 'Category', width: 28 },
      { key: 'authority', label: 'Filing Authority', width: 20 },
      { key: 'daysToDue', label: 'Days To Due', width: 13 },
      { key: 'state', label: 'Status', width: 20 },
    ],
    build: items => {
      const today = new Date().toISOString().split('T')[0];
      return items
        .filter(i => !!i.dueDate)
        .slice()
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map(i => ({
          itemId: i.id,
          cells: {
            dueDate: i.dueDate,
            filingName: i.filingName,
            category: i.category,
            authority: i.filingAuthority,
            daysToDue: String(daysBetween(today, i.dueDate)),
            state: deriveComplianceState(i),
          },
        }));
    },
  },

  'event-trigger-map': {
    kind: 'event-trigger-map',
    title: 'Event Trigger Map',
    description: 'Event-driven obligations mapped to the trigger event and the disclosure timeline.',
    columns: [
      { key: 'trigger', label: 'Trigger Event', width: 45 },
      { key: 'filingName', label: 'Obligation', width: 45 },
      { key: 'timeline', label: 'Timeline', width: 26 },
      { key: 'regReference', label: 'Regulation', width: 22 },
      { key: 'nature', label: 'Nature', width: 10 },
    ],
    build: items => items
      .filter(i => i.complianceNature === '[E]' || i.complianceNature === '[P+E]')
      .map(i => ({
        itemId: i.id,
        cells: {
          trigger: i.trigger,
          filingName: i.filingName,
          timeline: i.timeline,
          regReference: i.regReference,
          nature: i.complianceNature,
        },
      })),
  },

  'amendment-tracker': {
    kind: 'amendment-tracker',
    title: 'Amendment Tracker',
    description: 'Obligations grouped by regulation reference, with applicability and obligor tier.',
    columns: [
      { key: 'regReference', label: 'Regulation', width: 22 },
      { key: 'filingName', label: 'Obligation', width: 45 },
      { key: 'applicableTo', label: 'Applicable To', width: 28 },
      { key: 'obligorTier', label: 'Obligor Tier', width: 16 },
      { key: 'format', label: 'Format', width: 20 },
    ],
    build: items => items
      .slice()
      .sort((a, b) => a.regReference.localeCompare(b.regReference))
      .map(i => ({
        itemId: i.id,
        cells: {
          regReference: i.regReference,
          filingName: i.filingName,
          applicableTo: i.applicableTo,
          obligorTier: i.obligorTier,
          format: i.format,
        },
      })),
  },

  'risk-snapshot': {
    kind: 'risk-snapshot',
    title: 'Risk Snapshot',
    description: 'Every obligation carrying Critical or High risk, with the reason it is flagged.',
    columns: [
      { key: 'risk', label: 'Risk Level', width: 12 },
      { key: 'filingName', label: 'Obligation', width: 45 },
      { key: 'category', label: 'Category', width: 28 },
      { key: 'state', label: 'Status', width: 20 },
      { key: 'owner', label: 'Owner', width: 24 },
      { key: 'dueDate', label: 'Due Date', width: 13 },
    ],
    build: items => items
      .filter(i => {
        const r = effectiveRiskLevel(i);
        return r === 'Critical' || r === 'High';
      })
      .map(i => ({
        itemId: i.id,
        cells: {
          risk: effectiveRiskLevel(i),
          filingName: i.filingName,
          category: i.category,
          state: deriveComplianceState(i),
          owner: i.owner,
          dueDate: i.dueDate,
        },
      })),
  },
};

export const agentOutputKinds = Object.keys(agentOutputSpecs) as AgentOutputKind[];

/** Resolve a vault document title (or vault ID) to the deliverable it represents */
export function agentOutputKindFromTitle(title: string): AgentOutputKind {
  const t = title.toLowerCase();
  if (t.includes('filing calendar')) return 'filing-calendar';
  if (t.includes('event trigger')) return 'event-trigger-map';
  if (t.includes('amendment')) return 'amendment-tracker';
  if (t.includes('risk')) return 'risk-snapshot';
  return 'register-extract';
}

export function buildAgentOutput(kind: AgentOutputKind, items: ComplianceItem[]) {
  const spec = agentOutputSpecs[kind];
  return { spec, rows: spec.build(items) };
}
