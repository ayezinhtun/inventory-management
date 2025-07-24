import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function InventoryRequest() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '',
    quantity_requested: '',
    purpose: '',
  });

  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'available')
        .gt('quantity', 0);
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('inventory_requests')
        .insert({
          item_id: formData.item_id,
          requested_by: profile.id,
          quantity_requested: parseInt(formData.quantity_requested),
          purpose: formData.purpose,
        });

      if (error) throw error;

      toast({
        title: 'Request submitted',
        description: 'Your inventory request has been submitted successfully.',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      setFormData({
        item_id: '',
        quantity_requested: '',
        purpose: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">Inventory Request</h1>
        <p className="text-muted-foreground">Submit a request for inventory items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Request</CardTitle>
          <CardDescription>Fill out the form below to request inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <Select value={formData.item_id} onValueChange={(value) => setFormData(prev => ({ ...prev, item_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - Available: {item.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Requested</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity_requested}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_requested: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Describe why you need this item..."
                required
              />
            </div>

            <Button type="submit" disabled={loading || !formData.item_id}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}