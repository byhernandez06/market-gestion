import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Trash2, Loader2 } from 'lucide-react';
import { Employee, Schedule, ScheduleBlock } from '@/types';
import Calendar from '@/components/Calendar';
import { employeesService, schedulesService } from '@/services/firebaseService';
import { toast } from 'sonner';

const SchedulePage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, schedulesData] = await Promise.all([
        employeesService.getAll(),
        schedulesService.getAll()
      ]);
      setEmployees(employeesData);
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowScheduleForm(true);
  };

  const addScheduleBlock = () => {
    const newBlock: ScheduleBlock = {
      id: Date.now().toString(),
      startTime: '08:00',
      endTime: '16:00',
      type: 'regular'
    };
    setScheduleBlocks([...scheduleBlocks, newBlock]);
  };

  const updateScheduleBlock = (blockId: string, field: keyof ScheduleBlock, value: string) => {
    setScheduleBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, [field]: value } : block
      )
    );
  };

  const removeScheduleBlock = (blockId: string) => {
    setScheduleBlocks(blocks => blocks.filter(block => block.id !== blockId));
  };

  const calculateTotalHours = (blocks: ScheduleBlock[]): number => {
    return blocks.reduce((total, block) => {
      if (block.type !== 'regular') return total;
      
      const start = new Date(`2000-01-01T${block.startTime}`);
      const end = new Date(`2000-01-01T${block.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      return total + hours;
    }, 0);
  };

  const handleSubmitSchedule = async () => {
    if (!selectedEmployee || !selectedDate || scheduleBlocks.length === 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const newSchedule: Omit<Schedule, 'id'> = {
        employeeId: selectedEmployee,
        date: selectedDate,
        blocks: scheduleBlocks,
        totalHours: calculateTotalHours(scheduleBlocks)
      };

      const id = await schedulesService.add(newSchedule);
      const scheduleWithId = { ...newSchedule, id };
      setSchedules([...schedules, scheduleWithId]);
      
      setShowScheduleForm(false);
      setSelectedEmployee('');
      setScheduleBlocks([]);
      toast.success('Horario guardado exitosamente');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Error al guardar horario');
    }
  };

  const closeScheduleForm = () => {
    setShowScheduleForm(false);
    setSelectedEmployee('');
    setScheduleBlocks([]);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando horarios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Horarios</h1>
          <p className="text-gray-600">Administra los horarios de trabajo de todos los empleados</p>
        </div>
        <Button onClick={() => setShowScheduleForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo Horario</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Calendar
            employees={employees}
            schedules={schedules}
            vacations={[]}
            onDateClick={handleDateClick}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empleados Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.filter(emp => emp.status === 'activo').map(employee => (
                  <div key={employee.id} className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: employee.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{employee.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{employee.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map(employee => {
                  const weeklyHours = schedules
                    .filter(s => s.employeeId === employee.id)
                    .reduce((total, s) => total + s.totalHours, 0);
                  
                  return (
                    <div key={employee.id} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: employee.color }}
                        />
                        <span className="text-sm">{employee.name.split(' ')[0]}</span>
                      </div>
                      <Badge variant="secondary">{weeklyHours}h</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formulario de horario */}
      <Dialog open={showScheduleForm} onOpenChange={closeScheduleForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Horario de Trabajo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empleado</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(emp => emp.status === 'activo').map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Bloques de Horario</Label>
                <Button type="button" variant="outline" size="sm" onClick={addScheduleBlock}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Bloque
                </Button>
              </div>

              {scheduleBlocks.map((block, index) => (
                <Card key={block.id} className="p-4">
                  <div className="grid grid-cols-4 gap-3 items-end">
                    <div className="space-y-2">
                      <Label>Hora Inicio</Label>
                      <Input
                        type="time"
                        value={block.startTime}
                        onChange={(e) => updateScheduleBlock(block.id, 'startTime', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Hora Fin</Label>
                      <Input
                        type="time"
                        value={block.endTime}
                        onChange={(e) => updateScheduleBlock(block.id, 'endTime', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select 
                        value={block.type} 
                        onValueChange={(value: 'regular' | 'break') => 
                          updateScheduleBlock(block.id, 'type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Trabajo</SelectItem>
                          <SelectItem value="break">Descanso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeScheduleBlock(block.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}

              {scheduleBlocks.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Total de Horas:</span>
                  </div>
                  <Badge variant="secondary">
                    {calculateTotalHours(scheduleBlocks).toFixed(1)} horas
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSubmitSchedule} className="flex-1">
                Guardar Horario
              </Button>
              <Button variant="outline" onClick={closeScheduleForm}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;