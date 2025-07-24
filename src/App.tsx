import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import InventoryRequest from "./pages/dashboard/InventoryRequest";
import RequestStatus from "./pages/dashboard/RequestStatus";
import AddInventory from "./pages/dashboard/AddInventory";
import InventoryList from "./pages/dashboard/InventoryList";
import Notifications from "./pages/dashboard/Notifications";
import AuditLogs from "./pages/dashboard/AuditLogs";
import ForwardRequests from "./pages/dashboard/ForwardRequests";
import Dashboard from "./pages/dashboard/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard/*" element={
              <DashboardLayout>
                <Routes>
                  <Route path="request" element={<InventoryRequest />} />
                  <Route path="status" element={<RequestStatus />} />
                  <Route path="add-inventory" element={<AddInventory />} />
                  <Route path="inventory" element={<InventoryList />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="audit" element={<AuditLogs />} />
                  <Route path="forward" element={<ForwardRequests />} />
                  <Route path="overview" element={<Dashboard />} />
                  <Route path="" element={<Dashboard />} />
                </Routes>
              </DashboardLayout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
