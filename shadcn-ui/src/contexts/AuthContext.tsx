import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, Employee } from '@/types';
import { authService } from '@/services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  currentEmployee: Employee | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await authService.getUserById(firebaseUser.uid);
          
          if (userData) {
            setCurrentUser(userData);
            
            // If user is an employee, get their employee data
            if (userData.role === 'empleado' || userData.role === 'refuerzo') {
              const employeeData = await authService.getEmployeeByUserId(firebaseUser.uid);
              setCurrentEmployee(employeeData);
            } else {
              setCurrentEmployee(null);
            }
          } else {
            // Handle case where user document doesn't exist
            // This might be the admin user or a legacy user
            if (firebaseUser.email === 'admin@super.com') {
              setCurrentUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: 'Administrador',
                role: 'admin',
                createdAt: new Date().toISOString()
              });
              setCurrentEmployee(null);
            } else {
              // Unknown user, sign them out
              await signOut(auth);
              setCurrentUser(null);
              setCurrentEmployee(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
          setCurrentEmployee(null);
        }
      } else {
        setCurrentUser(null);
        setCurrentEmployee(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    currentEmployee,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};