import { AppLayout } from '@/components/AppLayout';
import { useComplianceStore } from '@/store/complianceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, RiskBadge } from '@/components/StatusBadges';
import { buildNoticeRisks, linkedComplianceItems } from '@/data/workflowData';
import { toTitleCaseLabel } from '@/lib/chartTheme';
import {
  AlertTriangle, ArrowLeft, Building2, Calendar, ExternalLink, FileText, Mail, Scale, ShieldAlert, User,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const pill =
  'inline-flex items-center justify-center rounded-full text-[10px] font-semibold whitespace-nowrap min-w-[76px] h-5 px-2.5 leading-none';

export default function NoticeDetail() {
  const { noticeId } = useParams();
  const notices = useComplianceStore(s => s.notices);
  const items = useComplianceStore(s => s.items);

  const navigate = useNavigate();

  const notice = notices.find(n => n.noticeId === noticeId);

  const risk = useMemo(
    () => (notice ? buildNoticeRisks([notice])[0] : null),
    [notice],
  );

  // Linked Master Register items, derived from the regulation reference
  const linked = useMemo(
    () => (notice ? linkedComplianceItems(notice.regulation, items) : []),
    [notice, items],
  );

  if (!notice || !risk) {
    return (
      <AppLayout title="Notice Detail">
        <div className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">This notice could not be found.</p>
          <Link to="/response-tracker">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" /> Back to Response Tracker
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Notice Detail">
      <div className="p-4 md:p-6 space-y-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/response-tracker">
            <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 gap-1">
              <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" /> Response Tracker
            </Button>
          </Link>
          <Link to="/risk-assessment" className="text-[11px] font-medium text-secondary hover:underline">
            Open Risk Assessment
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
              <span className="font-mono text-xs">{notice.noticeNo}</span>
              <RiskBadge level={risk.riskLevel} />
              <span
                className={`${pill} ${
                  notice.riskStatus === 'Open'
                    ? 'bg-destructive text-destructive-foreground'
                    : notice.riskStatus === 'Mitigating'
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-success text-success-foreground'
                }`}
              >
                {notice.riskStatus}
              </span>
              <span className={`${pill} bg-secondary text-secondary-foreground`}>{notice.responseStatus}</span>
            </div>
            <CardTitle className="text-base font-semibold leading-snug pt-1">{notice.subject}</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {notice.noticeType ?? 'Notice'} — {notice.regulation}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field icon={Building2} label="Issued By" value={notice.issuedBy} />
              <Field icon={Calendar} label="Received On" value={notice.receivedOn} />
              <Field
                icon={Calendar}
                label="Response Due"
                value={notice.responseDue}
                hint={
                  risk.daysToDeadline < 0
                    ? `${Math.abs(risk.daysToDeadline)} days overdue`
                    : `${risk.daysToDeadline} days left`
                }
                danger={risk.daysToDeadline < 0}
              />
              <Field icon={User} label="Owner" value={notice.owner} />
              <Field icon={Scale} label="Regulation" value={notice.regulation} />
              <Field icon={FileText} label="Response Filed On" value={notice.responseDate ?? 'Not yet filed'} />
              <Field icon={User} label="Issuing Officer" value={notice.referenceOfficer ?? notice.issuedBy} />
              <Field icon={Mail} label="Risk Item ID" value={risk.id} />
            </div>

            {notice.background && (
              <>
                <Separator />
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-1">Background</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{notice.background}</p>
                </div>
              </>
            )}

            {notice.penaltyExposure && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[11px] font-semibold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> Penalty Exposure
                </p>
                <p className="text-xs text-muted-foreground mt-1">{notice.penaltyExposure}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {notice.allegations && notice.allegations.length > 0 && (
            <ListCard title="Observations / Allegations" items={notice.allegations} tone="destructive" />
          )}
          {notice.informationSought && notice.informationSought.length > 0 && (
            <ListCard title="Information Sought" items={notice.informationSought} tone="muted" />
          )}
        </div>

        {/* Linked compliance master items */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                Linked Compliance Master Items ({linked.length})
              </CardTitle>
              <Link to="/" className="text-[10px] font-medium text-secondary hover:underline">
                Open Master Register
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Matched live from the Master Compliance Register on the regulation reference, so any change in the
              master flows through here automatically
            </p>
          </CardHeader>
          <CardContent>
            {linked.length === 0 ? (
              <p className="text-xs text-muted-foreground">No matching master items for this regulation.</p>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Filing Name</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-[10px] hidden lg:table-cell">Regulation</TableHead>
                      <TableHead className="text-[10px]">Status</TableHead>
                      <TableHead className="text-[10px]">Due Date</TableHead>
                      <TableHead className="text-[10px]">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linked.map(i => (
                      <TableRow key={i.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/compliance/${i.id}`)}>
                        <TableCell className="text-xs font-medium max-w-[260px]">{i.filingName}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">
                          {toTitleCaseLabel(i.category)}
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">
                          {i.regReference}
                        </TableCell>
                        <TableCell><StatusBadge status={i.status} /></TableCell>
                        <TableCell className="text-xs">{i.dueDate}</TableCell>
                        <TableCell>
                          <Link
                            to={`/compliance/${i.id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] font-medium text-secondary hover:underline inline-flex items-center gap-1"
                          >
                            Full Detail <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Internal action trail */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Internal Action Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(notice.internalActions ?? []).map((a, idx) => (
                <div key={idx} className="flex gap-2.5">
                  <span className="text-[10px] font-mono text-muted-foreground w-[74px] flex-shrink-0 pt-0.5">
                    {a.date}
                  </span>
                  <div>
                    <p className="text-xs text-foreground">{a.action}</p>
                    <p className="text-[10px] text-muted-foreground">{a.by}</p>
                  </div>
                </div>
              ))}
              {(notice.internalActions ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No actions recorded yet.</p>
              )}
              {notice.remarks && (
                <>
                  <Separator />
                  <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Remarks: </span>{notice.remarks}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Documents & correspondence */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Documents & Correspondence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...(notice.correspondence ?? [])].map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate" title={c.document}>{c.document}</span>
                  <span className={`${pill} ${c.direction === 'Received' ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}`}>
                    {c.direction}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground w-[74px] text-right flex-shrink-0">{c.date}</span>
                </div>
              ))}
              {notice.submittedDocuments.length > 0 && (
                <>
                  <Separator />
                  <p className="text-[11px] font-semibold">Submitted with the response</p>
                  {notice.submittedDocuments.map(d => (
                    <div key={d} className="flex items-center gap-2 text-xs">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate" title={d}>{d}</span>
                    </div>
                  ))}
                </>
              )}
              {(notice.correspondence ?? []).length === 0 && notice.submittedDocuments.length === 0 && (
                <p className="text-xs text-muted-foreground">No documents on record yet.</p>
              )}
              <Separator />
              <Link to="/document-vault" className="text-[10px] font-medium text-secondary hover:underline">
                Open Document Vault
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  hint,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-2.5">
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3 flex-shrink-0" /> {label}
      </p>
      <p className={`text-xs font-medium mt-0.5 ${danger ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
      {hint && <p className={`text-[10px] ${danger ? 'text-destructive' : 'text-muted-foreground'}`}>{hint}</p>}
    </div>
  );
}

function ListCard({ title, items, tone }: { title: string; items: string[]; tone: 'destructive' | 'muted' }) {
  return (
    <Card className={tone === 'destructive' ? 'border-destructive/30' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-semibold ${tone === 'destructive' ? 'text-destructive' : ''}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-2">
              <span className="text-foreground font-semibold flex-shrink-0">{i + 1}.</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
