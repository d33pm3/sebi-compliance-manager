/**
 * Single source of truth for chart / tile colours and label casing.
 * Every module (Dashboard, Risk Assessment, KPIs) imports from here so the
 * palette can never drift between modules.
 */

export const CHART_COLORS: Record<string, string> = {
  Completed: 'hsl(145, 63%, 62%)',
  'Due Soon': 'hsl(38, 80%, 52%)',
  Overdue: 'hsl(350, 80%, 72%)',
  'Not Due': 'hsl(220, 8%, 46%)',
  'In Progress': 'hsl(197, 78%, 54%)',
  'Not Started': 'hsl(220, 8%, 64%)',
};

export const RISK_COLORS: Record<string, string> = {
  Critical: 'hsl(350, 80%, 72%)',
  High: 'hsl(38, 80%, 52%)',
  Medium: 'hsl(197, 78%, 54%)',
  Low: 'hsl(145, 63%, 62%)',
};

export interface TileColor {
  bg: string;
  fg: string;
}

const DARK_TEXT = 'hsl(220, 40%, 14%)';
const LIGHT_TEXT = 'hsl(0, 0%, 100%)';

/** Stat tiles reuse the exact chart palette so numbers and colours reconcile visually */
export const STAT_COLORS: Record<string, TileColor> = {
  total: { bg: 'hsl(220, 26%, 22%)', fg: LIGHT_TEXT },
  dueSoon: { bg: CHART_COLORS['Due Soon'], fg: 'hsl(30, 60%, 12%)' },
  overdue: { bg: CHART_COLORS.Overdue, fg: 'hsl(350, 60%, 18%)' },
  completed: { bg: CHART_COLORS.Completed, fg: 'hsl(150, 60%, 14%)' },
  upcoming: { bg: CHART_COLORS['Not Due'], fg: LIGHT_TEXT },
  pending: { bg: CHART_COLORS['Due Soon'], fg: 'hsl(30, 60%, 12%)' },
  inProgress: { bg: CHART_COLORS['In Progress'], fg: 'hsl(200, 70%, 12%)' },
  notStarted: { bg: CHART_COLORS['Not Started'], fg: DARK_TEXT },
};

/** Risk-level tiles share the risk chart palette */
export const RISK_TILE_COLORS: Record<string, TileColor> = {
  Critical: { bg: RISK_COLORS.Critical, fg: 'hsl(350, 60%, 18%)' },
  High: { bg: RISK_COLORS.High, fg: 'hsl(30, 60%, 12%)' },
  Medium: { bg: RISK_COLORS.Medium, fg: 'hsl(200, 70%, 12%)' },
  Low: { bg: RISK_COLORS.Low, fg: 'hsl(150, 60%, 14%)' },
};

/** Notice response status tiles — same palette as the dashboard so the numbers feel familiar */
export const NOTICE_TILE_COLORS: Record<string, TileColor> = {
  total: { bg: 'hsl(220, 26%, 22%)', fg: LIGHT_TEXT },
  awaiting: { bg: CHART_COLORS.Overdue, fg: 'hsl(350, 60%, 18%)' },
  drafting: { bg: CHART_COLORS['Due Soon'], fg: 'hsl(30, 60%, 12%)' },
  submitted: { bg: CHART_COLORS['In Progress'], fg: 'hsl(200, 70%, 12%)' },
  closed: { bg: CHART_COLORS.Completed, fg: 'hsl(150, 60%, 14%)' },
};

/** Task Manager tiles — mapped to the master status they mirror */
export const TASK_TILE_COLORS: Record<string, TileColor> = {
  total: { bg: 'hsl(220, 26%, 22%)', fg: LIGHT_TEXT },
  open: { bg: CHART_COLORS['Not Due'], fg: LIGHT_TEXT },
  inProgress: { bg: CHART_COLORS['In Progress'], fg: 'hsl(200, 70%, 12%)' },
  blocked: { bg: CHART_COLORS.Overdue, fg: 'hsl(350, 60%, 18%)' },
  pastDeadline: { bg: CHART_COLORS['Due Soon'], fg: 'hsl(30, 60%, 12%)' },
  done: { bg: CHART_COLORS.Completed, fg: 'hsl(150, 60%, 14%)' },
};

const ACRONYMS = new Set([
  'MCA', 'AGM', 'EGM', 'SEBI', 'XBRL', 'LODR', 'NSE', 'BSE', 'RTA', 'PCS', 'CEO', 'CFO',
  'RMC', 'ASCR', 'SAR', 'BRSR', 'GM', 'HVDLE', 'PIT', 'SAST', 'ESG', 'KMP', 'MD&A', 'RPT',
  'ALL', 'TOP', 'IPO', 'OFS', 'KPI', 'MGT',
]);

/** Title Case that preserves regulatory acronyms — never ALL CAPS labels */
export function toTitleCaseLabel(s: string): string {
  return s
    .split(/(\s+|\/)/)
    .map(w => {
      if (/^\s+$/.test(w) || w === '/') return w;
      const bare = w.replace(/[^A-Za-z&]/g, '');
      if (ACRONYMS.has(bare.toUpperCase())) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Comparison series palette (Completed vs Non-Compliant) — brand blues.
 * Light blue = Completed, dark navy blue = Non-Compliant.
 */
export const COMPARISON_COLORS = {
  completed: 'hsl(199, 76%, 62%)',
  nonCompliant: 'hsl(205, 62%, 29%)',
};
