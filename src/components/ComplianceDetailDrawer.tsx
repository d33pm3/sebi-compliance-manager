import { useComplianceStore } from '@/store/complianceStore';
import { ComplianceItem } from '@/data/complianceData';
import { effectiveRiskLevel, riskReasons } from '@/data/workflowData';
import { toTitleCaseLabel } from '@/lib/chartTheme';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { StatusBadge, RiskBadge, NatureBadge, ApprovalBadge } from '@/components/StatusBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Calendar, Building2, FileText, AlertTriangle, Upload, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ComplianceDetailDrawer() {
  const { items, drawerOpen, selectedItemId, setDrawerOpen, addComment, updateItemStatus, updateApprovalStatus } = useComplianceStore();
  const item = items.find(i => i.id === selectedItemId);
  const [commentText, setCommentText] = useState('');

  if (!item) return null;

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(item.id, {
      id: Date.now().toString(),
      author: 'You',
      text: commentText.trim(),
      timestamp: new Date().toLocaleString(),
    });
    setCommentText('');
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">#{item.sNo}</Badge>
            <NatureBadge nature={item.complianceNature} />
            <StatusBadge status={item.status} />
            <RiskBadge level={effectiveRiskLevel(item)} />
          </div>
          <SheetTitle className="text-base leading-snug">{item.filingName}</SheetTitle>
          <SheetDescription className="text-xs">{toTitleCaseLabel(item.category)}</SheetDescription>
        </SheetHeader>

        <div className="mt-3">
          <Link
            to={`/compliance/${item.id}`}
            onClick={() => setDrawerOpen(false)}
            className="inline-flex items-center gap-1 rounded-md border border-secondary/40 bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary hover:bg-secondary/20"
          >
            <FileText className="h-3 w-3" /> Open Full Detail Page
          </Link>
        </div>

        <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
          <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
            Why This Carries {effectiveRiskLevel(item)} Risk
          </p>
          <ul className="mt-1.5 space-y-1">
            {riskReasons(item).map((r, i) => (
              <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                <span className="text-warning">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>


        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <DetailField icon={<FileText className="h-3 w-3" />} label="Regulation" value={item.regReference} />
            <DetailField icon={<Building2 className="h-3 w-3" />} label="Authority" value={item.filingAuthority} />
            <DetailField icon={<Calendar className="h-3 w-3" />} label="Frequency" value={item.frequency} />
            <DetailField icon={<Calendar className="h-3 w-3" />} label="Due Date" value={item.dueDate} />
          </div>

          <Separator />

          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-foreground">Applicable To</h4>
            <p className="text-muted-foreground">{item.applicableTo}</p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-foreground">Trigger / Event</h4>
            <p className="text-muted-foreground">{item.trigger}</p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-foreground">Timeline</h4>
            <p className="text-muted-foreground">{item.timeline}</p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-foreground">Format / Mode</h4>
            <p className="text-muted-foreground">{item.format}</p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-destructive" /> Penalty
            </h4>
            <p className="text-muted-foreground">{item.penalty}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-foreground">Workflow</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{item.owner}</span></div>
              <div><span className="text-muted-foreground">Approver:</span> <span className="font-medium">{item.approver}</span></div>
              <div><span className="text-muted-foreground">Approval:</span> <ApprovalBadge status={item.approvalStatus} /></div>
              <div><span className="text-muted-foreground">Evidence:</span> <span className={item.evidenceUploaded ? 'text-success' : 'text-destructive'}>{item.evidenceUploaded ? '✓ Uploaded' : '✗ Missing'}</span></div>
            </div>
          </div>

          {item.sourceUrl && (
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-secondary hover:underline">
              <ExternalLink className="h-3 w-3" /> View SEBI Source
            </a>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-xs text-foreground">Comments ({item.comments.length})</h4>
            {item.comments.map(c => (
              <div key={c.id} className="bg-muted rounded-md p-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{c.author}</span>
                  <span className="text-muted-foreground text-[10px]">{c.timestamp}</span>
                </div>
                <p>{c.text}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="text-xs min-h-[60px]"
              />
              <Button size="icon" onClick={handleAddComment} className="flex-shrink-0 self-end">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-medium text-foreground text-xs">{value}</p>
    </div>
  );
}
