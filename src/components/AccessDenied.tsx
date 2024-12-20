import { Box, Typography, Container } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

export default function AccessDenied() {
  return (
    <Container>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
      >
        <BlockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tiene permisos para acceder a esta aplicación. Por favor, inicie sesión con una cuenta autorizada.
        </Typography>
      </Box>
    </Container>
  );
} 