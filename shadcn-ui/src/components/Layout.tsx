import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from './Login';
import Sidebar from './Sidebar';
import Dashboard from '@/pages/Dashboard';
import EmployeeDashboard from '@/pages/EmployeeDashboard';
import Employees from '@/pages/Employees';
import Schedule from '@/pages/Schedule';
import Vacations from '@/pages/Vacations';
import Extras from '@/pages/Extras';
import { useState } from 'react';

const Layout: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    // Employee users can navigate between their allowed pages
    if (currentUser.role === 'empleado' || currentUser.role === 'refuerzo') {
      switch (currentPage) {
        case 'dashboard':
          return <EmployeeDashboard />;
        case 'vacations':
          return <Vacations />;
        default:
          return <EmployeeDashboard />;
      }
    }

    // Admin users see full system based on current page
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <Employees />;
      case 'schedule':
        return <Schedule />;
      case 'vacations':
        return <Vacations />;
      case 'extras':
        return <Extras />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Show sidebar for all users */}
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Layout;