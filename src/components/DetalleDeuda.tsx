import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import axios, { AxiosError } from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Checkbox,
  Button,
  Grid,
  FormControlLabel
} from '@mui/material';
import Cedulon from './Cedulon';

interface DetalleDeudaProps {
  open: boolean;
  onClose: () => void;
  idCredito: number;
  legajo: number;
  cuit: string;
  garantes: string;
  proximoVencimiento: string;
  saldoAdeudado: number;
  valorCuotaUva: number;
}

interface Deuda {
  periodo: string;
  deudaOriginal: number;
  importe: number;
  fecha_vencimiento: string;
  desCategoria: string;
  pagado: number;
  nro_transaccion: number;
  categoria_deuda: number;
  nro_cedulon_paypertic: number;
  intereses: number;
  pago_parcial: boolean;
  pago_a_cuenta: number;
  nro_proc: number;
}

function DetalleDeuda({ open, onClose, idCredito, legajo, cuit, garantes, proximoVencimiento, saldoAdeudado, valorCuotaUva }: DetalleDeudaProps) {

  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeudas, setSelectedDeudas] = useState<Deuda[]>([]);
  const [showCedulon, setShowCedulon] = useState(false);
  const [nroCedulon, setNroCedulon] = useState<number | null>(null);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedDeudas(deudas);
    } else {
      setSelectedDeudas([]);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'seleccionar',
      headerName: 'Seleccionar',
      width: 100,
      renderHeader: () => (
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedDeudas.length === deudas.length && deudas.length > 0}
              indeterminate={selectedDeudas.length > 0 && selectedDeudas.length < deudas.length}
              onChange={handleSelectAll}
            />
          }
          label=""
        />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedDeudas.some(d => d.nro_transaccion === params.row.nro_transaccion)}
          onChange={(e) => handleSelectionChange(e, params.row)}
        />
      ),
    },
    {
      field: 'periodo',
      headerName: 'Período',
      width: 120,
    },
    {
      field: 'deudaOriginal',
      headerName: 'Monto Original',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <span>
          ${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      field: 'importe',
      headerName: 'Debe',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <span>
          ${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      field: 'fecha_vencimiento',
      headerName: 'Vencimiento',
      width: 150,
    },
    {
      field: 'desCategoria',
      headerName: 'Categoría',
      width: 200,
    },
  ];

  const handleSelectionChange = (event: React.ChangeEvent<HTMLInputElement>, deuda: Deuda) => {
    if (event.target.checked) {
      setSelectedDeudas([...selectedDeudas, deuda]);
    } else {
      setSelectedDeudas(selectedDeudas.filter(d => d.nro_transaccion !== deuda.nro_transaccion));
    }
  };

  const handleGenerarCedulon = async () => {
    if (selectedDeudas.length === 0) {
      alert('Debe seleccionar al menos un período');
      return;
    }

    try {
      const body = {
        id_credito_materiales: Number(idCredito),
        vencimiento: selectedDeudas[selectedDeudas.length - 1].fecha_vencimiento,
        monto_cedulon: Number(selectedDeudas.reduce((sum, deuda) => sum + Number(deuda.importe), 0).toFixed(2)),
        listadeuda: selectedDeudas.map(deuda => ({
          periodo: deuda.periodo,
          monto_original: Number(Number(deuda.deudaOriginal).toFixed(2)),
          debe: Number(Number(deuda.importe).toFixed(2)),
          vencimiento: deuda.fecha_vencimiento,
          desCategoria: deuda.desCategoria,
          pagado: 0,
          nro_transaccion: Number(deuda.nro_transaccion),
          categoria_deuda: 1,
          nro_cedulon_paypertic: 0,
          recargo: 0,
          pago_parcial: false,
          pago_a_cuenta: 0,
          nro_proc: 0
        }))
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_CEDULONES}Credito/EmitoCedulonCredito`,
        body
      );

      if (response.data) {
        const nroCedulonRecibido = Number(response.data);
        // Limpiar estados antes de mostrar el cedulón
        setSelectedDeudas([]);
        setDeudas([]);
        setNroCedulon(nroCedulonRecibido);
        setShowCedulon(true);
        onClose();
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error al generar cedulón:', error);
        console.error('Detalles del error:', error.response?.data);
        alert(`Error al generar cedulón: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Función para recargar los datos
  const recargarDatos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}CM_Ctasctes/getListDeudaCredito`,
        { params: { id_credito_materiales: idCredito } }
      );
      setDeudas(response.data);
    } catch (error) {
      console.error('Error al recargar las deudas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar estados al cerrar el cedulón
  const handleCloseCedulon = async () => {
    setShowCedulon(false);
    setNroCedulon(null);
    setSelectedDeudas([]);
    setDeudas([]);
    await recargarDatos();
  };

  // Limpiar estados cuando se cierra el diálogo
  const handleClose = () => {
    setSelectedDeudas([]);
    setDeudas([]);
    onClose();
  };

  // Efecto para cargar deudas cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      recargarDatos();
    } else {
      // Limpiar estados cuando se cierra
      setSelectedDeudas([]);
      setDeudas([]);
    }
  }, [idCredito, open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle># {idCredito} Detalle de Deuda</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography><strong>Legajo:</strong> {legajo}</Typography>
              <Typography><strong>CUIT:</strong> {cuit}</Typography>
              <Typography><strong>Garantes:</strong> {garantes}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><strong>Próximo Vencimiento:</strong> {proximoVencimiento}</Typography>
              <Typography><strong>Saldo Adeudado:</strong> ${saldoAdeudado.toLocaleString('es-AR')}</Typography>
              <Typography><strong>Valor Cuota UVA:</strong> ${valorCuotaUva.toLocaleString('es-AR')}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ flexGrow: 1 }}>
            <DataGrid
              rows={deudas}
              columns={columns}
              getRowId={(row) => row.nro_transaccion}
              loading={loading}
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
            />
          </Box>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerarCedulon}
              disabled={selectedDeudas.length === 0}
            >
              Generar Cedulón ({selectedDeudas.length})
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {showCedulon && nroCedulon && (
        <Cedulon
          open={showCedulon}
          onClose={handleCloseCedulon}
          nroCedulon={nroCedulon}
        />
      )}
    </>
  );
}

export default DetalleDeuda; 