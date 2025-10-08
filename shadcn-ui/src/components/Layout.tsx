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
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    // Employee users see their personal dashboard
    if (currentUser.role === 'empleado' || currentUser.role === 'refuerzo') {
      return <EmployeeDashboard />;
    }

    // Admin users see full system based on active tab
    switch (activeTab) {
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
      {/* Only show sidebar for admin users */}
      {currentUser.role === 'admin' && (
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      
      <main className={`flex-1 overflow-y-auto ${currentUser.role === 'admin' ? '' : 'w-full'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default Layout;