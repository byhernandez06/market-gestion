import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase.js';
import { Employee, Schedule, Vacation, Extra, User } from '@/types';

// Auth Service
export const authService = {
  // Create employee user account
  async createEmployeeAccount(email: string, password: string, employeeData: Omit<Employee, 'id'>): Promise<{ uid: string; employeeId: string }> {
    const auth = getAuth();
    
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Create user document in Firestore
      const userData: User = {
        id: uid,
        email: email,
        role: 'empleado',
        name: employeeData.name,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', uid), userData);
      
      // Create employee document with reference to user
      const employeeDocData = {
        ...employeeData,
        userId: uid,
        createdAt: Timestamp.now()
      };
      
      const employeeRef = await addDoc(collection(db, 'employees'), employeeDocData);
      
      return { uid, employeeId: employeeRef.id };
    } catch (error) {
      console.error('Error creating employee account:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUserById(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Get employee by user ID
  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    try {
      const q = query(collection(db, 'employees'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Employee;
      }
      return null;
    } catch (error) {
      console.error('Error getting employee by user ID:', error);
      return null;
    }
  }
};

// Employees Service
export const employeesService = {
  // Get all employees
  async getAll(): Promise<Employee[]> {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Employee));
  },

  // Add new employee with authentication
  async addWithAuth(employee: Omit<Employee, 'id'>, password: string): Promise<{ employeeId: string; uid: string }> {
    return await authService.createEmployeeAccount(employee.email, password, employee);
  },

  // Add new employee (legacy method)
  async add(employee: Omit<Employee, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employee,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update employee
  async update(id: string, employee: Partial<Employee>): Promise<void> {
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, {
      ...employee,
      updatedAt: Timestamp.now()
    });
  },

  // Delete employee
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'employees', id));
  },

  // Listen to employees changes
  onSnapshot(callback: (employees: Employee[]) => void) {
    return onSnapshot(collection(db, 'employees'), (snapshot) => {
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));
      callback(employees);
    });
  }
};

// Schedules Service
export const schedulesService = {
  // Get all schedules
  async getAll(): Promise<Schedule[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'schedules'), orderBy('date', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Schedule));
  },

  // Get schedules by employee
  async getByEmployee(employeeId: string): Promise<Schedule[]> {
    const q = query(
      collection(db, 'schedules'),
      where('employeeId', '==', employeeId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Schedule));
  },

  // Get schedules by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    const q = query(
      collection(db, 'schedules'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Schedule));
  },

  // Get schedules by employee and date range
  async getByEmployeeAndDateRange(employeeId: string, startDate: string, endDate: string): Promise<Schedule[]> {
    const q = query(
      collection(db, 'schedules'),
      where('employeeId', '==', employeeId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Schedule));
  },

  // Add new schedule
  async add(schedule: Omit<Schedule, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'schedules'), {
      ...schedule,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update schedule
  async update(id: string, schedule: Partial<Schedule>): Promise<void> {
    const scheduleRef = doc(db, 'schedules', id);
    await updateDoc(scheduleRef, {
      ...schedule,
      updatedAt: Timestamp.now()
    });
  },

  // Delete schedule
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'schedules', id));
  },

  // Listen to schedules changes
  onSnapshot(callback: (schedules: Schedule[]) => void) {
    return onSnapshot(
      query(collection(db, 'schedules'), orderBy('date', 'desc')),
      (snapshot) => {
        const schedules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Schedule));
        callback(schedules);
      }
    );
  }
};

// Vacations Service
export const vacationsService = {
  // Get all vacations
  async getAll(): Promise<Vacation[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'vacations'), orderBy('startDate', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vacation));
  },

  // Get vacations by employee
  async getByEmployee(employeeId: string): Promise<Vacation[]> {
    const q = query(
      collection(db, 'vacations'),
      where('employeeId', '==', employeeId),
      orderBy('startDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vacation));
  },

  // Add new vacation
  async add(vacation: Omit<Vacation, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'vacations'), {
      ...vacation,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update vacation
  async update(id: string, vacation: Partial<Vacation>): Promise<void> {
    const vacationRef = doc(db, 'vacations', id);
    await updateDoc(vacationRef, {
      ...vacation,
      updatedAt: Timestamp.now()
    });
  },

  // Delete vacation
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'vacations', id));
  },

  // Listen to vacations changes
  onSnapshot(callback: (vacations: Vacation[]) => void) {
    return onSnapshot(
      query(collection(db, 'vacations'), orderBy('startDate', 'desc')),
      (snapshot) => {
        const vacations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Vacation));
        callback(vacations);
      }
    );
  }
};

// Extras Service
export const extrasService = {
  // Get all extras
  async getAll(): Promise<Extra[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'extras'), orderBy('date', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Extra));
  },

  // Get extras by employee
  async getByEmployee(employeeId: string): Promise<Extra[]> {
    const q = query(
      collection(db, 'extras'),
      where('employeeId', '==', employeeId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Extra));
  },

  // Get extras by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Extra[]> {
    const q = query(
      collection(db, 'extras'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Extra));
  },

  // Get extras by employee and date range
  async getByEmployeeAndDateRange(employeeId: string, startDate: string, endDate: string): Promise<Extra[]> {
    const q = query(
      collection(db, 'extras'),
      where('employeeId', '==', employeeId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Extra));
  },

  // Add new extra
  async add(extra: Omit<Extra, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'extras'), {
      ...extra,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update extra
  async update(id: string, extra: Partial<Extra>): Promise<void> {
    const extraRef = doc(db, 'extras', id);
    await updateDoc(extraRef, {
      ...extra,
      updatedAt: Timestamp.now()
    });
  },

  // Delete extra
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'extras', id));
  },

  // Listen to extras changes
  onSnapshot(callback: (extras: Extra[]) => void) {
    return onSnapshot(
      query(collection(db, 'extras'), orderBy('date', 'desc')),
      (snapshot) => {
        const extras = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Extra));
        callback(extras);
      }
    );
  }
};

// Dashboard Service
export const dashboardService = {
  // Get dashboard stats
  async getStats() {
    const [employees, schedules, vacations, extras] = await Promise.all([
      employeesService.getAll(),
      schedulesService.getAll(),
      vacationsService.getAll(),
      extrasService.getAll()
    ]);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter current month data
    const currentMonthExtras = extras.filter(extra => {
      const extraDate = new Date(extra.date);
      return extraDate.getMonth() === currentMonth && extraDate.getFullYear() === currentYear;
    });

    const pendingVacations = vacations.filter(vacation => vacation.status === 'pendiente');

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.status === 'activo').length,
      pendingVacations: pendingVacations.length,
      monthlyExtraHours: currentMonthExtras.reduce((sum, extra) => sum + extra.hours, 0),
      monthlyExtraAmount: currentMonthExtras.reduce((sum, extra) => sum + extra.amount, 0),
      employees,
      recentActivity: [
        ...pendingVacations.slice(0, 3).map(vacation => ({
          type: 'vacation',
          message: `Solicitud de vacaciones pendiente`,
          employee: employees.find(emp => emp.id === vacation.employeeId)?.name || 'Empleado',
          date: vacation.startDate
        })),
        ...currentMonthExtras.slice(0, 2).map(extra => ({
          type: 'extra',
          message: `Horas extra registradas: ${extra.hours}h`,
          employee: employees.find(emp => emp.id === extra.employeeId)?.name || 'Empleado',
          date: extra.date
        }))
      ].slice(0, 5)
    };
  },

  // Get employee dashboard stats
  async getEmployeeStats(employeeId: string) {
    const [employee, schedules, vacations, extras] = await Promise.all([
      employeesService.getAll().then(emps => emps.find(emp => emp.id === employeeId)),
      schedulesService.getByEmployee(employeeId),
      vacationsService.getByEmployee(employeeId),
      extrasService.getByEmployee(employeeId)
    ]);

    if (!employee) {
      throw new Error('Employee not found');
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get current week (Monday to Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Filter current month and week data
    const currentMonthSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.getMonth() === currentMonth && scheduleDate.getFullYear() === currentYear;
    });

    const currentWeekSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
    });

    const currentMonthExtras = extras.filter(extra => {
      const extraDate = new Date(extra.date);
      return extraDate.getMonth() === currentMonth && extraDate.getFullYear() === currentYear;
    });

    const approvedVacations = vacations.filter(vacation => vacation.status === 'aprobada');
    const pendingVacations = vacations.filter(vacation => vacation.status === 'pendiente');

    // Calculate available vacation days (assuming 15 days per year)
    const startDate = new Date(employee.startDate);
    const yearsWorked = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const totalVacationDays = Math.max(yearsWorked * 15, 15); // Minimum 15 days
    const usedVacationDays = approvedVacations.reduce((sum, vacation) => {
      const start = new Date(vacation.startDate);
      const end = new Date(vacation.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);

    return {
      employee,
      totalVacationDays,
      usedVacationDays,
      availableVacationDays: totalVacationDays - usedVacationDays,
      pendingVacations: pendingVacations.length,
      weeklyHours: currentWeekSchedules.reduce((sum, schedule) => sum + schedule.hours, 0),
      monthlyHours: currentMonthSchedules.reduce((sum, schedule) => sum + schedule.hours, 0),
      monthlyExtraHours: currentMonthExtras.reduce((sum, extra) => sum + extra.hours, 0),
      monthlyExtraAmount: currentMonthExtras.reduce((sum, extra) => sum + extra.amount, 0),
      recentVacations: vacations.slice(0, 5),
      recentSchedules: schedules.slice(0, 10)
    };
  }
};