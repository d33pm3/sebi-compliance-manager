import {
  LayoutDashboard,
  Bot,
  ShieldAlert,
  FolderArchive,
  MessageSquare,
  MailWarning,
  ListTodo,
  CalendarClock,
  BarChart3,
  Settings,
  Shield,
  Target,
  CalendarDays,
  ClipboardList,
  FilePlus2,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const modules = [
  { title: 'Compliance Agent', url: '/register-agent', icon: Bot, module: 'M1' },
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, module: 'M2' },
  { title: 'Risk Assessment', url: '/risk-assessment', icon: ShieldAlert, module: 'M3' },
  { title: 'Doc Vault', url: '/doc-vault', icon: FolderArchive, module: 'M4' },
  { title: 'Response Tracker', url: '/response-tracker', icon: MailWarning, module: 'M8' },
  { title: 'Task Manager', url: '/tasks', icon: ListTodo, module: 'M9' },
  { title: 'Compliance Timeline', url: '/timeline', icon: CalendarClock, module: 'M10' },
  { title: 'KPIs', url: '/kpis', icon: Target, module: 'M11' },
  { title: 'Compliance Calendar', url: '/calendar', icon: CalendarDays, module: 'M12' },
  { title: 'Risk Action Plan', url: '/risk-action-plan', icon: ClipboardList, module: 'M13' },
  { title: 'Register Editor', url: '/register-manager', icon: FilePlus2, module: 'M14' },
  { title: 'Agent Deliverables', url: '/agent-outputs/register-extract', icon: Bot, module: 'M15' },


  { title: 'AI Chatbot', url: '/chatbot', icon: MessageSquare, module: 'M5' },
  { title: 'Assistant', url: '/assistant', icon: BarChart3, module: 'M6' },
  { title: 'Admin', url: '/admin', icon: Settings, module: 'M7' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-sidebar-primary flex-shrink-0" />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">SEBI Compliance Manager</h1>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            Modules
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] font-mono opacity-50">{item.module}</span>
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="text-[10px] text-sidebar-foreground/40 text-center">
            LODR 2015 · PIT 2015 · SAST 2011
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
