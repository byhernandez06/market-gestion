import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plane, Users, Loader2 } from 'lucide-react';
import { Employee, Vacation, Extra } from '@/types';
import { dashboardService } from '@/services/firebaseService';
import { toast } from 'sonner';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingVacations: number;
  monthlyExtraHours: number;
  monthlyExtraAmount: number;
  employees: Employee[];
  recentActivity: Array<{
    type: string;
    message: string;
    employee: string;
    date: string;
  }>;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await dashboardService.getStats();
      setStats(dashboardStats);

      // Si no es admin, buscar datos del empleado actual
      if (currentUser?.role !== 'admin' && currentUser?.email) {
        const currentEmployee = dashboardStats.employees.find(
          emp => emp.email === currentUser.email
        );
        setEmployee(currentEmployee || null);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkedTime = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} ${months % 12} mes${months % 12 !== 1 ? 'es' : ''}`;
    }
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  };

  const calculateVacationDays = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const weeksWorked = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return Math.floor((weeksWorked / 50) * 14);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  if (currentUser?.role === 'admin') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Bienvenido, {currentUser.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeEmployees || 0} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacaciones Pendientes</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingVacations || 0}</div>
              <p className="text-xs text-muted-foreground">Solicitudes por aprobar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Extra (Mes)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.monthlyExtraHours || 0}</div>
              <p className="text-xs text-muted-foreground">
                ₡{stats?.monthlyExtraAmount?.toLocaleString() || '0'} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">Empleados trabajando</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Empleados Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.employees?.filter(emp => emp.status === 'activo').map(employee => (
                  <div key={employee.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: employee.color }}
                      />
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {employee.role} • ₡{employee.hourlyRate.toLocaleString()}/hora
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Activo</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentActivity?.length ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-gray-600">
                        {activity.employee} - {new Date(activity.date).toLocaleDateString('es-CR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mi Información</h1>
        <p className="text-gray-600">Bienvenido, {currentUser?.name}</p>
      </div>

      {employee && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre Completo</p>
                <p className="text-lg">{employee.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Rol</p>
                <Badge variant="secondary" className="capitalize">{employee.role}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha de Ingreso</p>
                <p>{new Date(employee.startDate).toLocaleDateString('es-CR')}</p>
                <p className="text-xs text-gray-500">{calculateWorkedTime(employee.startDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tarifa por Hora</p>
                <p className="text-lg font-semibold">₡{employee.hourlyRate.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <span>Días de Vacaciones</span>
                </div>
                <span className="font-semibold">
                  {calculateVacationDays(employee.startDate)} disponibles
                </span>
              </div>

              {employee.role === 'empleado' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Horas Extra (Mes)</span>
                  </div>
                  <span className="font-semibold">0 horas</span>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span>Salario Base Estimado</span>
                  <span className="text-lg font-bold text-green-600">
                    ₡{(160 * employee.hourlyRate).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Gestiona tus solicitudes y revisa tu información
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button className="flex items-center space-x-2">
              <Plane className="h-4 w-4" />
              <span>Solicitar Vacaciones</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Ver Mi Horario</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;