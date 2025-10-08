import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Calendar, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee, Schedule } from '@/types';
import { 
  getEmployees, 
  getSchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule,
  getEmployeeSchedules 
} from '@/services/firebaseService';
import { toast } from 'sonner';

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    isRecurring: false,
    dayOfWeek: 0,
    notes: ''
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
      
      // Load schedules based on role
      let schedulesData: Schedule[];
      if (user.role === 'admin') {
        schedulesData = await getSchedules();
      } else {
        schedulesData = await getEmployeeSchedules(user.id);
      }
      
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error('Error cargando datos de horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const selectedEmployee = employees.find(emp => emp.id === scheduleForm.employeeId);
      if (!selectedEmployee) {
        toast.error('Empleado no encontrado');
        return;
      }

      const scheduleData: Omit<Schedule, 'id'> = {
        employeeId: scheduleForm.employeeId,
        employeeName: selectedEmployee.name,
        date: new Date(scheduleForm.date),
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        isRecurring: scheduleForm.isRecurring,
        dayOfWeek: scheduleForm.isRecurring ? scheduleForm.dayOfWeek : undefined,
        notes: scheduleForm.notes || undefined
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduleData);
        toast.success('Horario actualizado correctamente');
      } else {
        await createSchedule(scheduleData);
        toast.success('Horario creado correctamente');
      }
      
      // Reset form and reload data
      setScheduleForm({
        employeeId: '',
        date: '',
        startTime: '',
        endTime: '',
        isRecurring: false,
        dayOfWeek: 0,
        notes: ''
      });
      setEditingSchedule(null);
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Error al guardar horario');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      employeeId: schedule.employeeId,
      date: schedule.date.toISOString().split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isRecurring: schedule.isRecurring,
      dayOfWeek: schedule.dayOfWeek || 0,
      notes: schedule.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este horario?')) {
      try {
        await deleteSchedule(scheduleId);
        toast.success('Horario eliminado correctamente');
        loadData();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        toast.error('Error al eliminar horario');
      }
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando horarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {user?.role === 'admin' ? 'Gestión de Horarios' : 'Mi Horario'}
        </h1>
        {user?.role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSchedule(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Horario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employeeId">Empleado</Label>
                  <Select
                    value={scheduleForm.employeeId}
                    onValueChange={(value) => setScheduleForm(prev => ({ ...prev, employeeId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Hora de Inicio</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Hora de Fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={scheduleForm.isRecurring}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  />
                  <Label htmlFor="isRecurring">Horario recurrente</Label>
                </div>

                {scheduleForm.isRecurring && (
                  <div>
                    <Label htmlFor="dayOfWeek">Día de la semana</Label>
                    <Select
                      value={scheduleForm.dayOfWeek.toString()}
                      onValueChange={(value) => setScheduleForm(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {getDayName(day)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Input
                    id="notes"
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingSchedule ? 'Actualizar' : 'Crear'} Horario
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horarios</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(schedule => {
                const scheduleDate = new Date(schedule.date);
                const now = new Date();
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horarios Recurrentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(schedule => schedule.isRecurring).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === 'admin' ? 'Todos los Horarios' : 'Mi Horario'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role === 'admin' && <TableHead>Empleado</TableHead>}
                <TableHead>Fecha</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Notas</TableHead>
                {user?.role === 'admin' && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  {user?.role === 'admin' && (
                    <TableCell className="font-medium">{schedule.employeeName}</TableCell>
                  )}
                  <TableCell>
                    {schedule.isRecurring 
                      ? `Cada ${getDayName(schedule.dayOfWeek || 0)}`
                      : schedule.date.toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell>
                    {schedule.startTime} - {schedule.endTime}
                  </TableCell>
                  <TableCell>
                    <Badge variant={schedule.isRecurring ? "default" : "secondary"}>
                      {schedule.isRecurring ? 'Recurrente' : 'Único'}
                    </Badge>
                  </TableCell>
                  <TableCell>{schedule.notes || '-'}</TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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