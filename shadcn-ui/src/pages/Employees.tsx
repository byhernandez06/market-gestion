import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Employee } from '@/types';
import EmployeeForm from '@/components/EmployeeForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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
    setEmployees(mockEmployees);
  }, []);

  const handleAddEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString()
    };
    setEmployees([...employees, newEmployee]);
    setShowForm(false);
  };

  const handleEditEmployee = (employeeData: Omit<Employee, 'id'>) => {
    if (editingEmployee) {
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id 
          ? { ...employeeData, id: editingEmployee.id }
          : emp
      );
      setEmployees(updatedEmployees);
      setEditingEmployee(null);
      setShowForm(false);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const calculateWorkedTime = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} ${months % 12} mes${months % 12 !== 1 ? 'es' : ''}`;
    }
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
          <p className="text-gray-600">Administra la información de todos los empleados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo Empleado</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: employee.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <CardDescription className="capitalize">{employee.role}</CardDescription>
                  </div>
                </div>
                <Badge variant={employee.status === 'activo' ? 'default' : 'secondary'}>
                  {employee.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Ingreso</p>
                  <p className="text-sm">{new Date(employee.startDate).toLocaleDateString('es-CR')}</p>
                  <p className="text-xs text-gray-500">{calculateWorkedTime(employee.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tarifa por Hora</p>
                  <p className="text-lg font-semibold text-green-600">₡{employee.hourlyRate.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-sm">{employee.email}</p>
                </div>
              </div>
              
              <div className="flex justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmployee(employee)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>Ver</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditForm(employee)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>Editar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteEmployee(employee.id)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Eliminar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulario de empleado */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
          onCancel={closeForm}
        />
      )}

      {/* Modal de detalles del empleado */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Empleado</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: selectedEmployee.color }}
                />
                <div>
                  <h3 className="font-semibold">{selectedEmployee.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{selectedEmployee.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Tiempo Laborado</p>
                  <p>{calculateWorkedTime(selectedEmployee.startDate)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Estado</p>
                  <Badge variant={selectedEmployee.status === 'activo' ? 'default' : 'secondary'}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Tarifa/Hora</p>
                  <p className="font-semibold text-green-600">₡{selectedEmployee.hourlyRate.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Email</p>
                  <p>{selectedEmployee.email}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Resumen del Mes</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Horas Trabajadas:</span>
                    <span className="font-medium">160 hrs</span>
                  </div>
                  {selectedEmployee.role === 'empleado' && (
                    <div className="flex justify-between">
                      <span>Horas Extra:</span>
                      <span className="font-medium">8 hrs</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Días de Vacaciones:</span>
                    <span className="font-medium">12 disponibles</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;