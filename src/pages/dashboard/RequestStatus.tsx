import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function RequestStatus() {
  const { profile } = useAuth();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['user-requests', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      let query = supabase
        .from('inventory_requests')
        .select(`
          *,
          inventory_items (name, sku),
          profiles!inventory_requests_requested_by_fkey (full_name),
          approved_by_profile:profiles!inventory_requests_approved_by_fkey (full_name)
        `);

      // Engineers only see their own requests
      if (profile.role === 'engineer') {
        query = query.eq('requested_by', profile.id);
      }
      // Project managers and admins see all requests
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('inventory_requests')
        .update({
          status: 'approved',
          approved_by: profile.id,
          approved_date: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      
      // Refetch requests
      refetch();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('inventory_requests')
        .update({
          status: 'rejected',
          approved_by: profile.id,
          approved_date: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      
      // Refetch requests
      refetch();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Request Status</h1>
        <p className="text-muted-foreground">
          {profile?.role === 'engineer' 
            ? 'View your inventory requests' 
            : 'Manage inventory requests'}
        </p>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No requests found</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.inventory_items?.name}</CardTitle>
                    <CardDescription>
                      SKU: {request.inventory_items?.sku} • 
                      Requested by: {request.profiles?.full_name}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Quantity</p>
                    <p className="text-muted-foreground">{request.quantity_requested}</p>
                  </div>
                  <div>
                    <p className="font-medium">Purpose</p>
                    <p className="text-muted-foreground">{request.purpose}</p>
                  </div>
                  <div>
                    <p className="font-medium">Request Date</p>
                    <p className="text-muted-foreground">
                      {format(new Date(request.request_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {request.approved_date && (
                    <div>
                      <p className="font-medium">Approved Date</p>
                      <p className="text-muted-foreground">
                        {format(new Date(request.approved_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {request.approved_by_profile && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium">Approved by: {request.approved_by_profile.full_name}</p>
                  </div>
                )}

                {request.notes && (
                  <div className="mt-4">
                    <p className="font-medium text-sm">Notes:</p>
                    <p className="text-sm text-muted-foreground">{request.notes}</p>
                  </div>
                )}

                {(profile?.role === 'project_manager' || profile?.role === 'admin') && 
                 request.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}