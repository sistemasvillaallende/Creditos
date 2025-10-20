import axios from 'axios';
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import LogoPablo from '../assets/logo-secretaria.png';

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
  legajo: string;
  domicilio: string;
  cantidadCuotas: number;
  presupuesto: string;
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
        setLoading(true);
        const [cabResponse, detResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_CEDULONES}Credito/getCabeceraPrintCedCredito?nroCedulon=${nroCedulon}`),
          axios.get(`${import.meta.env.VITE_API_CEDULONES}Credito/getDetallePrintCedulonCredito?nroCedulon=${nroCedulon}`)
        ]);

        const detallesUnicos = Array.from(
          new Map(detResponse.data.map((item: DetalleCedulon) => [item.nro_transaccion, item])).values()
        ) as DetalleCedulon[];

        // Calcular el total para cada detalle y el monto total a pagar
        const detallesConTotal = detallesUnicos.map(detalle => ({
          ...detalle,
          descInteres: detalle.montoOriginal + detalle.recargo
        }));

        const montoTotal = detallesConTotal.reduce((sum, detalle) => sum + detalle.descInteres, 0);

        const cabeceraData = {
          ...cabResponse.data,
          montoPagar: montoTotal
        } as CabeceraCedulon;

        setCabecera(cabeceraData);
        setDetalles(detallesConTotal);
      } catch (error) {
        console.error('Error al cargar datos del cedulón:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && nroCedulon) {
      fetchCedulonData();
    }

    return () => {
      setCabecera(null);
      setDetalles([]);
    };
  }, [nroCedulon, open]);

  const generarPDF = () => {
    const doc = new jsPDF();

    // Crear el canvas para el código de barras
    const canvas = document.createElement('canvas');
    const barcodeWidth = 60;
    const barcodeHeight = 25;

    // Función para generar el encabezado
    const generarEncabezado = () => {
      // Logo y código de barras
      const logoWidth = 80;
      const logoHeight = 19;
      doc.addImage(LogoPablo, 'PNG', 15, 10, logoWidth, logoHeight);

      // Generar código de barras
      JsBarcode(canvas, `C0${nroCedulon.toString()}`, {
        format: "CODE39",
        width: 1.5,
        height: 40,
        displayValue: false
      });

      // Número de cedulón
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Cedulón #${nroCedulon}`, 15, 40);

      // Datos del contribuyente
      doc.setFont('helvetica');
      doc.setFontSize(11);
      doc.text('Datos del Contribuyente:', 15, 45);
      doc.setFontSize(9);
      doc.text(`Nombre: ${cabecera?.nombre}`, 15, 50);
      doc.text(`CUIT: ${cabecera?.cuit}`, 15, 54);
      doc.text(`Vencimiento: ${cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}`, 15, 58);
      doc.text(`Monto a Pagar: $${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}`, 15, 62);
      doc.text(`Domicilio: ${cabecera?.domicilio}`, 15, 66);
      doc.text(`Legajo: ${cabecera?.legajo}`, 15, 70);
      doc.text(`Cantidad de Cuotas: ${cabecera?.cantidadCuotas}`, 15, 74);
      doc.text(`Presupuesto: $${Number(cabecera?.presupuesto).toLocaleString('es-AR')}`, 15, 78);
    };

    // Generar encabezado
    generarEncabezado();

    // Tabla de detalles en la misma página
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DETALLES DEL CRÉDITO', 15, 85);

    // Tabla de detalles más compacta
    autoTable(doc, {
      startY: 90,
      head: [['Cuotas', 'Concepto', 'Monto Original', 'Recargo', 'Total']],
      body: detalles.map(detalle => [
        detalle.periodo,
        detalle.concepto,
        `$${detalle.montoOriginal.toLocaleString('es-AR')}`,
        `$${detalle.recargo.toLocaleString('es-AR')}`,
        `$${detalle.descInteres.toLocaleString('es-AR')}`
      ]),
      styles: {
        fontSize: 7,
        cellPadding: 1
      },
      headStyles: {
        fillColor: [66, 66, 66],
        fontSize: 7,
        cellPadding: 1
      },
      margin: { top: 10 },
      theme: 'grid'
    });

    // Talones al pie
    const talonY = doc.internal.pageSize.height - 60;
    const pageWidth = doc.internal.pageSize.width;

    // Línea divisoria vertical
    doc.line(pageWidth / 2, talonY, pageWidth / 2, talonY + 50);

    // TALÓN PARA EL CONTRIBUYENTE (con menor interlineado)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TALÓN PARA EL CONTRIBUYENTE', 15, talonY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Programa Mi Casa Mi Espacio', 15, talonY + 8);
    doc.text(`Nombre: ${cabecera?.nombre}`, 15, talonY + 12);
    doc.text(`CUIT: ${cabecera?.cuit}`, 15, talonY + 16);
    doc.text(
      `Vencimiento: ${cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}`,
      15,
      talonY + 20
    );
    doc.text(`Monto: $${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}`, 15, talonY + 24);
    doc.text(`Legajo: ${cabecera?.legajo}`, 15, talonY + 28);
    doc.addImage(
      canvas.toDataURL(),
      'PNG',
      15,
      talonY + 29,
      barcodeWidth,
      barcodeHeight
    );
    doc.text(`C0${nroCedulon}`, 15 + barcodeWidth / 2, talonY + 53, { align: 'center' });

    // Talón para la municipalidad
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TALÓN PARA LA MUNICIPALIDAD', pageWidth / 2 + 15, talonY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Programa Mi Casa Mi Espacio', pageWidth / 2 + 15, talonY + 9);
    doc.text(`Cedulón #: ${nroCedulon}`, pageWidth / 2 + 15, talonY + 14);
    doc.text(`Nombre: ${cabecera?.nombre}`, pageWidth / 2 + 15, talonY + 19);
    doc.text(`CUIT: ${cabecera?.cuit}`, pageWidth / 2 + 15, talonY + 24);
    doc.text(
      `Vencimiento: ${cabecera?.vencimiento ? new Date(cabecera.vencimiento).toLocaleDateString() : ''}`,
      pageWidth / 2 + 15,
      talonY + 29
    );
    doc.text(`Monto: $${cabecera?.montoPagar?.toLocaleString('es-AR') || 0}`, pageWidth / 2 + 15, talonY + 34);
    doc.text(`Legajo: ${cabecera?.legajo}`, pageWidth / 2 + 15, talonY + 39);

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