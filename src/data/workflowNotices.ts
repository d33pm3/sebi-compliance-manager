export type NoticeResponseStatus = 'Awaiting Response' | 'Drafting' | 'Submitted' | 'Closed';

export interface NoticeResponse {
  noticeId: string;
  noticeNo: string;
  subject: string;
  issuedBy: string;
  regulation: string;
  receivedOn: string;
  responseDue: string;
  responseStatus: NoticeResponseStatus;
  responseDate: string | null;
  submittedDocuments: string[];
  owner: string;
  remarks: string;
  riskStatus: 'Open' | 'Mitigating' | 'Closed';
  noticeType?: string;
  referenceOfficer?: string;
  background?: string;
  allegations?: string[];
  informationSought?: string[];
  penaltyExposure?: string;
  internalActions?: { date: string; action: string; by: string }[];
  correspondence?: { date: string; direction: 'Received' | 'Sent'; document: string }[];
}

export const noticeResponses: NoticeResponse[] = [
  {
    noticeId: '11',
    noticeNo: 'SEBI/CFD/2026/0341',
    subject: 'Show Cause Notice — Non-submission of Corporate Governance Report Q2',
    issuedBy: 'SEBI',
    regulation: 'LODR Reg 27',
    receivedOn: '2026-03-05',
    responseDue: '2026-03-20',
    responseStatus: 'Submitted',
    responseDate: '2026-03-18',
    submittedDocuments: ['Reply to SCN dated 18 Mar 2026.pdf', 'Corporate Governance Report Q2.pdf'],
    owner: 'Priya Sharma (CS)',
    remarks: 'Reply filed within timeline; awaiting SEBI acknowledgement.',
    riskStatus: 'Mitigating',
    noticeType: 'Show Cause Notice',
    referenceOfficer: 'Adjudicating Officer, Corporation Finance Department, SEBI',
    background: 'SEBI observed that the Corporate Governance Report for the quarter ended September 2025 was not submitted on the exchange portal within 21 days of the quarter end as required under Regulation 27(2)(a) of the SEBI (LODR) Regulations, 2015.',
    allegations: [
      'Corporate Governance Report for Q2 FY 2025-26 filed 9 days beyond the prescribed timeline',
      'No intimation of delay furnished to the stock exchanges',
    ],
    informationSought: [
      'Reasons for the delay, supported by internal records',
      'Copy of the Corporate Governance Report as filed with both exchanges',
      'Details of the compliance officer responsible and remedial steps taken',
    ],
    penaltyExposure: 'Fine of Rs 5,000 per day of delay under the SEBI SOP Circular; Regulation 98 of LODR',
    internalActions: [
      { date: '2026-03-06', action: 'Notice logged in the Response Tracker and linked to the Compliance Master', by: 'Priya Sharma (CS)' },
      { date: '2026-03-10', action: 'Board Committee briefed; draft reply circulated', by: 'Anita Desai (Legal)' },
      { date: '2026-03-18', action: 'Reply filed with SEBI along with the filed report', by: 'Priya Sharma (CS)' },
    ],
    correspondence: [
      { date: '2026-03-05', direction: 'Received', document: 'Show Cause Notice SEBI/CFD/2026/0341.pdf' },
      { date: '2026-03-18', direction: 'Sent', document: 'Reply to SCN dated 18 Mar 2026.pdf' },
    ],
  },
  {
    noticeId: '12',
    noticeNo: 'SEBI/ISD/2026/0198',
    subject: 'Inquiry — Insider Trading Allegation',
    issuedBy: 'SEBI',
    regulation: 'PIT Reg 3',
    receivedOn: '2026-04-02',
    responseDue: '2026-04-25',
    responseStatus: 'Drafting',
    responseDate: null,
    submittedDocuments: [],
    owner: 'Anita Desai (Legal)',
    remarks: 'Legal counsel engaged; trading window records under compilation.',
    riskStatus: 'Open',
    noticeType: 'Inquiry / Summons under Section 11C(2) of the SEBI Act',
    referenceOfficer: 'Investigating Authority, Integrated Surveillance Department, SEBI',
    background: 'SEBI has commenced a preliminary inquiry into trading in the scrip during the period 12 February 2026 to 04 March 2026, being the window immediately preceding the announcement of the Q3 results. The inquiry examines whether Unpublished Price Sensitive Information (UPSI) was shared or traded upon in contravention of Regulation 3 and Regulation 4 of the SEBI (Prohibition of Insider Trading) Regulations, 2015.',
    allegations: [
      'Trades by two designated persons during a closed trading window (PIT Reg 9 read with Schedule B)',
      'Structured Digital Database entries for the UPSI period appear incomplete (PIT Reg 3(5))',
      'Continual disclosure in Form D for one designated person filed beyond 2 trading days (PIT Reg 7(2))',
    ],
    informationSought: [
      'Extract of the Structured Digital Database for 01 Feb 2026 to 15 Mar 2026 with audit trail',
      'Trading window closure and re-opening intimations sent to NSE and BSE',
      'List of designated persons and their immediate relatives as on 31 Mar 2026 (PIT Reg 7(3))',
      'Copies of Form C and Form D disclosures received during the inquiry period',
      'Minutes of the meeting at which the Q3 results became UPSI, with the time-stamp of announcement',
    ],
    penaltyExposure: 'Section 15G of the SEBI Act — up to Rs 25 crore or 3 times the profit made, whichever is higher; prosecution for insider trading',
    internalActions: [
      { date: '2026-04-03', action: 'Notice logged; external counsel engaged and SDD frozen for audit', by: 'Anita Desai (Legal)' },
      { date: '2026-04-08', action: 'Trading window records and Form C/D disclosures compiled for the inquiry period', by: 'Priya Sharma (CS)' },
      { date: '2026-04-15', action: 'Draft reply under review by the Audit Committee Chair', by: 'Kavita Rao (Audit Chair)' },
    ],
    correspondence: [
      { date: '2026-04-02', direction: 'Received', document: 'Inquiry Letter SEBI/ISD/2026/0198.pdf' },
      { date: '2026-04-09', direction: 'Sent', document: 'Acknowledgement and request for 15-day extension.pdf' },
    ],
  },
  {
    noticeId: '13',
    noticeNo: 'NSE/LIST/2026/0412',
    subject: 'Penalty Notice — Late Filing of Shareholding Pattern',
    issuedBy: 'NSE',
    regulation: 'LODR Reg 31',
    receivedOn: '2026-02-18',
    responseDue: '2026-03-05',
    responseStatus: 'Closed',
    responseDate: '2026-02-28',
    submittedDocuments: ['Penalty payment challan.pdf', 'Explanation letter.pdf'],
    owner: 'Rajesh Kumar (CFO)',
    remarks: 'Fine paid; exchange confirmed closure.',
    riskStatus: 'Closed',
    noticeType: 'Penalty Notice',
    referenceOfficer: 'Listing Compliance Department, National Stock Exchange of India Ltd',
    background: 'The shareholding pattern for the quarter ended December 2025 was submitted 4 days after the 21-day deadline prescribed under Regulation 31(1)(b) of the SEBI (LODR) Regulations, 2015.',
    allegations: ['Delayed submission of the quarterly shareholding pattern by 4 days'],
    informationSought: [
      'Payment of the fine computed under the SEBI SOP Circular',
      'Written explanation for the delay and preventive measures adopted',
    ],
    penaltyExposure: 'Rs 5,000 per day of delay — Rs 20,000 levied and paid',
    internalActions: [
      { date: '2026-02-19', action: 'Fine computation verified against the SOP Circular', by: 'Rajesh Kumar (CFO)' },
      { date: '2026-02-28', action: 'Fine paid and explanation letter filed; exchange confirmed closure', by: 'Rajesh Kumar (CFO)' },
    ],
    correspondence: [
      { date: '2026-02-18', direction: 'Received', document: 'Penalty Notice NSE/LIST/2026/0412.pdf' },
      { date: '2026-02-28', direction: 'Sent', document: 'Penalty payment challan.pdf' },
    ],
  },
  {
    noticeId: '14',
    noticeNo: 'BSE/CORP/2026/0087',
    subject: 'Advisory — New XBRL Filing Format',
    issuedBy: 'BSE',
    regulation: 'LODR Reg 33',
    receivedOn: '2026-04-10',
    responseDue: '2026-05-01',
    responseStatus: 'Awaiting Response',
    responseDate: null,
    submittedDocuments: [],
    owner: 'Vikram Singh (Compliance)',
    remarks: 'Confirmation of readiness to be filed on the exchange portal.',
    riskStatus: 'Open',
    noticeType: 'Advisory',
    referenceOfficer: 'Corporate Relationship Department, BSE Ltd',
    background: 'BSE has advised all listed entities of a revised XBRL taxonomy for the submission of financial results under Regulation 33 of the SEBI (LODR) Regulations, 2015, effective from the quarter ending June 2026.',
    allegations: [],
    informationSought: [
      'Confirmation of readiness to file in the revised XBRL taxonomy',
      'Name and contact details of the person authorised for XBRL submissions',
    ],
    penaltyExposure: 'No monetary penalty; non-adoption will result in rejection of the results filing',
    internalActions: [
      { date: '2026-04-11', action: 'Advisory circulated to Finance and the Secretarial team', by: 'Vikram Singh (Compliance)' },
      { date: '2026-04-20', action: 'Test filing completed on the exchange portal in the new taxonomy', by: 'Neha Patel (Finance)' },
    ],
    correspondence: [
      { date: '2026-04-10', direction: 'Received', document: 'Advisory BSE/CORP/2026/0087.pdf' },
    ],
  },
];

export interface NoticeRiskItem {
  id: string;
  noticeId: string;
  noticeNo: string;
  subject: string;
  source: string;
  regulation: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  riskStatus: 'Open' | 'Mitigating' | 'Closed';
  deadline: string;
  owner: string;
  responseStatus: NoticeResponseStatus;
  daysToDeadline: number;
}

export function buildNoticeRisks(responses: NoticeResponse[], today = new Date()): NoticeRiskItem[] {
  return responses.map(n => {
    const due = new Date(n.responseDue);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    const riskLevel: NoticeRiskItem['riskLevel'] =
      n.riskStatus === 'Closed' ? 'Low' : days < 0 ? 'Critical' : n.responseStatus === 'Submitted' ? 'Medium' : 'High';
    return {
      id: `RISK-NOTICE-${n.noticeNo.replace(/[^A-Za-z0-9]/g, '-')}`,
      noticeId: n.noticeId,
      noticeNo: n.noticeNo,
      subject: n.subject,
      source: n.issuedBy,
      regulation: n.regulation,
      riskLevel,
      riskStatus: n.riskStatus,
      deadline: n.responseDue,
      owner: n.owner,
      responseStatus: n.responseStatus,
      daysToDeadline: days,
    };
  });
}
