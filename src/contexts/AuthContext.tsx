import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  administrador: string;
  apellido: string;
  cod_oficina: string;
  cod_usuario: string;
  cuit: string;
  cuit_formateado: string;
  legajo: string;
  nombre: string;
  nombre_completo: string;
  nombre_oficina: string;
  nombre_usuario: string;
  SesionHash: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAuthenticated: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      console.log('Todas las cookies:', document.cookie);

      const cookieString = document.cookie
        .split('; ')
        .find(row => row.startsWith('VABack.CIDI='));

      console.log('Cookie encontrada:', cookieString);

      if (cookieString) {
        try {
          // Extraemos solo el valor de la cookie (todo lo que está después del =)
          const cookieData = cookieString.substring(cookieString.indexOf('=') + 1);
          console.log('Cookie data:', cookieData);

          const userData: Record<string, string> = {};

          // Dividimos por & y procesamos cada par
          cookieData.split('&').forEach(pair => {
            const equalIndex = pair.indexOf('=');
            if (equalIndex > -1) {
              const key = pair.substring(0, equalIndex);
              const value = pair.substring(equalIndex + 1);
              if (key && value) {
                userData[key] = decodeURIComponent(value.replace(/\+/g, ' '));
              }
            }
          });

          console.log('userData procesado:', userData);
          console.log('nombre_completo existe?:', !!userData.nombre_completo);

          if (userData.nombre_completo) {
            const authUser: AuthUser = {
              administrador: userData.administrador || '',
              apellido: userData.apellido || '',
              cod_oficina: userData.cod_oficina || '',
              cod_usuario: userData.cod_usuario || '',
              cuit: userData.cuit || '',
              cuit_formateado: userData.cuit_formateado || '',
              legajo: userData.legajo || '',
              nombre: userData.nombre || '',
              nombre_completo: userData.nombre_completo,
              nombre_oficina: userData.nombre_oficina || '',
              nombre_usuario: userData.nombre_usuario || '',
              SesionHash: userData.SesionHash || ''
            };
            setUser(authUser);
          } else {
            console.log('No se encontró nombre_completo, estableciendo null');
            setUser(null);
          }
        } catch (error) {
          console.error('Error procesando la cookie:', error);
          setUser(null);
        }
      } else {
        console.log('No se encontró la cookie VABack.CIDI');
        setUser(null);
      }
    };

    try {
      checkAuth();
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setUser(null);
    }
  }, []);

  console.log('Estado final del usuario:', user);
  console.log('isAuthenticated:', !!user);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 