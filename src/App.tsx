import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
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
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/repairs" element={<RepairsPage />} />
        <Route path="/quality-control" element={<QualityControlPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
