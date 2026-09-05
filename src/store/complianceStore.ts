import { create } from 'zustand';
import { complianceItems, ComplianceItem, ComplianceStatus, ApprovalStatus, Comment, RiskLevel } from '@/data/complianceData';
import { vaultDocuments, VaultDocument } from '@/data/vaultData';
import {
  ApprovalRequest,
  ComplianceTask,
  EmailNotification,
  FilingSubmission,
  NoticeResponse,
  NoticeResponseStatus,
  TaskStatus,
  approverEmail,
  deriveComplianceState,
  effectiveRiskLevel,
  noticeResponses as seedNotices,
  seedTasks,
  taskStatusForItem,
  taskTitleForItem,
} from '@/data/workflowData';

export interface ApprovalRequestInput {
  approver: string;
  requestedBy: string;
  dueBy: string;
  note: string;
  filingId?: string | null;
}


export interface FilingSubmissionInput {
  filingDate: string;
  referenceNo: string;
  submittedBy: string;
  approver: string;
  documents: string[];
  remarks: string;
}

export interface UploadedFileMeta {
  name: string;
  sizeBytes: number;
  extension: string;
  url: string;
}

export interface DocumentUploadInput {
  /** Master Compliance Register item this evidence belongs to */
  itemId: number | null;
  section: VaultDocument['section'];
  documentType: string;
  fiscalYear: string;
  uploadedBy: string;
  /** Uploaded → evidence on record, Filed → obligation discharged */
  docStatus: 'Uploaded' | 'Filed';
  remarks: string;
  files: UploadedFileMeta[];
}


/** Editable fields of a Master Compliance Register entry */
export interface MasterEntryInput {
  category: string;
  filingName: string;
  regReference: string;
  trigger: string;
  timeline: string;
  dueDate: string;
  frequency: string;
  filingAuthority: string;
  applicableTo: string;
  format: string;
  penalty: string;
  sourceUrl: string;
  complianceNature: ComplianceItem['complianceNature'];
  obligorTier: ComplianceItem['obligorTier'];
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  approvalStatus: ApprovalStatus;
  owner: string;
  approver: string;
}

interface Filters {
  search: string;
  category: string;
  status: string;
  state: string;
  riskLevel: string;
  approvalStatus: string;
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
  approvalRequests: ApprovalRequest[];
  emailLog: EmailNotification[];

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

  // Direct Master Compliance Register maintenance
  addItem: (input: MasterEntryInput) => number;
  updateItem: (id: number, input: MasterEntryInput) => void;
  deleteItem: (id: number) => void;

  // Filing workflow — one submission updates Register, Risk and Vault together
  submitFiling: (id: number, input: FilingSubmissionInput) => void;
  approveFiling: (filingId: string, approve: boolean) => void;

  // Real document uploads into the Vault, wired to the Master Register
  uploadDocuments: (input: DocumentUploadInput) => void;
  deleteVaultDoc: (vaultId: string) => void;


  // Compliance to-do lists
  addTask: (itemId: number, task: { title: string; owner: string; deadline: string }) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;

  // Approval requests with email notifications
  requestApproval: (itemId: number, input: ApprovalRequestInput) => void;
  decideApprovalRequest: (requestId: string, approve: boolean, note: string, decidedBy?: string) => void;

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
  state: '',
  riskLevel: '',
  approvalStatus: '',
  complianceNature: '',
  obligorTier: '',
};

export const useComplianceStore = create<ComplianceStore>((set, get) => ({
  items: complianceItems,
  filings: [],
  tasks: seedTasks(complianceItems),
  notices: seedNotices,
  vaultDocs: vaultDocuments,
  approvalRequests: [],
  emailLog: [],

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

  /* ---------------------------------------------------------------- */
  /* Master Compliance Register maintenance — the single source of      */
  /* truth every other module reads from.                              */
  /* ---------------------------------------------------------------- */

  addItem: (input) => {
    const state = get();
    const id = state.items.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const sNo = state.items.reduce((max, i) => Math.max(max, i.sNo), 0) + 1;
    const item: ComplianceItem = {
      id,
      sNo,
      category: input.category,
      filingName: input.filingName,
      regReference: input.regReference,
      applicableTo: input.applicableTo,
      filingAuthority: input.filingAuthority,
      frequency: input.frequency,
      trigger: input.trigger,
      timeline: input.timeline,
      format: input.format,
      penalty: input.penalty,
      sourceUrl: input.sourceUrl || 'https://www.sebi.gov.in',
      complianceNature: input.complianceNature,
      obligorTier: input.obligorTier,
      dueDate: input.dueDate,
      status: input.status,
      riskLevel: input.riskLevel,
      owner: input.owner,
      approver: input.approver,
      approvalStatus: input.approvalStatus,
      comments: [{
        id: `${Date.now()}`,
        author: input.owner,
        text: `Entry created in the Master Compliance Register on ${new Date().toISOString().split('T')[0]}.`,
        timestamp: new Date().toLocaleString(),
      }],
      evidenceUploaded: false,
    };
    set({
      items: [...state.items, item],
      // Every master entry gets its mirrored task, so counts stay reconciled
      tasks: [
        {
          id: `T-${id}`,
          itemId: id,
          title: taskTitleForItem(item),
          owner: item.owner,
          deadline: item.dueDate,
          status: taskStatusForItem(item),
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...state.tasks,
      ],
    });
    return id;
  },

  updateItem: (id, input) => set(state => {
    const updated = state.items.map(i => i.id === id ? {
      ...i,
      ...input,
      sourceUrl: input.sourceUrl || i.sourceUrl,
      comments: [...i.comments, {
        id: `${Date.now()}`,
        author: input.owner || i.owner,
        text: `Master Compliance Register entry updated on ${new Date().toISOString().split('T')[0]}.`,
        timestamp: new Date().toLocaleString(),
      }],
    } : i);
    const item = updated.find(i => i.id === id);
    return {
      items: updated,
      // The mirrored task follows the master entry's owner, deadline and status
      tasks: item
        ? state.tasks.map(t => t.id === `T-${id}`
            ? { ...t, owner: item.owner, deadline: item.dueDate, status: taskStatusForItem(item), title: taskTitleForItem(item) }
            : t)
        : state.tasks,
    };
  }),

  deleteItem: (id) => set(state => ({
    items: state.items.filter(i => i.id !== id),
    tasks: state.tasks.filter(t => t.itemId !== id),
    filings: state.filings.filter(f => f.itemId !== id),
    vaultDocs: state.vaultDocs.filter(d => d.itemId !== id),
    selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
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
      // Filing done → the mirrored task closes out too
      tasks: state.tasks.map(t => t.itemId === id ? { ...t, status: 'Done' as TaskStatus } : t),
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
      tasks: state.tasks.map(t => t.itemId === filing.itemId
        ? { ...t, status: (approve ? 'Done' : 'In Progress') as TaskStatus }
        : t),
    };
  }),

  uploadDocuments: (input) => set(state => {
    const item = input.itemId != null ? state.items.find(i => i.id === input.itemId) : undefined;
    const today = new Date().toISOString().split('T')[0];
    const stamp = Date.now();
    const newDocs: VaultDocument[] = input.files.map((f, idx) => {
      const vaultId = `VAULT-UPL-${today.replace(/-/g, '').slice(0, 8)}-${String(stamp).slice(-5)}${idx + 1}`;
      return {
        id: vaultId,
        vaultId,
        title: item ? `${item.filingName} — ${f.name}` : f.name,
        // Category and regulation always mirror the Master Compliance Register
        category: item ? item.category : 'Uploaded Document',
        section: input.section,
        documentType: input.documentType,
        fiscalYear: input.fiscalYear,
        uploadedBy: input.uploadedBy || 'Compliance Team',
        uploadedAt: today,
        fileSize: `${(f.sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        fileType: f.extension.toUpperCase(),
        regulation: item ? item.regReference : 'All',
        status: input.docStatus,
        itemId: item?.id,
        fileUrl: f.url,
        fileName: f.name,
      };
    });

    if (!item) return { vaultDocs: [...newDocs, ...state.vaultDocs] };

    const filed = input.docStatus === 'Filed';
    return {
      vaultDocs: [...newDocs, ...state.vaultDocs],
      tasks: state.tasks.map(t => t.itemId === item.id
        ? { ...t, status: (filed ? 'Done' : t.status === 'Open' ? 'In Progress' : t.status) as TaskStatus }
        : t),
      items: state.items.map(i => i.id === item.id ? {
        ...i,
        // Evidence now on record — clears "Documents Missing" everywhere at once
        evidenceUploaded: true,
        status: (filed
          ? 'Completed'
          : i.status === 'Not Started' ? 'In Progress' : i.status) as ComplianceStatus,
        approvalStatus: (i.approvalStatus === 'Doc Missing' || i.approvalStatus === 'Not Started'
          ? 'Pending'
          : i.approvalStatus) as ApprovalStatus,
        comments: [...i.comments, {
          id: String(stamp),
          author: input.uploadedBy || 'Compliance Team',
          text: `${input.files.length} document(s) uploaded to the Document Vault on ${today} (${input.documentType}, ${input.fiscalYear})${filed ? ' and the filing marked as completed' : ''}.${input.remarks ? ` Remarks: ${input.remarks}` : ''}`,
          timestamp: new Date().toLocaleString(),
        }],
      } : i),
    };
  }),

  deleteVaultDoc: (vaultId) => set(state => ({
    vaultDocs: state.vaultDocs.filter(d => d.vaultId !== vaultId),
  })),



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

  requestApproval: (itemId, input) => set(state => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return {};
    const today = new Date().toISOString().split('T')[0];
    const email = approverEmail(input.approver);
    const notification: EmailNotification = {
      id: `MAIL-${Date.now()}`,
      to: email,
      subject: `Approval required: ${item.filingName} (${item.regReference})`,
      body: `${input.requestedBy} has requested your approval for "${item.filingName}" under ${item.regReference}. Statutory due date ${item.dueDate}. Please decide by ${input.dueBy}.${input.note ? ` Note: ${input.note}` : ''}`,
      sentAt: new Date().toLocaleString(),
    };
    const request: ApprovalRequest = {
      id: `APR-${itemId}-${state.approvalRequests.length + 1}`,
      itemId,
      filingId: input.filingId ?? null,
      requestedBy: input.requestedBy,
      approver: input.approver,
      approverEmail: email,
      requestedOn: today,
      dueBy: input.dueBy,
      note: input.note,
      status: 'Pending',
      decidedOn: null,
      decidedBy: null,
      decisionNote: '',
      notifications: [notification],
    };
    return {
      approvalRequests: [request, ...state.approvalRequests],
      emailLog: [notification, ...state.emailLog],
      items: state.items.map(i => i.id === itemId ? {
        ...i,
        approvalStatus: 'Pending' as ApprovalStatus,
        approver: input.approver,
        comments: [...i.comments, {
          id: String(Date.now()),
          author: input.requestedBy,
          text: `Approval requested from ${input.approver} (${email}) on ${today}, decision due by ${input.dueBy}.`,
          timestamp: new Date().toLocaleString(),
        }],
      } : i),
    };
  }),

  decideApprovalRequest: (requestId, approve, note, decidedBy) => set(state => {
    const request = state.approvalRequests.find(r => r.id === requestId);
    if (!request) return {};
    const item = state.items.find(i => i.id === request.itemId);
    const today = new Date().toISOString().split('T')[0];
    const decider = decidedBy || request.approver;
    const notification: EmailNotification = {
      id: `MAIL-${Date.now()}`,
      to: approverEmail(request.requestedBy),
      subject: `Approval ${approve ? 'approved' : 'declined'}: ${item?.filingName ?? 'Compliance item'}`,
      body: `${decider} has ${approve ? 'approved' : 'declined'} the approval request raised on ${request.requestedOn}.${note ? ` Remarks: ${note}` : ''}`,
      sentAt: new Date().toLocaleString(),
    };
    return {
      approvalRequests: state.approvalRequests.map(r => r.id === requestId ? {
        ...r,
        status: approve ? 'Approved' : 'Declined',
        decidedOn: today,
        decidedBy: decider,
        decisionNote: note,
        notifications: [...r.notifications, notification],
      } : r),
      emailLog: [notification, ...state.emailLog],
      filings: state.filings.map(f => request.filingId && f.id === request.filingId
        ? { ...f, approvalStatus: approve ? 'Approved' : 'Rejected', approvedOn: today }
        : f),
      items: state.items.map(i => i.id === request.itemId ? {
        ...i,
        approvalStatus: (approve ? 'Approved' : 'Rejected') as ApprovalStatus,
        status: approve ? i.status : ('In Progress' as ComplianceStatus),
        comments: [...i.comments, {
          id: String(Date.now() + 1),
          author: decider,
          text: `Approval ${approve ? 'approved' : 'declined'} on ${today}.${note ? ` Remarks: ${note}` : ''} Notification emailed to ${notification.to}.`,
          timestamp: new Date().toLocaleString(),
        }],
      } : i),
    };
  }),

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
      if (filters.state && deriveComplianceState(item) !== filters.state) return false;
      if (filters.riskLevel && effectiveRiskLevel(item) !== filters.riskLevel) return false;
      if (filters.approvalStatus && item.approvalStatus !== filters.approvalStatus) return false;
      if (filters.complianceNature && item.complianceNature !== filters.complianceNature) return false;
      if (filters.obligorTier && item.obligorTier !== filters.obligorTier) return false;
      return true;
    });
  },
}));
