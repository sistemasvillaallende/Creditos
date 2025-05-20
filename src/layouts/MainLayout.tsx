import { Box } from '@mui/material';
import Footer from './Footer';
import HeaderRemoto from '../components/HeaderRemoto.tsx';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <HeaderRemoto />
      <Box>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

export default MainLayout;