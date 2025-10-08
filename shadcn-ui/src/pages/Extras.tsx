import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, DollarSign, Edit, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee, Extra } from '@/types';
import { 
  getEmployees, 
  getExtras, 
  createExtra, 
  updateExtra, 
  deleteExtra,
  getEmployeeExtras 
} from '@/services/firebaseService';
import { toast } from 'sonner';

export default function Extras() {
  const { user } = useAuth();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);

  // Extra form state
  const [extraForm, setExtraForm] = useState({
    employeeId: '',
    date: '',
    hours: '',
    description: '',
    hourlyRate: ''
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
      
      // Load extras based on role
      let extrasData: Extra[];
      if (user.role === 'admin') {
        extrasData = await getExtras();
      } else {
        extrasData = await getEmployeeExtras(user.id);
      }
      
      setExtras(extrasData);
    } catch (error) {
      console.error('Error loading extras data:', error);
      toast.error('Error cargando datos de horas extra');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const selectedEmployee = employees.find(emp => emp.id === extraForm.employeeId);
      if (!selectedEmployee) {
        toast.error('Empleado no encontrado');
        return;
      }

      const hours = parseFloat(extraForm.hours);
      const hourlyRate = parseFloat(extraForm.hourlyRate);
      const total = hours * hourlyRate;

      const extraData: Omit<Extra, 'id'> = {
        employeeId: extraForm.employeeId,
        employeeName: selectedEmployee.name,
        date: new Date(extraForm.date),
        hours: hours,
        description: extraForm.description,
        hourlyRate: hourlyRate,
        total: total,
        approved: user.role === 'admin' // Auto-approve if admin creates it
      };

      if (editingExtra) {
        await updateExtra(editingExtra.id, extraData);
        toast.success('Horas extra actualizadas correctamente');
      } else {
        await createExtra(extraData);
        toast.success('Horas extra registradas correctamente');
      }
      
      // Reset form and reload data
      setExtraForm({
        employeeId: '',
        date: '',
        hours: '',
        description: '',
        hourlyRate: ''
      });
      setEditingExtra(null);
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving extra hours:', error);
      toast.error('Error al guardar horas extra');
    }
  };

  const handleEdit = (extra: Extra) => {
    setEditingExtra(extra);
    setExtraForm({
      employeeId: extra.employeeId,
      date: extra.date.toISOString().split('T')[0],
      hours: extra.hours.toString(),
      description: extra.description || '',
      hourlyRate: extra.hourlyRate.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (extraId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      try {
        await deleteExtra(extraId);
        toast.success('Registro eliminado correctamente');
        loadData();
      } catch (error) {
        console.error('Error deleting extra:', error);
        toast.error('Error al eliminar registro');
      }
    }
  };

  const handleApprove = async (extraId: string) => {
    try {
      await updateExtra(extraId, { approved: true });
      toast.success('Horas extra aprobadas');
      loadData();
    } catch (error) {
      console.error('Error approving extra:', error);
      toast.error('Error al aprobar horas extra');
    }
  };

  const handleReject = async (extraId: string) => {
    try {
      await updateExtra(extraId, { approved: false });
      toast.success('Horas extra rechazadas');
      loadData();
    } catch (error) {
      console.error('Error rejecting extra:', error);
      toast.error('Error al rechazar horas extra');
    }
  };

  const totalHours = extras.reduce((sum, extra) => sum + extra.hours, 0);
  const totalAmount = extras.filter(extra => extra.approved).reduce((sum, extra) => sum + extra.total, 0);
  const pendingExtras = extras.filter(extra => !extra.approved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando horas extra...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {user?.role === 'admin' ? 'Gestión de Horas Extra' : 'Mis Horas Extra'}
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingExtra(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Horas Extra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExtra ? 'Editar Horas Extra' : 'Registrar Horas Extra'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleExtraSubmit} className="space-y-4">
              {user?.role === 'admin' && (
                <div>
                  <Label htmlFor="employeeId">Empleado</Label>
                  <Select
                    value={extraForm.employeeId}
                    onValueChange={(value) => {
                      const employee = employees.find(emp => emp.id === value);
                      setExtraForm(prev => ({ 
                        ...prev, 
                        employeeId: value,
                        hourlyRate: employee?.salary ? (employee.salary / 160).toString() : ''
                      }));
                    }}
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
              )}

              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={extraForm.date}
                  onChange={(e) => setExtraForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="hours">Horas Trabajadas</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={extraForm.hours}
                  onChange={(e) => setExtraForm(prev => ({ ...prev, hours: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="hourlyRate">Tarifa por Hora</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={extraForm.hourlyRate}
                  onChange={(e) => setExtraForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={extraForm.description}
                  onChange={(e) => setExtraForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe las actividades realizadas..."
                  required
                />
              </div>

              {extraForm.hours && extraForm.hourlyRate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium">
                    Total a pagar: ${(parseFloat(extraForm.hours) * parseFloat(extraForm.hourlyRate)).toLocaleString()}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full">
                {editingExtra ? 'Actualizar' : 'Registrar'} Horas Extra
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">horas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Aprobado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">total aprobado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExtras}</div>
            <p className="text-xs text-muted-foreground">por aprobar</p>
          </CardContent>
        </Card>
      </div>

      {/* Extras Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === 'admin' ? 'Todas las Horas Extra' : 'Mis Horas Extra'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role === 'admin' && <TableHead>Empleado</TableHead>}
                <TableHead>Fecha</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                {user?.role === 'admin' && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {extras.map((extra) => (
                <TableRow key={extra.id}>
                  {user?.role === 'admin' && (
                    <TableCell className="font-medium">{extra.employeeName}</TableCell>
                  )}
                  <TableCell>{extra.date.toLocaleDateString()}</TableCell>
                  <TableCell>{extra.hours}h</TableCell>
                  <TableCell>${extra.hourlyRate.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">${extra.total.toLocaleString()}</TableCell>
                  <TableCell>{extra.description}</TableCell>
                  <TableCell>
                    <Badge variant={extra.approved ? "default" : "secondary"}>
                      {extra.approved ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <div className="flex space-x-2">
                        {!extra.approved && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(extra.id)}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(extra.id)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(extra)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(extra.id)}
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