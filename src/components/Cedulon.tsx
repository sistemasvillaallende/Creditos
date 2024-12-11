import axios from 'axios';
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import LogoPablo from '../assets/LogoPablo.png';

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
        console.error('Error al cargar datos del cedulón:', error);
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

    // Función para generar el encabezado
    const generarEncabezado = () => {
      // Agregar el logo en la esquina superior izquierda
      const logoWidth = 50;
      const logoHeight = 15;
      doc.addImage(LogoPablo, 'PNG', 15, 10, logoWidth, logoHeight);

      // Generar código de barras
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, nroCedulon.toString(), {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false
      });

      // Agregar código de barras en la esquina superior derecha
      const barcodeWidth = 70;
      const barcodeHeight = 30;
      doc.addImage(
        canvas.toDataURL(),
        'PNG',
        doc.internal.pageSize.width - barcodeWidth - 15,
        10,
        barcodeWidth,
        barcodeHeight
      );

      // Agregar número de cedulón debajo del código de barras
      doc.setFontSize(10);
      doc.text(
        `Cedulón # ${nroCedulon}`,
        doc.internal.pageSize.width - barcodeWidth - 15,
        45,
        { align: 'left' }
      );

      // Datos del contribuyente
      doc.setFont('helvetica');
      doc.setFontSize(12);
      doc.text('Datos del Contribuyente:', 15, 50);
      doc.setFontSize(10);
      doc.text(`Nombre: ${cabecera?.nombre}`, 15, 60);
      doc.text(`CUIT: ${cabecera?.cuit}`, 15, 70);
      doc.text(`Vencimiento: ${cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}`, 15, 80);
      doc.text(`Monto a Pagar: $${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}`, 15, 90);
    };

    // Primera página
    generarEncabezado();

    // Generar talones al pie de la primera página
    const talonY = doc.internal.pageSize.height - 80; // Posición Y para los talones
    const pageWidth = doc.internal.pageSize.width;
    //const columnWidth = (pageWidth - 30) / 2; // Ancho de cada columna

    // Dibujar línea divisoria vertical
    doc.line(pageWidth / 2, talonY, pageWidth / 2, talonY + 70);

    // Talón para el contribuyente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TALÓN PARA EL CONTRIBUYENTE', 15, talonY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Cedulón #: ${nroCedulon}`, 15, talonY + 10);
    doc.text(`Nombre: ${cabecera?.nombre}`, 15, talonY + 20);
    doc.text(`CUIT: ${cabecera?.cuit}`, 15, talonY + 30);
    doc.text(`Vencimiento: ${cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}`, 15, talonY + 40);
    doc.text(`Monto: $${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}`, 15, talonY + 50);

    // Talón para la municipalidad
    doc.setFont('helvetica', 'bold');
    doc.text('TALÓN PARA LA MUNICIPALIDAD', pageWidth / 2 + 15, talonY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cedulón #: ${nroCedulon}`, pageWidth / 2 + 15, talonY + 10);
    doc.text(`Nombre: ${cabecera?.nombre}`, pageWidth / 2 + 15, talonY + 20);
    doc.text(`CUIT: ${cabecera?.cuit}`, pageWidth / 2 + 15, talonY + 30);
    doc.text(`Vencimiento: ${cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}`, pageWidth / 2 + 15, talonY + 40);
    doc.text(`Monto: $${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}`, pageWidth / 2 + 15, talonY + 50);

    // Segunda página
    doc.addPage();
    generarEncabezado();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DETALLES DEL CRÉDITO', 15, 100);

    // Tabla de detalles en la segunda página
    autoTable(doc, {
      startY: 110,
      head: [['Período', 'Concepto', 'Monto Original', 'Recargo', 'Total']],
      body: detalles.map(detalle => [
        detalle.periodo,
        detalle.concepto,
        `$${detalle.montoOriginal.toLocaleString('es-AR')}`,
        `$${detalle.recargo.toLocaleString('es-AR')}`,
        `$${detalle.descInteres.toLocaleString('es-AR')}`
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 1
      },
      headStyles: {
        fillColor: [66, 66, 66],
        cellPadding: 1
      },
      margin: { top: 15 },
      theme: 'grid',
      rowPageBreak: 'avoid'
    });

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