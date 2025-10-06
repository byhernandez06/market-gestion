import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plane, Users } from 'lucide-react';
import { Employee, Vacation, Extra } from '@/types';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [vacationDays, setVacationDays] = useState(0);
  const [monthlyExtras, setMonthlyExtras] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState(0);

  useEffect(() => {
    // Simular datos del empleado actual
    if (currentUser?.role !== 'admin') {
      const mockEmployee: Employee = {
        id: currentUser?.employeeId || '1',
        name: currentUser?.name || 'Usuario',
        role: currentUser?.role as 'empleado' | 'refuerzo',
        color: '#3B82F6',
        startDate: currentUser?.role === 'empleado' ? '2023-01-15' : '2023-07-01',
        hourlyRate: currentUser?.role === 'empleado' ? 2500 : 2000,
        status: 'activo',
        email: currentUser?.email || ''
      };
      setEmployee(mockEmployee);

      // Calcular días de vacaciones disponibles
      const startDate = new Date(mockEmployee.startDate);
      const now = new Date();
      const weeksWorked = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const availableDays = Math.floor((weeksWorked / 50) * 14);
      setVacationDays(availableDays);

      // Datos simulados
      setMonthlyExtras(currentUser?.role === 'empleado' ? 8 : 0);
      setWeeklyHours(currentUser?.role === 'refuerzo' ? 35 : 40);
    }
  }, [currentUser]);

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
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">2 empleados, 2 refuerzos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacaciones Pendientes</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Solicitudes por aprobar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Extra (Mes)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">₡60,000 total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horarios Activos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Empleados programados</p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Deylin Rodríguez</p>
                    <p className="text-sm text-gray-600">Empleado • ₡2,500/hora</p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Anais López</p>
                    <p className="text-sm text-gray-600">Refuerzo • ₡2,000/hora</p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Solicitud de vacaciones</p>
                  <p className="text-gray-600">Deylin solicitó vacaciones del 15-20 dic</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Horas extra registradas</p>
                  <p className="text-gray-600">Anais trabajó 3 horas extra ayer</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Horario actualizado</p>
                  <p className="text-gray-600">Cambio en turno de mañana</p>
                </div>
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
                <span className="font-semibold">{vacationDays} disponibles</span>
              </div>

              {employee.role === 'empleado' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Horas Extra (Mes)</span>
                  </div>
                  <span className="font-semibold">{monthlyExtras} horas</span>
                </div>
              )}

              {employee.role === 'refuerzo' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span>Horas Semanales</span>
                  </div>
                  <span className="font-semibold">{weeklyHours} horas</span>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span>Ingresos Estimados (Mes)</span>
                  <span className="text-lg font-bold text-green-600">
                    ₡{((weeklyHours * 4 + monthlyExtras) * employee.hourlyRate).toLocaleString()}
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