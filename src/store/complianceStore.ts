import { create } from 'zustand';
import { complianceItems, ComplianceItem, ComplianceStatus, ApprovalStatus, Comment, RiskLevel } from '@/data/complianceData';
import { vaultDocuments, VaultDocument } from '@/data/vaultData';
import {
  ComplianceTask,
  FilingSubmission,
  NoticeResponse,
  NoticeResponseStatus,
  TaskStatus,
  noticeResponses as seedNotices,
  seedTasks,
} from '@/data/workflowData';

export interface FilingSubmissionInput {
  filingDate: string;
  referenceNo: string;
  submittedBy: string;
  approver: string;
  documents: string[];
  remarks: string;
}

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
  filings: FilingSubmission[];
  tasks: ComplianceTask[];
  notices: NoticeResponse[];
  vaultDocs: VaultDocument[];
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

  // Filing workflow — one submission updates Register, Risk and Vault together
  submitFiling: (id: number, input: FilingSubmissionInput) => void;
  approveFiling: (filingId: string, approve: boolean) => void;

  // Compliance to-do lists
  addTask: (itemId: number, task: { title: string; owner: string; deadline: string }) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;

  // SEBI notice response tracker
  updateNotice: (noticeId: string, patch: Partial<NoticeResponse>) => void;
  submitNoticeResponse: (noticeId: string, input: { responseDate: string; documents: string[]; remarks: string }) => void;
  
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
  filings: [],
  tasks: seedTasks(complianceItems),
  notices: seedNotices,
  vaultDocs: vaultDocuments,
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

  submitFiling: (id, input) => set(state => {
    const item = state.items.find(i => i.id === id);
    if (!item) return {};
    const seq = String(state.filings.length + 1).padStart(3, '0');
    const vaultId = `VAULT-FILED-${input.filingDate.replace(/-/g, '').slice(0, 6)}-${seq}`;
    const filing: FilingSubmission = {
      id: `FIL-${id}-${seq}`,
      itemId: id,
      filingName: item.filingName,
      category: item.category,
      referenceNo: input.referenceNo || `REF/${item.sNo}/${input.filingDate}`,
      filingDate: input.filingDate,
      submittedBy: input.submittedBy,
      approver: input.approver,
      approvalStatus: 'Pending',
      approvedOn: null,
      documents: input.documents,
      remarks: input.remarks,
      vaultId,
    };
    const vaultDoc: VaultDocument = {
      id: vaultId,
      vaultId,
      title: `${item.filingName} — Filed ${input.filingDate}`,
      category: item.category,
      section: 'compliance-filings',
      documentType: 'Filing',
      fiscalYear: 'FY2025-26',
      uploadedBy: input.submittedBy,
      uploadedAt: input.filingDate,
      fileSize: `${(input.documents.length * 0.6 + 0.4).toFixed(1)} MB`,
      fileType: 'PDF',
      regulation: item.regReference,
    };
    return {
      filings: [filing, ...state.filings],
      vaultDocs: [vaultDoc, ...state.vaultDocs],
      items: state.items.map(i => i.id === id ? {
        ...i,
        status: 'Completed' as ComplianceStatus,
        approvalStatus: 'Pending' as ApprovalStatus,
        evidenceUploaded: true,
        approver: input.approver || i.approver,
        comments: [...i.comments, {
          id: `${Date.now()}`,
          author: input.submittedBy,
          text: `Filing submitted on ${input.filingDate} (Ref ${filing.referenceNo}). ${input.documents.length} document(s) added to the Document Vault.`,
          timestamp: new Date().toLocaleString(),
        }],
      } : i),
    };
  }),

  approveFiling: (filingId, approve) => set(state => {
    const filing = state.filings.find(f => f.id === filingId);
    if (!filing) return {};
    const today = new Date().toISOString().split('T')[0];
    return {
      filings: state.filings.map(f => f.id === filingId
        ? { ...f, approvalStatus: approve ? 'Approved' : 'Rejected', approvedOn: today }
        : f),
      items: state.items.map(i => i.id === filing.itemId
        ? {
            ...i,
            approvalStatus: (approve ? 'Approved' : 'Rejected') as ApprovalStatus,
            status: (approve ? 'Completed' : 'In Progress') as ComplianceStatus,
          }
        : i),
    };
  }),

  addTask: (itemId, task) => set(state => ({
    tasks: [
      {
        id: `T-${itemId}-${Date.now()}`,
        itemId,
        title: task.title,
        owner: task.owner,
        deadline: task.deadline,
        status: 'Open' as TaskStatus,
        createdAt: new Date().toISOString().split('T')[0],
      },
      ...state.tasks,
    ],
  })),

  updateTaskStatus: (taskId, status) => set(state => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t),
  })),

  deleteTask: (taskId) => set(state => ({
    tasks: state.tasks.filter(t => t.id !== taskId),
  })),

  updateNotice: (noticeId, patch) => set(state => ({
    notices: state.notices.map(n => n.noticeId === noticeId ? { ...n, ...patch } : n),
  })),

  submitNoticeResponse: (noticeId, input) => set(state => ({
    notices: state.notices.map(n => n.noticeId === noticeId ? {
      ...n,
      responseStatus: 'Submitted' as NoticeResponseStatus,
      responseDate: input.responseDate,
      submittedDocuments: [...n.submittedDocuments, ...input.documents],
      remarks: input.remarks || n.remarks,
      riskStatus: 'Mitigating' as NoticeResponse['riskStatus'],
    } : n),
    vaultDocs: state.vaultDocs.map(d => d.vaultId && state.notices.some(n => n.noticeId === noticeId && n.noticeNo === d.noticeNo)
      ? { ...d, status: 'Responded' as VaultDocument['status'] }
      : d),
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
