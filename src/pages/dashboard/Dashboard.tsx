import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Package, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', profile?.id],
    queryFn: async () => {
      if (!profile) return null;

      // Get inventory stats
      const { data: inventoryStats } = await supabase
        .from('inventory_items')
        .select('status', { count: 'exact' });

      // Get request stats
      let requestQuery = supabase
        .from('inventory_requests')
        .select('status', { count: 'exact' });

      if (profile.role === 'engineer') {
        requestQuery = requestQuery.eq('requested_by', profile.id);
      }

      const { data: requestStats } = await requestQuery;

      // Get recent notifications
      const { data: recentNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(3);

      return {
        inventory: inventoryStats || [],
        requests: requestStats || [],
        notifications: recentNotifications || []
      };
    },
    enabled: !!profile,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const inventoryCounts = stats?.inventory.reduce((acc: any, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const requestCounts = stats?.requests.reduce((acc: any, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryCounts.available || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestCounts.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestCounts.approved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for fulfillment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.notifications.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      {stats?.notifications && stats.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest unread notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-1">
                  {notification.type}
                </Badge>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  {notification.message && (
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Role-specific quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile?.role === 'engineer' && (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Request Inventory</h3>
                  <p className="text-sm text-muted-foreground">Submit a new inventory request</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Check Status</h3>
                  <p className="text-sm text-muted-foreground">View your request status</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">View Notifications</h3>
                  <p className="text-sm text-muted-foreground">Check recent updates</p>
                </div>
              </>
            )}

            {profile?.role === 'project_manager' && (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Forward Requests</h3>
                  <p className="text-sm text-muted-foreground">Review and forward to admin</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Manage Requests</h3>
                  <p className="text-sm text-muted-foreground">Approve or reject requests</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">View Reports</h3>
                  <p className="text-sm text-muted-foreground">Check audit logs</p>
                </div>
              </>
            )}

            {profile?.role === 'admin' && (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Add Inventory</h3>
                  <p className="text-sm text-muted-foreground">Add new items to inventory</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Manage Inventory</h3>
                  <p className="text-sm text-muted-foreground">View and update all items</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">System Overview</h3>
                  <p className="text-sm text-muted-foreground">Monitor system activity</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}