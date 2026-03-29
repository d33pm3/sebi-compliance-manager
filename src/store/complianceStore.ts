import { create } from 'zustand';
import { complianceItems, ComplianceItem, ComplianceStatus, ApprovalStatus, Comment, RiskLevel } from '@/data/complianceData';

interface Filters {
  search: string;
  category: string;
  status: string;
  riskLevel: string;
  complianceNature: string;
  obligorTier: string;
}

interface AgentState {
  status: 'Idle' | 'Running' | 'Completed' | 'Error';
  lastRunTime: string | null;
  itemsExtracted: number;
  schedule: string;
  logs: string[];
}

interface ComplianceStore {
  items: ComplianceItem[];
  filters: Filters;
  selectedItemId: number | null;
  drawerOpen: boolean;
  agent: AgentState;

  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
  selectItem: (id: number | null) => void;
  setDrawerOpen: (open: boolean) => void;
  updateItemStatus: (id: number, status: ComplianceStatus) => void;
  updateApprovalStatus: (id: number, status: ApprovalStatus) => void;
  addComment: (id: number, comment: Comment) => void;
  toggleEvidence: (id: number) => void;
  
  startAgent: () => void;
  stopAgent: () => void;
  addAgentLog: (log: string) => void;
  setAgentSchedule: (schedule: string) => void;
  setAgentStatus: (status: AgentState['status']) => void;
  setAgentCompleted: (itemsExtracted: number) => void;

  filteredItems: () => ComplianceItem[];
}

const defaultFilters: Filters = {
  search: '',
  category: '',
  status: '',
  riskLevel: '',
  complianceNature: '',
  obligorTier: '',
};

export const useComplianceStore = create<ComplianceStore>((set, get) => ({
  items: complianceItems,
  filters: defaultFilters,
  selectedItemId: null,
  drawerOpen: false,
  agent: {
    status: 'Idle',
    lastRunTime: null,
    itemsExtracted: 0,
    schedule: 'Daily',
    logs: [],
  },

  setFilter: (key, value) => set(state => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
  selectItem: (id) => set({ selectedItemId: id, drawerOpen: id !== null }),
  setDrawerOpen: (open) => set({ drawerOpen: open, selectedItemId: open ? get().selectedItemId : null }),

  updateItemStatus: (id, status) => set(state => ({
    items: state.items.map(item => item.id === id ? { ...item, status } : item)
  })),

  updateApprovalStatus: (id, status) => set(state => ({
    items: state.items.map(item => item.id === id ? { ...item, approvalStatus: status } : item)
  })),

  addComment: (id, comment) => set(state => ({
    items: state.items.map(item => item.id === id ? { ...item, comments: [...item.comments, comment] } : item)
  })),

  toggleEvidence: (id) => set(state => ({
    items: state.items.map(item => item.id === id ? { ...item, evidenceUploaded: !item.evidenceUploaded } : item)
  })),

  startAgent: () => set(state => ({
    agent: { ...state.agent, status: 'Running', logs: [...state.agent.logs, `[${new Date().toLocaleTimeString()}] Agent started...`] }
  })),

  stopAgent: () => set(state => ({
    agent: { ...state.agent, status: 'Idle', logs: [...state.agent.logs, `[${new Date().toLocaleTimeString()}] Agent stopped.`] }
  })),

  addAgentLog: (log) => set(state => ({
    agent: { ...state.agent, logs: [...state.agent.logs, `[${new Date().toLocaleTimeString()}] ${log}`] }
  })),

  setAgentSchedule: (schedule) => set(state => ({
    agent: { ...state.agent, schedule }
  })),

  setAgentStatus: (status) => set(state => ({
    agent: { ...state.agent, status }
  })),

  setAgentCompleted: (itemsExtracted) => set(state => ({
    agent: {
      ...state.agent,
      status: 'Completed',
      lastRunTime: new Date().toLocaleString(),
      itemsExtracted,
      logs: [...state.agent.logs, `[${new Date().toLocaleTimeString()}] ✅ Extraction complete. ${itemsExtracted} items found.`]
    }
  })),

  filteredItems: () => {
    const { items, filters } = get();
    return items.filter(item => {
      if (filters.search && !item.filingName.toLowerCase().includes(filters.search.toLowerCase()) && !item.category.toLowerCase().includes(filters.search.toLowerCase()) && !item.regReference.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.riskLevel && item.riskLevel !== filters.riskLevel) return false;
      if (filters.complianceNature && item.complianceNature !== filters.complianceNature) return false;
      if (filters.obligorTier && item.obligorTier !== filters.obligorTier) return false;
      return true;
    });
  },
}));
