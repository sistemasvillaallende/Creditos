import { Box, Typography } from '@mui/material';

function Footer() {
  return (
    <Box component="footer" sx={{
      py: 3,
      px: 2,
      mt: 'auto',
      backgroundColor: (theme) => theme.palette.grey[200]
    }}>
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} Municipalidad de Villa Allende
      </Typography>
    </Box>
  );
}

export default Footer; 