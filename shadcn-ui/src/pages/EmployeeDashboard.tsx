import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Plus, User, CalendarDays, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getEmployeeVacations, 
  getEmployeeExtras, 
  createVacation, 
  getEmployeeById,
  calculateAvailableVacationDays 
} from '@/services/firebaseService';
import { Vacation, Extra, Employee } from '@/types';
import { toast } from 'sonner';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableVacationDays, setAvailableVacationDays] = useState(0);
  const [isVacationDialogOpen, setIsVacationDialogOpen] = useState(false);

  // Vacation form state
  const [vacationForm, setVacationForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    isHourlyRequest: false,
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadEmployeeData();
    }
  }, [user]);

  const loadEmployeeData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Load employee info
      const employeeData = await getEmployeeById(user.id);
      if (employeeData) {
        setEmployee(employeeData);
        // Calculate available vacation days based on hire date
        const availableDays = calculateAvailableVacationDays(employeeData.hireDate);
        setAvailableVacationDays(availableDays);
      }
      
      // Load vacations and extras
      const [vacationsData, extrasData] = await Promise.all([
        getEmployeeVacations(user.id),
        getEmployeeExtras(user.id)
      ]);
      
      setVacations(vacationsData);
      setExtras(extrasData);
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast.error('Error cargando datos del empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !employee) return;

    try {
      let totalDays = 0;
      let totalHours = 0;

      if (vacationForm.isHourlyRequest) {
        // Calculate hours between start and end time
        const start = new Date(`2000-01-01T${vacationForm.startTime}`);
        const end = new Date(`2000-01-01T${vacationForm.endTime}`);
        totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      } else {
        // Calculate days between start and end date
        const start = new Date(vacationForm.startDate);
        const end = new Date(vacationForm.endDate);
        totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

      const vacationData: Omit<Vacation, 'id'> = {
        employeeId: user.id,
        employeeName: employee.name,
        startDate: new Date(vacationForm.startDate),
        endDate: new Date(vacationForm.endDate),
        totalDays: vacationForm.isHourlyRequest ? 0 : totalDays,
        totalHours: vacationForm.isHourlyRequest ? totalHours : 0,
        isHourlyRequest: vacationForm.isHourlyRequest,
        startTime: vacationForm.isHourlyRequest ? vacationForm.startTime : undefined,
        endTime: vacationForm.isHourlyRequest ? vacationForm.endTime : undefined,
        reason: vacationForm.reason,
        status: 'pending',
        requestDate: new Date()
      };

      await createVacation(vacationData);
      toast.success('Solicitud de vacaciones enviada correctamente');
      
      // Reset form and reload data
      setVacationForm({
        startDate: '',
        endDate: '',
        reason: '',
        isHourlyRequest: false,
        startTime: '',
        endTime: ''
      });
      setIsVacationDialogOpen(false);
      loadEmployeeData();
    } catch (error) {
      console.error('Error creating vacation request:', error);
      toast.error('Error al enviar solicitud de vacaciones');
    }
  };

  const pendingVacations = vacations.filter(v => v.status === 'pending');
  const approvedVacations = vacations.filter(v => v.status === 'approved');
  const usedVacationDays = approvedVacations.reduce((total, vacation) => {
    return total + (vacation.totalDays || 0);
  }, 0);
  const usedVacationHours = approvedVacations.reduce((total, vacation) => {
    return total + (vacation.totalHours || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mi Dashboard</h1>
        <Dialog open={isVacationDialogOpen} onOpenChange={setIsVacationDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Vacaciones
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Vacaciones</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleVacationSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHourlyRequest"
                  checked={vacationForm.isHourlyRequest}
                  onChange={(e) => setVacationForm(prev => ({ ...prev, isHourlyRequest: e.target.checked }))}
                />
                <Label htmlFor="isHourlyRequest">Solicitar por horas (en un día específico)</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    {vacationForm.isHourlyRequest ? 'Fecha' : 'Fecha de Inicio'}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={vacationForm.startDate}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                {!vacationForm.isHourlyRequest && (
                  <div>
                    <Label htmlFor="endDate">Fecha de Fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={vacationForm.endDate}
                      onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                )}
              </div>

              {vacationForm.isHourlyRequest && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Hora de Inicio</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={vacationForm.startTime}
                      onChange={(e) => setVacationForm(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Hora de Fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={vacationForm.endTime}
                      onChange={(e) => setVacationForm(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="reason">Motivo</Label>
                <Textarea
                  id="reason"
                  value={vacationForm.reason}
                  onChange={(e) => setVacationForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Describe el motivo de tu solicitud..."
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Enviar Solicitud
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacaciones Disponibles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableVacationDays - usedVacationDays}</div>
            <p className="text-xs text-muted-foreground">
              de {availableVacationDays} días totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVacations.length}</div>
            <p className="text-xs text-muted-foreground">
              esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Extra</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extras.length}</div>
            <p className="text-xs text-muted-foreground">
              registros este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo en la Empresa</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee ? Math.floor((new Date().getTime() - employee.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              meses trabajados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Vacation Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Solicitudes de Vacaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {vacations.length === 0 ? (
            <p className="text-muted-foreground">No tienes solicitudes de vacaciones.</p>
          ) : (
            <div className="space-y-4">
              {vacations.slice(0, 5).map((vacation) => (
                <div key={vacation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {vacation.isHourlyRequest 
                        ? `${vacation.startDate.toLocaleDateString()} (${vacation.startTime} - ${vacation.endTime})`
                        : `${vacation.startDate.toLocaleDateString()} - ${vacation.endDate.toLocaleDateString()}`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vacation.isHourlyRequest 
                        ? `${vacation.totalHours} horas`
                        : `${vacation.totalDays} días`
                      } • {vacation.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vacation.status === 'approved' ? 'bg-green-100 text-green-800' :
                      vacation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vacation.status === 'approved' ? 'Aprobada' :
                       vacation.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}