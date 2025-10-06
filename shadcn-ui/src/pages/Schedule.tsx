import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { Employee, Schedule, ScheduleBlock } from '@/types';
import Calendar from '@/components/Calendar';

const Schedule: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);

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

    // Horarios ficticios
    const mockSchedules: Schedule[] = [
      {
        id: '1',
        employeeId: '3',
        date: '2024-10-07',
        blocks: [
          {
            id: '1',
            startTime: '07:00',
            endTime: '15:00',
            type: 'regular'
          }
        ],
        totalHours: 8
      },
      {
        id: '2',
        employeeId: '4',
        date: '2024-10-07',
        blocks: [
          {
            id: '2',
            startTime: '15:00',
            endTime: '21:00',
            type: 'regular'
          }
        ],
        totalHours: 6
      },
      {
        id: '3',
        employeeId: '3',
        date: '2024-10-08',
        blocks: [
          {
            id: '3',
            startTime: '08:00',
            endTime: '12:00',
            type: 'regular'
          },
          {
            id: '4',
            startTime: '17:00',
            endTime: '21:00',
            type: 'regular'
          }
        ],
        totalHours: 8
      }
    ];

    setEmployees(mockEmployees);
    setSchedules(mockSchedules);
  }, []);

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

  const handleSubmitSchedule = () => {
    if (!selectedEmployee || !selectedDate || scheduleBlocks.length === 0) {
      alert('Por favor completa todos los campos');
      return;
    }

    const newSchedule: Schedule = {
      id: Date.now().toString(),
      employeeId: selectedEmployee,
      date: selectedDate,
      blocks: scheduleBlocks,
      totalHours: calculateTotalHours(scheduleBlocks)
    };

    setSchedules([...schedules, newSchedule]);
    setShowScheduleForm(false);
    setSelectedEmployee('');
    setScheduleBlocks([]);
  };

  const closeScheduleForm = () => {
    setShowScheduleForm(false);
    setSelectedEmployee('');
    setScheduleBlocks([]);
  };

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

export default Schedule;