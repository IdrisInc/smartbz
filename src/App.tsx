import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/Auth/AuthProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Settings from "@/pages/Settings";
import Contacts from "@/pages/Contacts";
import Sales from "@/pages/Sales";
import Inventory from "@/pages/Inventory";
import Finance from "@/pages/Finance";
import Employees from "@/pages/Employees";
import Reports from "@/pages/Reports";
import Branches from "@/pages/Branches";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        {user ? (
          <Route path="*" element={
            <OrganizationProvider>
              <Routes>
                <Route path="/" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="finance" element={<Finance />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="branches" element={<Branches />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OrganizationProvider>
          } />
        ) : (
          <Route path="*" element={<Auth />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
