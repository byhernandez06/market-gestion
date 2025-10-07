import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (error: unknown) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@super.com');
    setPassword('Asdf1234');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Super Gestión</CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestión de Empleados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-semibold text-green-800 mb-2">Credenciales de Administrador:</p>
            <p className="text-green-700 text-sm mb-2">
              📧 Email: admin@super.com<br />
              🔑 Password: Asdf1234
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fillAdminCredentials}
              className="w-full bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
            >
              Usar credenciales de admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;