import React, { ReactNode } from 'react';
import Sidebar from './sidebar';
import Header from './header';
import { useAppContext } from '@/lib/context/app-context';
import Softphone from '@/components/Softphone';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useAppContext();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Softphone component */}
      <Softphone />
    </div>
  );
};

export default MainLayout;
