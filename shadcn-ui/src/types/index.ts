export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'empleado' | 'refuerzo';
  employeeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'empleado' | 'refuerzo';
  color: string;
  startDate: string;
  hourlyRate: number;
  status: 'activo' | 'inactivo';
  email: string;
  userId?: string;
}

export interface Schedule {
  id: string;
  employeeId: string;
  date: string;
  blocks: ScheduleBlock[];
  totalHours: number;
}

export interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  type: 'regular' | 'break';
}

export interface Vacation {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  requestDate: string;
  approvedBy?: string;
  reason?: string;
}

export interface Extra {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  amount: number;
  description?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: 'schedule' | 'vacation';
    employeeId: string;
    employeeName: string;
  };
}