
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="contacts" element={<div className="p-6"><h2 className="text-2xl font-bold">Customers & Suppliers</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="sales" element={<div className="p-6"><h2 className="text-2xl font-bold">Sales & Orders</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="inventory" element={<div className="p-6"><h2 className="text-2xl font-bold">Purchases & Inventory</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="finance" element={<div className="p-6"><h2 className="text-2xl font-bold">Finance & Accounting</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="employees" element={<div className="p-6"><h2 className="text-2xl font-bold">Employee Management</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="reports" element={<div className="p-6"><h2 className="text-2xl font-bold">Reports & Analytics</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
