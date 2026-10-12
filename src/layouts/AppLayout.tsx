import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import PageContainer from '../components/layout/PageContainer';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/items': 'Items',
  '/inspections': 'Inspections',
  '/repairs': 'Repairs',
  '/quality-control': 'Quality Control',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? 'ReClaim';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}
