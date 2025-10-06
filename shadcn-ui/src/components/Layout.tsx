import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Schedule from '@/pages/Schedule';
import Vacations from '@/pages/Vacations';
import Extras from '@/pages/Extras';

const Layout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { currentUser } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return currentUser?.role === 'admin' ? <Employees /> : <Dashboard />;
      case 'schedule':
        return currentUser?.role === 'admin' ? <Schedule /> : <Dashboard />;
      case 'vacations':
        return <Vacations />;
      case 'extras':
        return currentUser?.role === 'admin' ? <Extras /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default Layout;