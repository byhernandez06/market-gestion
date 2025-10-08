import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, User, Plus, CalendarDays, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService, vacationsService } from '@/services/firebaseService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Vacation, Schedule, Employee } from '@/types';

interface EmployeeStats {
  employee: Employee;
  totalVacationDays: number;
  usedVacationDays: number;
  availableVacationDays: number;
  pendingVacations: number;
  weeklyHours: number;
  monthlyHours: number;
  monthlyExtraHours: number;
  monthlyExtraAmount: number;
  recentVacations: Vacation[];
  recentSchedules: Schedule[];
}

const EmployeeDashboard: React.FC = () => {
  const { currentEmployee } = useAuth();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [vacationForm, setVacationForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (currentEmployee) {
      loadEmployeeStats();
    }
  }, [currentEmployee]);

  const loadEmployeeStats = async () => {
    if (!currentEmployee) return;
    
    try {
      setLoading(true);
      const employeeStats = await dashboardService.getEmployeeStats(currentEmployee.id);
      setStats(employeeStats);
    } catch (error) {
      console.error('Error loading employee stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleVacationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    if (!vacationForm.startDate || !vacationForm.endDate) {
      toast.error('Por favor completa las fechas');
      return;
    }

    const startDate = new Date(vacationForm.startDate);
    const endDate = new Date(vacationForm.endDate);
    
    if (endDate < startDate) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    try {
      await vacationsService.add({
        employeeId: currentEmployee.id,
        startDate: vacationForm.startDate,
        endDate: vacationForm.endDate,
        days,
        status: 'pendiente',
        requestDate: new Date().toISOString().split('T')[0],
        reason: vacationForm.reason
      });

      toast.success('Solicitud de vacaciones enviada');
      setShowVacationForm(false);
      setVacationForm({ startDate: '', endDate: '', reason: '' });
      loadEmployeeStats(); // Reload stats
    } catch (error) {
      console.error('Error requesting vacation:', error);
      toast.error('Error al solicitar vacaciones');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando información...</span>
        </div>
      </div>
    );
  }

  if (!currentEmployee || !stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="text-gray-600">No se pudo cargar la información del empleado</p>
        </div>
      </div>
    );
  }

  const { employee, totalVacationDays, usedVacationDays, availableVacationDays, 
          weeklyHours, monthlyHours, monthlyExtraHours, monthlyExtraAmount, 
          recentVacations, recentSchedules } = stats;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: employee.color }}
        >
          <User className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">¡Hola, {employee.name}!</h1>
          <p className="text-gray-600 capitalize">
            {employee.role} • Ingreso: {new Date(employee.startDate).toLocaleDateString('es-CR')}
          </p>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Mi Información</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Rol</p>
              <p className="text-lg capitalize">{employee.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tarifa por Hora</p>
              <p className="text-lg font-semibold text-green-600">₡{employee.hourlyRate.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <Badge variant={employee.status === 'activo' ? 'default' : 'secondary'}>
                {employee.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-sm">{employee.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacaciones Disponibles</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableVacationDays}</div>
            <p className="text-xs text-muted-foreground">
              {usedVacationDays} de {totalVacationDays} días usados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyHours}</div>
            <p className="text-xs text-muted-foreground">
              Horas trabajadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {employee.role === 'refuerzo' ? 'Horas Este Mes' : 'Horas Extra Este Mes'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.role === 'refuerzo' ? monthlyHours : monthlyExtraHours}
            </div>
            <p className="text-xs text-muted-foreground">
              {employee.role === 'refuerzo' ? 'Total del mes' : 'Horas extra'}
            </p>
          </CardContent>
        </Card>

        {employee.role === 'empleado' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Extra</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₡{monthlyExtraAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Por horas extra
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vacation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Vacaciones</span>
              </CardTitle>
              <Button onClick={() => setShowVacationForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Solicitar
              </Button>
            </div>
            <CardDescription>
              Gestiona tus solicitudes de vacaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentVacations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay solicitudes de vacaciones</p>
            ) : (
              <div className="space-y-3">
                {recentVacations.map((vacation: Vacation) => (
                  <div key={vacation.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(vacation.startDate).toLocaleDateString('es-CR')} - {new Date(vacation.endDate).toLocaleDateString('es-CR')}
                      </p>
                      <p className="text-sm text-gray-600">{vacation.days} días</p>
                      {vacation.reason && <p className="text-xs text-gray-500">{vacation.reason}</p>}
                    </div>
                    <Badge variant={
                      vacation.status === 'aprobada' ? 'default' : 
                      vacation.status === 'rechazada' ? 'destructive' : 'secondary'
                    }>
                      {vacation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Horarios Recientes</span>
            </CardTitle>
            <CardDescription>
              Tus últimos registros de horario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSchedules.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay horarios registrados</p>
            ) : (
              <div className="space-y-3">
                {recentSchedules.slice(0, 5).map((schedule: Schedule) => (
                  <div key={schedule.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(schedule.date).toLocaleDateString('es-CR')}</p>
                      <p className="text-sm text-gray-600">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{schedule.hours}h</p>
                      <Badge variant={schedule.type === 'extra' ? 'secondary' : 'default'}>
                        {schedule.type === 'extra' ? 'Extra' : 'Regular'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vacation Request Modal */}
      <Dialog open={showVacationForm} onOpenChange={setShowVacationForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Vacaciones</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVacationRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={vacationForm.startDate}
                onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin *</Label>
              <Input
                id="endDate"
                type="date"
                value={vacationForm.endDate}
                onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={vacationForm.reason}
                onChange={(e) => setVacationForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Describe el motivo de tus vacaciones..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1">
                Enviar Solicitud
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowVacationForm(false);
                  setVacationForm({ startDate: '', endDate: '', reason: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDashboard;