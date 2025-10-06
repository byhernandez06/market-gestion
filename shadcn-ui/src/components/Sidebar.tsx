import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  Plane, 
  Clock, 
  Settings, 
  Home,
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { currentUser, logout } = useAuth();

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'vacations', label: 'Vacaciones', icon: Plane },
    { id: 'extras', label: 'Horas Extra', icon: Clock },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const employeeMenuItems = [
    { id: 'dashboard', label: 'Mi Información', icon: Home },
    { id: 'vacations', label: 'Mis Vacaciones', icon: Plane },
  ];

  const menuItems = currentUser?.role === 'admin' ? adminMenuItems : employeeMenuItems;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Minisúper</h1>
        <p className="text-sm text-gray-600">Gestión de Empleados</p>
      </div>
      
      <div className="flex-1 p-4">
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  currentPage === item.id && 'bg-blue-600 text-white hover:bg-blue-700'
                )}
                onClick={() => onPageChange(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;