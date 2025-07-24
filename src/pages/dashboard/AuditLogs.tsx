import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const { profile } = useAuth();

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (full_name)
        `);

      // Engineers only see their own logs
      if (profile.role === 'engineer') {
        query = query.eq('user_id', profile.id);
      }
      // Admins see all logs
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('insert')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('update') || action.includes('modify')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          {profile?.role === 'engineer' 
            ? 'View your activity logs' 
            : 'System activity and change logs'}
        </p>
      </div>

      <div className="space-y-4">
        {auditLogs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No audit logs found</p>
            </CardContent>
          </Card>
        ) : (
          auditLogs.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{log.action}</CardTitle>
                      <Badge className={getActionColor(log.action)}>
                        {log.table_name}
                      </Badge>
                    </div>
                    <CardDescription>
                      By: {log.profiles?.full_name} • 
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {log.record_id && (
                    <div>
                      <span className="font-medium">Record ID:</span>
                      <span className="ml-2 text-muted-foreground font-mono">{log.record_id}</span>
                    </div>
                  )}
                  
                  {log.old_values && (
                    <div>
                      <span className="font-medium">Previous Values:</span>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {log.new_values && (
                    <div>
                      <span className="font-medium">New Values:</span>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}