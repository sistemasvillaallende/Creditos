import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Grid,
  TablePagination
} from '@mui/material';
import axios from 'axios';

interface CuentaCorrienteProps {
  open: boolean;
  onClose: () => void;
  idCredito: number;
  legajo: number;
  cuit: string;
  nombre: string;
}

interface CtaCte {
  fecha_trasaccion: string;
  debe: number;
  haber: number;
  vencimiento: string;
  periodo: string;
  monto_original: number;
  categoria_deuda: number;
}

export default function CuentaCorriente({ open, onClose, idCredito, legajo, cuit, nombre }: CuentaCorrienteProps) {
  const [cuentas, setCuentas] = useState<CtaCte[]>([]);
  const [totales, setTotales] = useState({
    debe: 0,
    haber: 0,
    montoOriginal: 0
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    const fetchCuentaCorriente = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}CM_Ctasctes/getListCtasCtes?id_credito_materiales=${idCredito}`
        );
        setCuentas(response.data);

        // Calcular totales
        const totales = response.data.reduce((acc: { debe: number; haber: number; montoOriginal: number }, cuenta: CtaCte) => ({
          debe: acc.debe + cuenta.debe,
          haber: acc.haber + cuenta.haber,
          montoOriginal: acc.montoOriginal + cuenta.monto_original
        }), { debe: 0, haber: 0, montoOriginal: 0 });

        setTotales(totales);
      } catch (error) {
        console.error('Error al cargar cuenta corriente:', error);
      }
    };

    if (open && idCredito) {
      fetchCuentaCorriente();
    }
  }, [open, idCredito]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Cuenta Corriente</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="body1">
              <strong>Legajo:</strong> {legajo}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body1">
              <strong>CUIT:</strong> {cuit}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body1">
              <strong>Nombre:</strong> {nombre}
            </Typography>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Período</TableCell>
                <TableCell align="right">Debe</TableCell>
                <TableCell align="right">Haber</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell align="right">Monto Original</TableCell>
                <TableCell>Categoría</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuentas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((cuenta, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(cuenta.fecha_trasaccion).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>{cuenta.periodo}</TableCell>
                    <TableCell align="right">
                      ${cuenta.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
                      ${cuenta.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {new Date(cuenta.vencimiento).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell align="right">
                      ${cuenta.monto_original.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{cuenta.categoria_deuda}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={cuentas.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`}
          />
        </TableContainer>

        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography>
                <strong>Debe:</strong> ${totales.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography>
                <strong>Haber:</strong> ${totales.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography>
                <strong>Monto Original:</strong> ${totales.montoOriginal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
} 