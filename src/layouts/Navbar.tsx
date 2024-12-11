import { AppBar, Toolbar, Box } from '@mui/material';
import LogoPablo from '../assets/LogoPablo.png';

function Navbar() {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#f5f5f5', color: 'text.primary' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={2}>
          <img
            src={LogoPablo}
            alt="Logo Pablo"
            style={{
              height: '40px',
              marginRight: '16px'
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 