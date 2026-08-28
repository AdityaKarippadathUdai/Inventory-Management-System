import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { PlaceholderPage } from "./components/shared/PlaceholderPage";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="optistock-theme">
      <BrowserRouter>
        <Routes>
          {/* Auth routes can be added outside MainLayout later */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Phase 2+ Placeholders */}
            <Route path="warehouses" element={<PlaceholderPage title="Warehouses" description="Manage warehouse locations, zones, and bins." />} />
            <Route path="products" element={<PlaceholderPage title="Products" description="Manage product catalog, categories, and variants." />} />
            <Route path="inventory" element={<PlaceholderPage title="Inventory" description="View and adjust stock levels across all locations." />} />
            <Route path="transfers" element={<PlaceholderPage title="Transfers" description="Manage stock transfers between warehouses." />} />
            <Route path="reservations" element={<PlaceholderPage title="Reservations" description="Manage temporary stock reservations for orders." />} />
            <Route path="reconciliation" element={<PlaceholderPage title="Reconciliation" description="Perform physical counts and reconcile inventory." />} />
            <Route path="suppliers" element={<PlaceholderPage title="Suppliers" description="Manage supplier database and contacts." />} />
            <Route path="purchase-orders" element={<PlaceholderPage title="Purchase Orders" description="Create and manage inbound purchase orders." />} />
            <Route path="returns" element={<PlaceholderPage title="Returns" description="Process outbound and inbound returns." />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" description="Generate system and inventory reports." />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics" description="Advanced inventory forecasting and analytics." />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" description="View system alerts and notifications." />} />
            <Route path="audit-logs" element={<PlaceholderPage title="Audit Logs" description="Review system history and transaction logs." />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" description="System configuration and user management." />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
