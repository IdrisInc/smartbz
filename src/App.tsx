import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { OnboardingGuard } from "@/components/Organization/OnboardingGuard";

// Pages
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Contacts from "./pages/Contacts";
import Employees from "./pages/Employees";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Branches from "./pages/Branches";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Trunker from "./pages/Trunker";
import CashRegisters from "./pages/CashRegisters";
import ExpenseCategories from "./pages/ExpenseCategories";
import PaymentHistory from "./pages/PaymentHistory";
import PendingApprovals from "./pages/PendingApprovals";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Super Admin Pages
import SuperAdminOwners from "./pages/SuperAdminOwners";
import SuperAdminBusinesses from "./pages/SuperAdminBusinesses";
import SuperAdminBranches from "./pages/SuperAdminBranches";
import SuperAdminStaff from "./pages/SuperAdminStaff";
import SuperAdminSubscriptions from "./pages/SuperAdminSubscriptions";
import SuperAdminReports from "./pages/SuperAdminReports";
import SuperAdminPayments from "./pages/SuperAdminPayments";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <OnboardingProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/welcome" element={<LandingPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  
                  {/* Onboarding - requires auth but not org */}
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } />
                  
                  {/* Dashboard routes - requires auth and org */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <OnboardingGuard>
                        <DashboardLayout />
                      </OnboardingGuard>
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="pending-approvals" element={<PendingApprovals />} />
                    <Route path="products" element={<Products />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="finance" element={<Finance />} />
                    <Route path="expense-categories" element={<ExpenseCategories />} />
                    <Route path="cash-registers" element={<CashRegisters />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="branches" element={<Branches />} />
                    <Route path="payment-history" element={<PaymentHistory />} />
                    <Route path="trunker" element={<Trunker />} />
                    
                    {/* Super Admin Routes */}
                    <Route path="super-admin/owners" element={<SuperAdminOwners />} />
                    <Route path="super-admin/businesses" element={<SuperAdminBusinesses />} />
                    <Route path="super-admin/branches" element={<SuperAdminBranches />} />
                    <Route path="super-admin/staff" element={<SuperAdminStaff />} />
                    <Route path="super-admin/subscriptions" element={<SuperAdminSubscriptions />} />
                    <Route path="super-admin/reports" element={<SuperAdminReports />} />
                    <Route path="super-admin/payments" element={<SuperAdminPayments />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </OnboardingProvider>
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
