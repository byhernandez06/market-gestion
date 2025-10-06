# Sistema de Gestión de Empleados - Minisúper Familiar

## MVP - Lista de archivos a crear:

### 1. Configuración y Setup
- `src/lib/firebase.js` - Configuración de Firebase (placeholder para credenciales)
- `src/contexts/AuthContext.tsx` - Context para autenticación
- `src/types/index.ts` - Tipos TypeScript para la aplicación

### 2. Componentes de Autenticación
- `src/components/Login.tsx` - Formulario de login
- `src/components/ProtectedRoute.tsx` - Componente para rutas protegidas

### 3. Layout y Navegación
- `src/components/Layout.tsx` - Layout principal con sidebar
- `src/components/Sidebar.tsx` - Navegación lateral

### 4. Páginas Principales
- `src/pages/Dashboard.tsx` - Dashboard principal
- `src/pages/Employees.tsx` - Gestión de empleados (solo admin)
- `src/pages/Schedule.tsx` - Gestión de horarios con calendario
- `src/pages/Vacations.tsx` - Gestión de vacaciones
- `src/pages/Extras.tsx` - Gestión de horas extras

### 5. Componentes Específicos
- `src/components/EmployeeForm.tsx` - Formulario para crear/editar empleados
- `src/components/Calendar.tsx` - Componente de calendario con FullCalendar
- `src/components/VacationRequest.tsx` - Formulario de solicitud de vacaciones

### Funcionalidades MVP:
1. ✅ Login con Firebase Auth
2. ✅ Roles de usuario (admin, empleado, refuerzo)
3. ✅ CRUD de empleados (solo admin)
4. ✅ Calendario de horarios visual
5. ✅ Sistema de vacaciones
6. ✅ Registro de horas extras
7. ✅ Vista específica por rol
8. ✅ Datos ficticios de ejemplo

### Dependencias necesarias:
- firebase
- @fullcalendar/react
- @fullcalendar/daygrid
- @fullcalendar/timegrid
- @fullcalendar/interaction
- date-fns
- react-hook-form