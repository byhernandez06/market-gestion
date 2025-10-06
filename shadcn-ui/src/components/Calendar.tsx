import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent, Employee, Schedule, Vacation } from '@/types';

interface CalendarProps {
  employees: Employee[];
  schedules: Schedule[];
  vacations: Vacation[];
  onDateClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

interface DateClickArg {
  dateStr: string;
}

interface EventClickArg {
  event: {
    extendedProps: CalendarEvent;
  };
}

const Calendar: React.FC<CalendarProps> = ({ 
  employees, 
  schedules, 
  vacations, 
  onDateClick, 
  onEventClick 
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Convertir horarios a eventos de calendario
    schedules.forEach(schedule => {
      const employee = employees.find(emp => emp.id === schedule.employeeId);
      if (!employee) return;

      schedule.blocks.forEach(block => {
        const startDateTime = `${schedule.date}T${block.startTime}`;
        const endDateTime = `${schedule.date}T${block.endTime}`;

        calendarEvents.push({
          id: `schedule-${schedule.id}-${block.id}`,
          title: `${employee.name} (${block.type === 'regular' ? 'Trabajo' : 'Descanso'})`,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: block.type === 'regular' ? employee.color : '#E5E7EB',
          borderColor: employee.color,
          extendedProps: {
            type: 'schedule',
            employeeId: employee.id,
            employeeName: employee.name
          }
        });
      });
    });

    // Convertir vacaciones aprobadas a eventos de calendario
    vacations
      .filter(vacation => vacation.status === 'aprobada')
      .forEach(vacation => {
        const employee = employees.find(emp => emp.id === vacation.employeeId);
        if (!employee) return;

        calendarEvents.push({
          id: `vacation-${vacation.id}`,
          title: `${employee.name} - Vacaciones`,
          start: vacation.startDate,
          end: vacation.endDate,
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          extendedProps: {
            type: 'vacation',
            employeeId: employee.id,
            employeeName: employee.name
          }
        });
      });

    setEvents(calendarEvents);
  }, [employees, schedules, vacations]);

  const handleDateClick = (arg: DateClickArg) => {
    if (onDateClick) {
      onDateClick(arg.dateStr);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    if (onEventClick) {
      onEventClick(arg.event.extendedProps as CalendarEvent);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        locale="es"
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día'
        }}
        dayHeaderFormat={{ weekday: 'short' }}
        eventDisplay="block"
        displayEventTime={true}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
      />
    </div>
  );
};

export default Calendar;