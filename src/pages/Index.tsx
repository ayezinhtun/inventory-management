import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, BarChart3 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary mb-6">Inventory Management System</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your inventory operations with role-based access control and real-time tracking
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Package className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Engineer Dashboard</CardTitle>
              <CardDescription>
                Request inventory items, track status, and receive notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Project Manager</CardTitle>
              <CardDescription>
                Review and forward requests, manage team notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Admin Control</CardTitle>
              <CardDescription>
                Full system control, inventory management, and audit logs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <a href="/auth">Get Started</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
