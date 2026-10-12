import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';
import InspectionsPage from './pages/InspectionsPage';
import RepairsPage from './pages/RepairsPage';
import QualityControlPage from './pages/QualityControlPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected routes — wrapped in ProtectedRoute for auth check */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/repairs" element={<RepairsPage />} />
        <Route path="/quality-control" element={<QualityControlPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
