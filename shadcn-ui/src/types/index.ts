export interface User {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  name: string;
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  hireDate: Date;
  createdAt: Date;
}

export interface Schedule {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc.
  notes?: string;
}

export interface WeeklySchedule {
  employeeId: string;
  employeeName: string;
  schedules: {
    [key: string]: { // day of week (0-6)
      startTime: string;
      endTime: string;
      isWorkDay: boolean;
    }
  };
}

export interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  totalDays?: number;
  totalHours?: number;
  isHourlyRequest: boolean;
  startTime?: string; // for hourly requests
  endTime?: string; // for hourly requests
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  reviewedBy?: string;
  reviewDate?: Date;
  comments?: string;
}

export interface Extra {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  hours: number;
  description: string;
  hourlyRate: number;
  total: number;
  approved: boolean;
}