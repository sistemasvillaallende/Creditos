import axios from 'axios';
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CedulonProps {
  open: boolean;
  onClose: () => void;
  nroCedulon: number;
}

interface CabeceraCedulon {
  nroCedulon: number;
  denominacion: string;
  detalle: string;
  nombre: string;
  vencimiento: string;
  montoPagar: number;
  cuit: string;
}

interface DetalleCedulon {
  periodo: string;
  concepto: string;
  montoPagado: number;
  montoOriginal: number;
  recargo: number;
  descInteres: number;
  saldoFavor: number;
  nro_transaccion: number;
}

function Cedulon({ open, onClose, nroCedulon }: CedulonProps) {
  const [cabecera, setCabecera] = useState<CabeceraCedulon | null>(null);
  const [detalles, setDetalles] = useState<DetalleCedulon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCedulonData = async () => {
      try {
        const [cabResponse, detResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_CEDULONES}Credito/getCabeceraPrintCedulonCredito?nroCedulon=${nroCedulon}`),
          axios.get(`${import.meta.env.VITE_API_CEDULONES}Credito/getDetallePrintCedulonCredito?nroCedulon=${nroCedulon}`)
        ]);

        setCabecera(cabResponse.data);
        setDetalles(detResponse.data);
      } catch (error) {
        console.error('Error al cargar datos del cedul��n:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && nroCedulon) {
      fetchCedulonData();
    }
  }, [open, nroCedulon]);

  const generarPDF = () => {
    const doc = new jsPDF();

    // Configuración inicial
    doc.setFont('helvetica');
    doc.setFontSize(16);

    // Encabezado
    doc.text(`Cedulón #${nroCedulon}`, 15, 20);

    // Datos del contribuyente
    doc.setFontSize(12);
    doc.text('Datos del Contribuyente:', 15, 40);
    doc.setFontSize(10);
    doc.text(`Nombre: ${cabecera?.nombre}`, 15, 50);
    doc.text(`CUIT: ${cabecera?.cuit}`, 15, 60);
    doc.text(`Vencimiento: ${cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}`, 15, 70);
    doc.text(`Monto a Pagar: $${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}`, 15, 80);

    // Tabla de detalles
    autoTable(doc, {
      startY: 90,
      head: [['Período', 'Concepto', 'Monto Original', 'Recargo', 'Total']],
      body: detalles.map(detalle => [
        detalle.periodo,
        detalle.concepto,
        `$${detalle.montoOriginal.toLocaleString('es-AR')}`,
        `$${detalle.recargo.toLocaleString('es-AR')}`,
        `$${detalle.descInteres.toLocaleString('es-AR')}`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 15 },
      theme: 'grid'
    });

    // Guardar PDF
    doc.save(`Cedulon_${nroCedulon}.pdf`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Cedulón #{nroCedulon}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Box mb={3}>
              <Typography variant="h6">Datos del Contribuyente</Typography>
              <Typography>Nombre: {cabecera?.nombre}</Typography>
              <Typography>CUIT: {cabecera?.cuit}</Typography>
              <Typography>Vencimiento: {cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}</Typography>
              <Typography>Monto a Pagar: ${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}</Typography>
            </Box>
            <Box>
              <Typography variant="h6">Detalle</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Período</TableCell>
                      <TableCell>Concepto</TableCell>
                      <TableCell align="right">Monto Original</TableCell>
                      <TableCell align="right">Recargo</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalles.map((detalle, index) => (
                      <TableRow key={`${detalle.nro_transaccion}-${index}`}>
                        <TableCell>{detalle.periodo}</TableCell>
                        <TableCell>{detalle.concepto}</TableCell>
                        <TableCell align="right">${detalle.montoOriginal.toLocaleString('es-AR')}</TableCell>
                        <TableCell align="right">${detalle.recargo.toLocaleString('es-AR')}</TableCell>
                        <TableCell align="right">${detalle.descInteres.toLocaleString('es-AR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={generarPDF}
        >
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Cedulon; 