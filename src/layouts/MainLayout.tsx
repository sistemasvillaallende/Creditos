import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import LogoPablo from '../assets/LogoPablo.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#F5F5F5'
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <img
              src={LogoPablo}
              alt="Logo Pablo"
              style={{
                height: '40px',
                objectFit: 'contain'
              }}
            />
          </Box>
          {user && (
            <Typography
              variant="body1"
              sx={{
                ml: 2,
                color: 'text.primary' // Para que el texto sea oscuro sobre fondo claro
              }}
            >
              {user.nombre_completo}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          mt: 8 // Aumentamos el margen superior para compensar el AppBar
        }}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

export default MainLayout; 