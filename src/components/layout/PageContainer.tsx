import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </div>
    </main>
  );
}
