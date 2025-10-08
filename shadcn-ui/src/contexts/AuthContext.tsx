import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, Employee } from '@/types';
import { getEmployeeById } from '@/services/firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // First, check if user exists in users collection
          const usersQuery = query(
            collection(db, 'users'), 
            where('id', '==', firebaseUser.uid)
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          if (!usersSnapshot.empty) {
            // User found in users collection
            const userData = usersSnapshot.docs[0].data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: userData.role,
              name: userData.name,
              createdAt: userData.createdAt?.toDate() || new Date()
            });
            
            // If it's an employee, also load employee data
            if (userData.role === 'employee') {
              const employeeData = await getEmployeeById(firebaseUser.uid);
              setEmployee(employeeData);
            } else {
              setEmployee(null);
            }
          } else {
            // User not found in users collection, try employees collection
            const employeeData = await getEmployeeById(firebaseUser.uid);
            if (employeeData) {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: 'employee',
                name: employeeData.name,
                createdAt: new Date()
              });
              setEmployee(employeeData);
            } else {
              // User not found anywhere, logout
              await signOut(auth);
              setUser(null);
              setEmployee(null);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          await signOut(auth);
          setUser(null);
          setEmployee(null);
        }
      } else {
        setUser(null);
        setEmployee(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    employee,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};