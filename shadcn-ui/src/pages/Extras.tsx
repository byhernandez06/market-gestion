import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Clock, DollarSign, Calendar } from 'lucide-react';
import { Employee, Extra } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Extras: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraData, setExtraData] = useState({
    employeeId: '',
    date: '',
    hours: '',
    description: ''
  });

  useEffect(() => {
    // Datos ficticios de empleados (solo empleados fijos)
    const mockEmployees: Employee[] = [
      {
        id: '1',
        name: 'Byron Administrador',
        role: 'empleado',
        color: '#3B82F6',
        startDate: '2022-01-01',
        hourlyRate: 3000,
        status: 'activo',
        email: 'byron@minisuper.com'
      },
      {
        id: '2',
        name: 'Dayana Administradora',
        role: 'empleado',
        color: '#EF4444',
        startDate: '2022-01-01',
        hourlyRate: 3000,
        status: 'activo',
        email: 'dayana@minisuper.com'
      },
      {
        id: '3',
        name: 'Deylin Rodríguez',
        role: 'empleado',
        color: '#10B981',
        startDate: '2023-01-15',
        hourlyRate: 2500,
        status: 'activo',
        email: 'deylin@minisuper.com'
      }
    ];

    // Horas extra ficticias
    const mockExtras: Extra[] = [
      {
        id: '1',
        employeeId: '3',
        date: '2024-10-01',
        hours: 3,
        amount: 7500,
        description: 'Inventario mensual'
      },
      {
        id: '2',
        employeeId: '3',
        date: '2024-10-03',
        hours: 2,
        amount: 5000,
        description: 'Atención de emergencia'
      },
      {
        id: '3',
        employeeId: '1',
        date: '2024-10-02',
        hours: 4,
        amount: 12000,
        description: 'Cierre de mes'
      },
      {
        id: '4',
        employeeId: '2',
        date: '2024-09-28',
        hours: 2,
        amount: 6000,
        description: 'Capacitación de personal'
      }
    ];

    setEmployees(mockEmployees);
    setExtras(mockExtras);
  }, []);

  const handleAddExtra = () => {
    if (!extraData.employeeId || !extraData.date || !extraData.hours) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const employee = employees.find(emp => emp.id === extraData.employeeId);
    if (!employee) return;

    const hours = parseFloat(extraData.hours);
    const amount = hours * employee.hourlyRate;

    const newExtra: Extra = {
      id: Date.now().toString(),
      employeeId: extraData.employeeId,
      date: extraData.date,
      hours,
      amount,
      description: extraData.description
    };

    setExtras([...extras, newExtra]);
    setShowExtraForm(false);
    setExtraData({ employeeId: '', date: '', hours: '', description: '' });
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Empleado no encontrado';
  };

  const getEmployeeColor = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.color || '#6B7280';
  };

  const calculateMonthlyTotals = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return employees.map(employee => {
      const monthlyExtras = extras.filter(extra => {
        const extraDate = new Date(extra.date);
        return extra.employeeId === employee.id &&
               extraDate.getMonth() === currentMonth &&
               extraDate.getFullYear() === currentYear;
      });

      const totalHours = monthlyExtras.reduce((sum, extra) => sum + extra.hours, 0);
      const totalAmount = monthlyExtras.reduce((sum, extra) => sum + extra.amount, 0);

      return {
        employee,
        totalHours,
        totalAmount,
        extraCount: monthlyExtras.length
      };
    });
  };

  const monthlyTotals = calculateMonthlyTotals();
  const currentMonthExtras = extras.filter(extra => {
    const extraDate = new Date(extra.date);
    const now = new Date();
    return extraDate.getMonth() === now.getMonth() && extraDate.getFullYear() === now.getFullYear();
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Horas Extra</h1>
          <p className="text-gray-600">Registra y administra las horas extra de empleados fijos</p>
        </div>
        <Button onClick={() => setShowExtraForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Registrar Horas Extra</span>
        </Button>
      </div>

      {/* Resumen mensual */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horas (Mes)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthExtras.reduce((sum, extra) => sum + extra.hours, 0)}
            </div>
            <p className="text-xs text-muted-foreground">horas extra registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monto (Mes)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₡{currentMonthExtras.reduce((sum, extra) => sum + extra.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">en horas extra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyTotals.filter(total => total.totalHours > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">con horas extra este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Empleado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.length > 0 
                ? (currentMonthExtras.reduce((sum, extra) => sum + extra.hours, 0) / employees.length).toFixed(1)
                : '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">horas por empleado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen por empleado */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Mensual por Empleado</CardTitle>
              <CardDescription>Horas extra del mes actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTotals.map(({ employee, totalHours, totalAmount }) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: employee.color }}
                      />
                      <div>
                        <p className="font-medium text-sm">{employee.name}</p>
                        <p className="text-xs text-gray-600">₡{employee.hourlyRate.toLocaleString()}/hora</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{totalHours}h</p>
                      <p className="text-sm text-green-600">₡{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial de horas extra */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Horas Extra</CardTitle>
              <CardDescription>Registro detallado de todas las horas extra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {extras.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay horas extra registradas
                  </p>
                ) : (
                  extras
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((extra) => (
                      <div key={extra.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getEmployeeColor(extra.employeeId) }}
                            />
                            <div>
                              <p className="font-medium">{getEmployeeName(extra.employeeId)}</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(extra.date), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              {extra.hours} horas
                            </Badge>
                            <p className="text-lg font-semibold text-green-600">
                              ₡{extra.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {extra.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Descripción:</strong> {extra.description}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formulario de horas extra */}
      <Dialog open={showExtraForm} onOpenChange={setShowExtraForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Horas Extra</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select value={extraData.employeeId} onValueChange={(value) => 
                setExtraData(prev => ({ ...prev, employeeId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(emp => emp.status === 'activo').map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} (₡{employee.hourlyRate.toLocaleString()}/hora)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={extraData.date}
                  onChange={(e) => setExtraData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Horas Extra</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="Ej: 2.5"
                  value={extraData.hours}
                  onChange={(e) => setExtraData(prev => ({ ...prev, hours: e.target.value }))}
                />
              </div>
            </div>

            {extraData.employeeId && extraData.hours && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm">
                  <strong>Monto a pagar:</strong> ₡{' '}
                  {(parseFloat(extraData.hours || '0') * 
                    (employees.find(emp => emp.id === extraData.employeeId)?.hourlyRate || 0)
                  ).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Textarea
                placeholder="Describe el motivo de las horas extra..."
                value={extraData.description}
                onChange={(e) => setExtraData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleAddExtra} className="flex-1">
                Registrar Horas Extra
              </Button>
              <Button variant="outline" onClick={() => setShowExtraForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Extras;