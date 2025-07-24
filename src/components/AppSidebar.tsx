import { useAuth } from '@/hooks/useAuth';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Package,
  FileText,
  Bell,
  FileCheck,
  PlusCircle,
  List,
  CheckCircle,
  Send,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const engineerItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Inventory Request', url: '/dashboard/request', icon: FileText },
  { title: 'Request Status', url: '/dashboard/status', icon: CheckCircle },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
  { title: 'Audit Logs', url: '/dashboard/audit', icon: FileCheck },
];

const projectManagerItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Forward Requests', url: '/dashboard/forward', icon: Send },
  { title: 'Request Status', url: '/dashboard/status', icon: CheckCircle },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
  { title: 'Audit Logs', url: '/dashboard/audit', icon: FileCheck },
];

const adminItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Add Inventory', url: '/dashboard/add-inventory', icon: PlusCircle },
  { title: 'Inventory List', url: '/dashboard/inventory', icon: List },
  { title: 'Request Status', url: '/dashboard/status', icon: CheckCircle },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
  { title: 'Audit Logs', url: '/dashboard/audit', icon: FileCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const getMenuItems = () => {
    if (!profile) return [];
    switch (profile.role) {
      case 'engineer':
        return engineerItems;
      case 'project_manager':
        return projectManagerItems;
      case 'admin':
        return adminItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {!collapsed && <span>Inventory System</span>}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto p-4">
            <div className="mb-4 text-sm text-muted-foreground">
              <p>{profile?.full_name}</p>
              <p className="capitalize">{profile?.role?.replace('_', ' ')}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}