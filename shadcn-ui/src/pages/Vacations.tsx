import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Check, X, Calendar, Plane } from 'lucide-react';
import { Employee, Vacation } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Vacations: React.FC = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    // Datos ficticios de empleados
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
      },
      {
        id: '4',
        name: 'Anais López',
        role: 'refuerzo',
        color: '#F59E0B',
        startDate: '2023-07-01',
        hourlyRate: 2000,
        status: 'activo',
        email: 'anais@minisuper.com'
      }
    ];

    // Vacaciones ficticias
    const mockVacations: Vacation[] = [
      {
        id: '1',
        employeeId: '3',
        startDate: '2024-12-15',
        endDate: '2024-12-20',
        days: 5,
        status: 'pendiente',
        requestDate: '2024-10-01',
        reason: 'Vacaciones familiares de fin de año'
      },
      {
        id: '2',
        employeeId: '4',
        startDate: '2024-11-10',
        endDate: '2024-11-12',
        days: 3,
        status: 'aprobada',
        requestDate: '2024-09-15',
        approvedBy: 'Byron Administrador',
        reason: 'Asuntos personales'
      },
      {
        id: '3',
        employeeId: '3',
        startDate: '2024-08-05',
        endDate: '2024-08-10',
        days: 5,
        status: 'aprobada',
        requestDate: '2024-07-01',
        approvedBy: 'Dayana Administradora',
        reason: 'Vacaciones de verano'
      }
    ];

    setEmployees(mockEmployees);
    setVacations(mockVacations);
  }, []);

  const calculateAvailableVacationDays = (employeeId: string): number => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return 0;

    const startDate = new Date(employee.startDate);
    const now = new Date();
    const weeksWorked = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalAvailable = Math.floor((weeksWorked / 50) * 14);
    
    const usedDays = vacations
      .filter(v => v.employeeId === employeeId && v.status === 'aprobada')
      .reduce((total, v) => total + v.days, 0);

    return Math.max(0, totalAvailable - usedDays);
  };

  const handleRequestVacation = () => {
    if (!requestData.startDate || !requestData.endDate) {
      alert('Por favor selecciona las fechas de vacaciones');
      return;
    }

    const startDate = new Date(requestData.startDate);
    const endDate = new Date(requestData.endDate);
    const days = differenceInDays(endDate, startDate) + 1;

    const currentEmployeeId = currentUser?.employeeId || '3'; // Default para demo
    const availableDays = calculateAvailableVacationDays(currentEmployeeId);

    if (days > availableDays) {
      alert(`No tienes suficientes días disponibles. Disponibles: ${availableDays}, Solicitados: ${days}`);
      return;
    }

    const newVacation: Vacation = {
      id: Date.now().toString(),
      employeeId: currentEmployeeId,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      days,
      status: 'pendiente',
      requestDate: new Date().toISOString().split('T')[0],
      reason: requestData.reason
    };

    setVacations([...vacations, newVacation]);
    setShowRequestForm(false);
    setRequestData({ startDate: '', endDate: '', reason: '' });
  };

  const handleApproveVacation = (vacationId: string) => {
    setVacations(vacations.map(vacation => 
      vacation.id === vacationId 
        ? { ...vacation, status: 'aprobada' as const, approvedBy: currentUser?.name }
        : vacation
    ));
  };

  const handleRejectVacation = (vacationId: string) => {
    setVacations(vacations.map(vacation => 
      vacation.id === vacationId 
        ? { ...vacation, status: 'rechazada' as const, approvedBy: currentUser?.name }
        : vacation
    ));
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Empleado no encontrado';
  };

  const getStatusBadge = (status: Vacation['status']) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'aprobada':
        return <Badge className="bg-green-600">Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="destructive">Rechazada</Badge>;
    }
  };

  const filteredVacations = currentUser?.role === 'admin' 
    ? vacations 
    : vacations.filter(v => v.employeeId === (currentUser?.employeeId || '3'));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentUser?.role === 'admin' ? 'Gestión de Vacaciones' : 'Mis Vacaciones'}
          </h1>
          <p className="text-gray-600">
            {currentUser?.role === 'admin' 
              ? 'Administra las solicitudes de vacaciones de todos los empleados'
              : 'Solicita y revisa el estado de tus vacaciones'
            }
          </p>
        </div>
        {currentUser?.role !== 'admin' && (
          <Button onClick={() => setShowRequestForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Solicitar Vacaciones</span>
          </Button>
        )}
      </div>

      {currentUser?.role !== 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Días Disponibles</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {calculateAvailableVacationDays(currentUser?.employeeId || '3')}
              </div>
              <p className="text-xs text-muted-foreground">días de vacaciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredVacations.filter(v => v.status === 'pendiente').length}
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
                {filteredVacations.filter(v => v.status === 'aprobada').length}
              </div>
              <p className="text-xs text-muted-foreground">este año</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {currentUser?.role === 'admin' ? 'Todas las Solicitudes' : 'Mis Solicitudes'}
            </CardTitle>
            <CardDescription>
              {currentUser?.role === 'admin' 
                ? 'Revisa y gestiona las solicitudes de vacaciones'
                : 'Historial de tus solicitudes de vacaciones'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredVacations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay solicitudes de vacaciones
                </p>
              ) : (
                filteredVacations.map((vacation) => (
                  <div key={vacation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{getEmployeeName(vacation.employeeId)}</h3>
                        <p className="text-sm text-gray-600">
                          {format(new Date(vacation.startDate), 'dd MMM yyyy', { locale: es })} - {' '}
                          {format(new Date(vacation.endDate), 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-600">{vacation.days} días</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(vacation.status)}
                        {currentUser?.role === 'admin' && vacation.status === 'pendiente' && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleApproveVacation(vacation.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectVacation(vacation.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {vacation.reason && (
                      <div className="mb-2">
                        <p className="text-sm"><strong>Motivo:</strong> {vacation.reason}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Solicitado el {format(new Date(vacation.requestDate), 'dd MMM yyyy', { locale: es })}
                      {vacation.approvedBy && (
                        <span> • Aprobado por {vacation.approvedBy}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de solicitud de vacaciones */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Vacaciones</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={requestData.startDate}
                  onChange={(e) => setRequestData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <Input
                  type="date"
                  value={requestData.endDate}
                  onChange={(e) => setRequestData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {requestData.startDate && requestData.endDate && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  <strong>Días solicitados:</strong> {' '}
                  {differenceInDays(new Date(requestData.endDate), new Date(requestData.startDate)) + 1}
                </p>
                <p className="text-sm">
                  <strong>Días disponibles:</strong> {' '}
                  {calculateAvailableVacationDays(currentUser?.employeeId || '3')}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo (Opcional)</Label>
              <Textarea
                placeholder="Describe el motivo de tu solicitud de vacaciones..."
                value={requestData.reason}
                onChange={(e) => setRequestData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleRequestVacation} className="flex-1">
                Enviar Solicitud
              </Button>
              <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vacations;