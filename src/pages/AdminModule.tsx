import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { mockUsers, mockAuditLogs, systemHealthItems, queueStats, last24hStats, companySettings } from '@/data/adminData';
import { Users, Settings, Mail, Bot, Database, Shield, Activity, Search, Plus, Download, UserCog, Eye, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Server } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminModule() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchUsers, setSearchUsers] = useState('');
  const [searchLogs, setSearchLogs] = useState('');

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(searchUsers.toLowerCase()) || u.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredLogs = mockAuditLogs.filter(l =>
    l.user.toLowerCase().includes(searchLogs.toLowerCase()) || l.action.toLowerCase().includes(searchLogs.toLowerCase()) || l.details.toLowerCase().includes(searchLogs.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
      case 'degraded': return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
      case 'offline': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return null;
    }
  };

  return (
    <AppLayout title="Administrator" subtitle="Module 7 — System Configuration & User Management">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="users" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="company" className="text-xs"><Settings className="h-3.5 w-3.5 mr-1" /> Company</TabsTrigger>
          <TabsTrigger value="email" className="text-xs"><Mail className="h-3.5 w-3.5 mr-1" /> Email</TabsTrigger>
          <TabsTrigger value="agent" className="text-xs"><Bot className="h-3.5 w-3.5 mr-1" /> Agent Config</TabsTrigger>
          <TabsTrigger value="register" className="text-xs"><Database className="h-3.5 w-3.5 mr-1" /> Register</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs"><Shield className="h-3.5 w-3.5 mr-1" /> Audit Logs</TabsTrigger>
          <TabsTrigger value="health" className="text-xs"><Activity className="h-3.5 w-3.5 mr-1" /> Health</TabsTrigger>
        </TabsList>

        {/* Page 1: User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">User Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search users..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="h-8 text-xs pl-8 w-44" />
                  </div>
                  <Button size="sm" className="h-8 text-xs" onClick={() => toast.info('Add User modal — simulation only')}><Plus className="h-3.5 w-3.5 mr-1" /> Add User</Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs"><Download className="h-3.5 w-3.5 mr-1" /> Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Name</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Email</TableHead>
                      <TableHead className="text-[10px]">Role</TableHead>
                      <TableHead className="text-[10px] hidden lg:table-cell">Department</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Last Login</TableHead>
                      <TableHead className="text-[10px]">Status</TableHead>
                      <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                      <TableHead className="text-[10px] hidden lg:table-cell">Approver</TableHead>
                      <TableHead className="text-[10px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="text-xs font-medium">{user.name}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{user.email}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{user.role}</Badge></TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell">{user.department}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{user.lastLogin}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] ${user.status === 'Active' ? 'bg-success/15 text-success border-success/30' : 'bg-muted text-muted-foreground'}`}>{user.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{user.assignedOwner || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{user.assignedApprover || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit"><UserCog className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="View Activity"><Eye className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page 2: Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Company Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Company Name</Label><Input defaultValue={companySettings.companyName} className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Company PAN</Label><Input defaultValue={companySettings.companyPAN} className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Company ISIN</Label><Input defaultValue={companySettings.companyISIN} className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">CIN</Label><Input defaultValue={companySettings.cin} className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Compliance Contact Email</Label><Input defaultValue={companySettings.complianceEmail} className="h-8 text-xs" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Market Cap Category</Label>
                  <Select defaultValue={companySettings.marketCapCategory}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Top 100">Top 100</SelectItem>
                      <SelectItem value="Top 500">Top 500</SelectItem>
                      <SelectItem value="Top 1000">Top 1000</SelectItem>
                      <SelectItem value="Top 2000">Top 2000</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fiscal Year Start</Label>
                  <Select defaultValue={companySettings.fiscalYearStart}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="January">January</SelectItem>
                      <SelectItem value="April">April</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch defaultChecked={companySettings.listedNSE} /><Label className="text-xs">Listed on NSE</Label></div>
                <div className="flex items-center gap-2"><Switch defaultChecked={companySettings.listedBSE} /><Label className="text-xs">Listed on BSE</Label></div>
              </div>
              <Button size="sm" onClick={() => toast.success('Settings saved')} className="text-xs">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page 3: Email / SMTP */}
        <TabsContent value="email">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Email / SMTP Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">SMTP Host</Label><Input defaultValue="smtp.gmail.com" className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">SMTP Port</Label><Input defaultValue="587" className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Username</Label><Input defaultValue="compliance@e-cxo.com" className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Password</Label><Input type="password" defaultValue="••••••••" className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">From Name</Label><Input defaultValue="e-cxo Compliance" className="h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-xs">From Email</Label><Input defaultValue="compliance@e-cxo.com" className="h-8 text-xs" /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => toast.success('Connection successful')}>Test Connection</Button>
                <Button size="sm" className="text-xs" onClick={() => toast.success('SMTP settings saved')}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page 4: Agent Configuration */}
        <TabsContent value="agent">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Agent Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">API Keys</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs">Anthropic API Key</Label><Input type="password" defaultValue="••••••••" className="h-8 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">AWS S3 Bucket</Label><Input defaultValue="exco-compliance-vault" className="h-8 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">AWS Access Key ID</Label><Input type="password" defaultValue="••••••••" className="h-8 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">AWS Secret Access Key</Label><Input type="password" defaultValue="••••••••" className="h-8 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">AWS Region</Label><Input defaultValue="ap-south-1" className="h-8 text-xs" /></div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEBI Scraper Settings</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs">Max Items per Run</Label><Input type="number" defaultValue={200} className="h-8 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Timeout (seconds)</Label><Input type="number" defaultValue={60} className="h-8 text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Retry Attempts</Label><Input type="number" defaultValue={3} className="h-8 text-xs" /></div>
                </div>
              </div>
              <Button size="sm" className="text-xs" onClick={() => toast.success('Agent configuration saved')}>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page 5: Register Management */}
        <TabsContent value="register">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Compliance Register Management</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold">Bulk Import</p>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info('Upload simulation')}>
                      <Database className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs">Upload Excel file with compliance items</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Supported: XLSX, XLS, CSV</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold">Bulk Assign</p>
                    <div className="space-y-2">
                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Owner" /></SelectTrigger><SelectContent>{mockUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select>
                      <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Approver" /></SelectTrigger><SelectContent>{mockUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select>
                      <Button size="sm" className="text-xs w-full" onClick={() => toast.success('Bulk assignment saved')}>Assign Selected</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold">Alert Rules</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-md"><div><p className="text-xs font-medium">Due Soon Alert</p><p className="text-[10px] text-muted-foreground">15 days before due date</p></div><Switch defaultChecked /></div>
                    <div className="flex items-center justify-between p-3 border rounded-md"><div><p className="text-xs font-medium">Overdue Escalation</p><p className="text-[10px] text-muted-foreground">Auto-escalate after 3 days</p></div><Switch defaultChecked /></div>
                    <div className="flex items-center justify-between p-3 border rounded-md"><div><p className="text-xs font-medium">Daily Digest Email</p><p className="text-[10px] text-muted-foreground">Summary at 9:00 AM</p></div><Switch /></div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page 6: Audit Logs */}
        <TabsContent value="audit">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">Audit Log</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search logs..." value={searchLogs} onChange={e => setSearchLogs(e.target.value)} className="h-8 text-xs pl-8 w-44" />
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs"><Download className="h-3.5 w-3.5 mr-1" /> Export CSV</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Timestamp</TableHead>
                      <TableHead className="text-[10px]">User</TableHead>
                      <TableHead className="text-[10px]">Action</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Entity</TableHead>
                      <TableHead className="text-[10px] hidden lg:table-cell">Details</TableHead>
                      <TableHead className="text-[10px] hidden md:table-cell">Module</TableHead>
                      <TableHead className="text-[10px] hidden lg:table-cell">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-[11px] text-muted-foreground font-mono">{log.timestamp}</TableCell>
                        <TableCell className="text-xs font-medium">{log.user}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{log.action}</Badge></TableCell>
                        <TableCell className="text-[11px] text-muted-foreground font-mono hidden md:table-cell">{log.entityId}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{log.details}</TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{log.module}</Badge></TableCell>
                        <TableCell className="text-[11px] text-muted-foreground font-mono hidden lg:table-cell">{log.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page 7: System Health */}
        <TabsContent value="health">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold">Service Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {systemHealthItems.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-2.5 rounded-md border">
                      <div className="flex items-center gap-2">
                        {statusIcon(item.status)}
                        <span className="text-xs font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.latency && <span className="text-[10px] text-muted-foreground">{item.latency}</span>}
                        <Badge variant="outline" className={`text-[10px] ${item.status === 'online' ? 'bg-success/15 text-success border-success/30' : item.status === 'degraded' ? 'bg-warning/15 text-warning border-warning/30' : 'bg-destructive/15 text-destructive border-destructive/30'}`}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold">Queue Statistics</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {queueStats.map(q => (
                    <div key={q.name} className="flex items-center justify-between p-2.5 rounded-md border">
                      <span className="text-xs font-medium font-mono">{q.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground">{q.waiting} waiting</span>
                        <span className="text-[11px] text-muted-foreground">{q.active} active</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold">Last 24 Hours</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-4 border rounded-md"><p className="text-2xl font-bold text-foreground">{last24hStats.apiRequests.toLocaleString()}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">API Requests</p></div>
                  <div className="text-center p-4 border rounded-md"><p className="text-2xl font-bold text-foreground">{last24hStats.emailsSent}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Emails Sent</p></div>
                  <div className="text-center p-4 border rounded-md"><p className="text-2xl font-bold text-foreground">{last24hStats.documentsUploaded}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Docs Uploaded</p></div>
                  <div className="text-center p-4 border rounded-md"><p className="text-2xl font-bold text-foreground">{last24hStats.agentRuns}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agent Runs</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
