import { Box } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

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
      <Navbar />
      <Box component="main" sx={{
        flexGrow: 1,
        py: 3
      }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

export default MainLayout; 