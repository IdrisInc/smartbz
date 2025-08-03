import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/Auth/AuthProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { LoginForm } from "@/components/Auth/LoginForm";
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

  if (!user) {
    return <LoginForm />;
  }

  return (
    <OrganizationProvider>
      <BrowserRouter>
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
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </OrganizationProvider>
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
