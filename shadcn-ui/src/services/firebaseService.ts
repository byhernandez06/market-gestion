import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Employee, Schedule, Vacation, Extra, WeeklySchedule } from '../types';

// Employee Services
export const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'> & { password: string }) => {
  try {
    // Create user account in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, employeeData.email, employeeData.password);
    const userId = userCredential.user.uid;

    // Create employee document in Firestore
    const { password, ...employeeWithoutPassword } = employeeData;
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employeeWithoutPassword,
      id: userId,
      createdAt: Timestamp.now()
    });

    // Create user document in Firestore
    await addDoc(collection(db, 'users'), {
      id: userId,
      email: employeeData.email,
      role: 'employee',
      name: employeeData.name,
      createdAt: Timestamp.now()
    });

    return { id: docRef.id, ...employeeWithoutPassword, createdAt: new Date() };
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      hireDate: doc.data().hireDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Employee[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
  try {
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, employeeData);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'employees', id));
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    const q = query(collection(db, 'employees'), where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      hireDate: doc.data().hireDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    } as Employee;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
};

// Calculate available vacation days based on work time
export const calculateAvailableVacationDays = (hireDate: Date): number => {
  const now = new Date();
  const monthsWorked = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
  
  // 15 days per year, proportional to months worked
  const daysPerMonth = 15 / 12;
  const availableDays = Math.floor(monthsWorked * daysPerMonth);
  
  // Cap at 15 days maximum
  return Math.min(availableDays, 15);
};

// Schedule Services
export const createSchedule = async (scheduleData: Omit<Schedule, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'schedules'), {
      ...scheduleData,
      date: Timestamp.fromDate(scheduleData.date)
    });
    return { id: docRef.id, ...scheduleData };
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

export const getSchedules = async (): Promise<Schedule[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'schedules'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date()
    })) as Schedule[];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

export const getEmployeeSchedules = async (employeeId: string): Promise<Schedule[]> => {
  try {
    const q = query(
      collection(db, 'schedules'), 
      where('employeeId', '==', employeeId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date()
    })) as Schedule[];
  } catch (error) {
    console.error('Error fetching employee schedules:', error);
    throw error;
  }
};

export const updateSchedule = async (id: string, scheduleData: Partial<Schedule>) => {
  try {
    const scheduleRef = doc(db, 'schedules', id);
    const updateData = { ...scheduleData };
    if (scheduleData.date) {
      updateData.date = Timestamp.fromDate(scheduleData.date);
    }
    await updateDoc(scheduleRef, updateData);
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

export const deleteSchedule = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'schedules', id));
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
};

// Weekly Schedule Services
export const saveWeeklySchedule = async (weeklySchedule: WeeklySchedule) => {
  try {
    const docRef = await addDoc(collection(db, 'weeklySchedules'), weeklySchedule);
    return { id: docRef.id, ...weeklySchedule };
  } catch (error) {
    console.error('Error saving weekly schedule:', error);
    throw error;
  }
};

export const getWeeklySchedule = async (employeeId: string): Promise<WeeklySchedule | null> => {
  try {
    const q = query(collection(db, 'weeklySchedules'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WeeklySchedule;
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    throw error;
  }
};

export const updateWeeklySchedule = async (employeeId: string, schedules: WeeklySchedule['schedules']) => {
  try {
    const q = query(collection(db, 'weeklySchedules'), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { schedules });
    } else {
      // Create new weekly schedule if it doesn't exist
      const employee = await getEmployeeById(employeeId);
      if (employee) {
        await saveWeeklySchedule({
          employeeId,
          employeeName: employee.name,
          schedules
        });
      }
    }
  } catch (error) {
    console.error('Error updating weekly schedule:', error);
    throw error;
  }
};

// Vacation Services
export const createVacation = async (vacationData: Omit<Vacation, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'vacations'), {
      ...vacationData,
      startDate: Timestamp.fromDate(vacationData.startDate),
      endDate: Timestamp.fromDate(vacationData.endDate),
      requestDate: Timestamp.fromDate(vacationData.requestDate)
    });
    return { id: docRef.id, ...vacationData };
  } catch (error) {
    console.error('Error creating vacation:', error);
    throw error;
  }
};

export const getVacations = async (): Promise<Vacation[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'vacations'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      requestDate: doc.data().requestDate?.toDate() || new Date(),
      reviewDate: doc.data().reviewDate?.toDate()
    })) as Vacation[];
  } catch (error) {
    console.error('Error fetching vacations:', error);
    throw error;
  }
};

export const getEmployeeVacations = async (employeeId: string): Promise<Vacation[]> => {
  try {
    const q = query(
      collection(db, 'vacations'), 
      where('employeeId', '==', employeeId),
      orderBy('requestDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      requestDate: doc.data().requestDate?.toDate() || new Date(),
      reviewDate: doc.data().reviewDate?.toDate()
    })) as Vacation[];
  } catch (error) {
    console.error('Error fetching employee vacations:', error);
    throw error;
  }
};

export const updateVacation = async (id: string, vacationData: Partial<Vacation>) => {
  try {
    const vacationRef = doc(db, 'vacations', id);
    const updateData = { ...vacationData };
    if (vacationData.startDate) {
      updateData.startDate = Timestamp.fromDate(vacationData.startDate);
    }
    if (vacationData.endDate) {
      updateData.endDate = Timestamp.fromDate(vacationData.endDate);
    }
    if (vacationData.requestDate) {
      updateData.requestDate = Timestamp.fromDate(vacationData.requestDate);
    }
    if (vacationData.reviewDate) {
      updateData.reviewDate = Timestamp.fromDate(vacationData.reviewDate);
    }
    await updateDoc(vacationRef, updateData);
  } catch (error) {
    console.error('Error updating vacation:', error);
    throw error;
  }
};

export const deleteVacation = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'vacations', id));
  } catch (error) {
    console.error('Error deleting vacation:', error);
    throw error;
  }
};

// Extra Hours Services
export const createExtra = async (extraData: Omit<Extra, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'extras'), {
      ...extraData,
      date: Timestamp.fromDate(extraData.date)
    });
    return { id: docRef.id, ...extraData };
  } catch (error) {
    console.error('Error creating extra:', error);
    throw error;
  }
};

export const getExtras = async (): Promise<Extra[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'extras'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date()
    })) as Extra[];
  } catch (error) {
    console.error('Error fetching extras:', error);
    throw error;
  }
};

export const getEmployeeExtras = async (employeeId: string): Promise<Extra[]> => {
  try {
    const q = query(
      collection(db, 'extras'), 
      where('employeeId', '==', employeeId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date()
    })) as Extra[];
  } catch (error) {
    console.error('Error fetching employee extras:', error);
    throw error;
  }
};

export const updateExtra = async (id: string, extraData: Partial<Extra>) => {
  try {
    const extraRef = doc(db, 'extras', id);
    const updateData = { ...extraData };
    if (extraData.date) {
      updateData.date = Timestamp.fromDate(extraData.date);
    }
    await updateDoc(extraRef, updateData);
  } catch (error) {
    console.error('Error updating extra:', error);
    throw error;
  }
};

export const deleteExtra = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'extras', id));
  } catch (error) {
    console.error('Error deleting extra:', error);
    throw error;
  }
};