import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { PlaceholderPage } from "./components/shared/PlaceholderPage";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Profile } from "./pages/Profile";
import { Users } from "./pages/Users";
import { MasterDataPage } from "./pages/MasterDataPage";
import { Inventory } from "./pages/Inventory";
import { Transfers } from "./pages/Transfers";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="optistock-theme">
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Phase 2+ Placeholders */}
            <Route path="warehouses" element={<MasterDataPage resource="warehouses" />} />
            <Route path="products" element={<MasterDataPage resource="products" />} />
            <Route path="categories" element={<MasterDataPage resource="categories" />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="reservations" element={<PlaceholderPage title="Reservations" description="Manage temporary stock reservations for orders." />} />
            <Route path="reconciliation" element={<PlaceholderPage title="Reconciliation" description="Perform physical counts and reconcile inventory." />} />
            <Route path="suppliers" element={<MasterDataPage resource="suppliers" />} />
            <Route path="purchase-orders" element={<PlaceholderPage title="Purchase Orders" description="Create and manage inbound purchase orders." />} />
            <Route path="returns" element={<PlaceholderPage title="Returns" description="Process outbound and inbound returns." />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" description="Generate system and inventory reports." />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics" description="Advanced inventory forecasting and analytics." />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and notifications." />} />
            <Route path="audit-logs" element={<PlaceholderPage title="Audit Logs" description="Review system history and transaction logs." />} />
            <Route path="settings" element={<Profile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<Users />} />
          </Route>
          </Route>
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
