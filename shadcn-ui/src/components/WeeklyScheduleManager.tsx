import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Save } from 'lucide-react';
import { getWeeklySchedule, updateWeeklySchedule } from '@/services/firebaseService';
import { WeeklySchedule } from '@/types';
import { toast } from 'sonner';

interface WeeklyScheduleManagerProps {
  employeeId: string;
  employeeName: string;
}

const DAYS_OF_WEEK = [
  { key: '1', name: 'Lunes' },
  { key: '2', name: 'Martes' },
  { key: '3', name: 'Miércoles' },
  { key: '4', name: 'Jueves' },
  { key: '5', name: 'Viernes' },
  { key: '6', name: 'Sábado' },
  { key: '0', name: 'Domingo' }
];

export default function WeeklyScheduleManager({ employeeId, employeeName }: WeeklyScheduleManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [schedule, setSchedule] = useState<WeeklySchedule['schedules']>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSchedule();
    }
  }, [isOpen, employeeId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const weeklySchedule = await getWeeklySchedule(employeeId);
      
      if (weeklySchedule) {
        setSchedule(weeklySchedule.schedules);
      } else {
        // Initialize with default schedule
        const defaultSchedule: WeeklySchedule['schedules'] = {};
        DAYS_OF_WEEK.forEach(day => {
          defaultSchedule[day.key] = {
            startTime: '09:00',
            endTime: '17:00',
            isWorkDay: day.key !== '0' // Sunday is off by default
          };
        });
        setSchedule(defaultSchedule);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Error cargando horario');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (dayKey: string, field: string, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateWeeklySchedule(employeeId, schedule);
      toast.success('Horario guardado correctamente');
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Error guardando horario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Gestionar Horario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Horario Semanal - {employeeName}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Cargando...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Configure el horario base del empleado. Este horario puede ser modificado para días específicos según las necesidades.
            </div>
            
            <div className="space-y-4">
              {DAYS_OF_WEEK.map(day => (
                <Card key={day.key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-20">
                          <Label className="font-medium">{day.name}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={schedule[day.key]?.isWorkDay || false}
                            onCheckedChange={(checked) => handleScheduleChange(day.key, 'isWorkDay', checked)}
                          />
                          <Label className="text-sm">Día laboral</Label>
                        </div>
                      </div>
                      
                      {schedule[day.key]?.isWorkDay && (
                        <div className="flex items-center space-x-2">
                          <div>
                            <Label className="text-xs">Entrada</Label>
                            <Input
                              type="time"
                              value={schedule[day.key]?.startTime || '09:00'}
                              onChange={(e) => handleScheduleChange(day.key, 'startTime', e.target.value)}
                              className="w-24"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Salida</Label>
                            <Input
                              type="time"
                              value={schedule[day.key]?.endTime || '17:00'}
                              onChange={(e) => handleScheduleChange(day.key, 'endTime', e.target.value)}
                              className="w-24"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Horario
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}