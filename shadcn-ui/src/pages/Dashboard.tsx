import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Plane, Users, Loader2 } from 'lucide-react';
import { Employee, Vacation, Extra } from '@/types';
import { getEmployees, getVacations, getExtras } from '@/services/firebaseService';
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
    date: Date;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      const [employees, vacations, extras] = await Promise.all([
        getEmployees(),
        getVacations(),
        getExtras()
      ]);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Filter current month data
      const currentMonthExtras = extras.filter(extra => {
        const extraDate = new Date(extra.date);
        return extraDate.getMonth() === currentMonth && extraDate.getFullYear() === currentYear;
      });

      const pendingVacations = vacations.filter(vacation => vacation.status === 'pending');

      const dashboardStats: DashboardStats = {
        totalEmployees: employees.length,
        activeEmployees: employees.length, // Assuming all are active for now
        pendingVacations: pendingVacations.length,
        monthlyExtraHours: currentMonthExtras.reduce((sum, extra) => sum + extra.hours, 0),
        monthlyExtraAmount: currentMonthExtras.reduce((sum, extra) => sum + extra.total, 0),
        employees,
        recentActivity: [
          ...pendingVacations.slice(0, 3).map(vacation => ({
            type: 'vacation',
            message: `Solicitud de vacaciones pendiente`,
            employee: vacation.employeeName,
            date: vacation.requestDate
          })),
          ...currentMonthExtras.slice(0, 2).map(extra => ({
            type: 'extra',
            message: `Horas extra registradas: ${extra.hours}h`,
            employee: extra.employeeName,
            date: extra.date
          }))
        ].slice(0, 5)
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Error cargando estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="text-gray-600">No se pudo cargar la información del dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={loadDashboardStats} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEmployees} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacaciones Pendientes</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVacations}</div>
            <p className="text-xs text-muted-foreground">
              solicitudes por revisar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Extra del Mes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyExtraHours}</div>
            <p className="text-xs text-muted-foreground">
              horas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Extra del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyExtraAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              en horas extra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay actividad reciente
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'vacation' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.employee} • {activity.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empleados Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.employees.slice(0, 5).map((employee) => (
                <div key={employee.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <Badge variant="secondary">
                    {employee.department}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}