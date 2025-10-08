import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Check, X, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getVacations, 
  getEmployeeVacations, 
  createVacation, 
  updateVacation,
  getEmployees,
  calculateAvailableVacationDays 
} from '@/services/firebaseService';
import { Vacation, Employee } from '@/types';
import { toast } from 'sonner';

export default function Vacations() {
  const { user } = useAuth();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableVacationDays, setAvailableVacationDays] = useState(0);

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
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load employees (for admin) or current employee data
      const employeesData = await getEmployees();
      setEmployees(employeesData);
      
      // Load vacations based on role
      let vacationsData: Vacation[];
      if (user.role === 'admin') {
        vacationsData = await getVacations();
      } else {
        vacationsData = await getEmployeeVacations(user.id);
        
        // Calculate available vacation days for employee
        const currentEmployee = employeesData.find(emp => emp.id === user.id);
        if (currentEmployee) {
          const availableDays = calculateAvailableVacationDays(currentEmployee.hireDate);
          setAvailableVacationDays(availableDays);
        }
      }
      
      setVacations(vacationsData);
    } catch (error) {
      console.error('Error loading vacations data:', error);
      toast.error('Error cargando datos de vacaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let totalDays = 0;
      let totalHours = 0;
      const currentEmployee = employees.find(emp => emp.id === user.id);

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
        employeeName: currentEmployee?.name || user.name,
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
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating vacation request:', error);
      toast.error('Error al enviar solicitud de vacaciones');
    }
  };

  const handleApprove = async (vacationId: string) => {
    try {
      await updateVacation(vacationId, {
        status: 'approved',
        reviewedBy: user?.name,
        reviewDate: new Date()
      });
      toast.success('Solicitud aprobada');
      loadData();
    } catch (error) {
      console.error('Error approving vacation:', error);
      toast.error('Error al aprobar solicitud');
    }
  };

  const handleReject = async (vacationId: string) => {
    try {
      await updateVacation(vacationId, {
        status: 'rejected',
        reviewedBy: user?.name,
        reviewDate: new Date()
      });
      toast.success('Solicitud rechazada');
      loadData();
    } catch (error) {
      console.error('Error rejecting vacation:', error);
      toast.error('Error al rechazar solicitud');
    }
  };

  const getStatusBadge = (status: Vacation['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-600">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const pendingVacations = vacations.filter(v => v.status === 'pending');
  const approvedVacations = vacations.filter(v => v.status === 'approved');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando vacaciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {user?.role === 'admin' ? 'Gestión de Vacaciones' : 'Mis Vacaciones'}
        </h1>
        {user?.role !== 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
        )}
      </div>

      {/* Stats Cards for Employee */}
      {user?.role !== 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Días Disponibles</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {availableVacationDays - approvedVacations.reduce((total, v) => total + (v.totalDays || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">de {availableVacationDays} días totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingVacations.length}
              </div>
              <p className="text-xs text-muted-foreground">esperando aprobación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacaciones Aprobadas</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {approvedVacations.length}
              </div>
              <p className="text-xs text-muted-foreground">este año</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vacations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === 'admin' ? 'Todas las Solicitudes' : 'Mis Solicitudes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role === 'admin' && <TableHead>Empleado</TableHead>}
                <TableHead>Fechas</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Solicitud</TableHead>
                {user?.role === 'admin' && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacations.map((vacation) => (
                <TableRow key={vacation.id}>
                  {user?.role === 'admin' && (
                    <TableCell className="font-medium">{vacation.employeeName}</TableCell>
                  )}
                  <TableCell>
                    {vacation.isHourlyRequest 
                      ? `${vacation.startDate.toLocaleDateString()} (${vacation.startTime} - ${vacation.endTime})`
                      : `${vacation.startDate.toLocaleDateString()} - ${vacation.endDate.toLocaleDateString()}`
                    }
                  </TableCell>
                  <TableCell>
                    {vacation.isHourlyRequest 
                      ? `${vacation.totalHours} horas`
                      : `${vacation.totalDays} días`
                    }
                  </TableCell>
                  <TableCell>{vacation.reason}</TableCell>
                  <TableCell>{getStatusBadge(vacation.status)}</TableCell>
                  <TableCell>{vacation.requestDate.toLocaleDateString()}</TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      {vacation.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(vacation.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(vacation.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}