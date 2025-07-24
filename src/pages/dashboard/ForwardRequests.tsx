import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ForwardRequests() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_requests')
        .select(`
          *,
          inventory_items (name, sku),
          profiles!inventory_requests_requested_by_fkey (full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const forwardToAdmin = async (requestId: string) => {
    try {
      // Update request status to approved by project manager
      const { error: updateError } = await supabase
        .from('inventory_requests')
        .update({
          status: 'approved',
          approved_by: profile?.id,
          approved_date: new Date().toISOString(),
          notes: 'Forwarded to admin by project manager'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create notification for admin
      const { data: adminProfiles, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (adminError) throw adminError;

      if (adminProfiles.length > 0) {
        const notifications = adminProfiles.map(admin => ({
          user_id: admin.id,
          title: 'New Request Forwarded',
          message: 'A project manager has forwarded an inventory request for your review.',
          type: 'info'
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) throw notificationError;
      }

      toast({
        title: 'Request forwarded',
        description: 'The request has been forwarded to admin successfully.',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
        <h1 className="text-3xl font-bold">Forward Requests</h1>
        <p className="text-muted-foreground">Review and forward inventory requests to admin</p>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No pending requests to forward</p>
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
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending Review
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
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
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => forwardToAdmin(request.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Forward to Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}