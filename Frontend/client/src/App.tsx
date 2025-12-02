import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadClaim from "./pages/UploadClaim";
import Claims from "./pages/Claims";
import ClaimDetail from "./pages/ClaimDetail";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import SystemAnalytics from "./pages/admin/SystemAnalytics";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/upload"} component={UploadClaim} />
      <Route path={"/claims"} component={Claims} />
      <Route path={"/claims/:id"} component={ClaimDetail} />
      <Route path={"/analytics"} component={Analytics} />
      {/* Admin routes */}
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={UserManagement} />
      <Route path={"/admin/claims"} component={Claims} />
      <Route path={"/admin/analytics"} component={SystemAnalytics} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
