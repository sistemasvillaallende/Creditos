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
  Grid
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
  monto_original: number;
  debe: number;
  vencimiento: string;
  desCategoria: string;
  pagado: number;
  nro_transaccion: number;
}

function DetalleDeuda({ open, onClose, idCredito, legajo, cuit, garantes, proximoVencimiento, saldoAdeudado, valorCuotaUva }: DetalleDeudaProps) {

  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeudas, setSelectedDeudas] = useState<Deuda[]>([]);
  const [showCedulon, setShowCedulon] = useState(false);
  const [nroCedulon, setNroCedulon] = useState<number | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'seleccionar',
      headerName: 'Seleccionar',
      width: 100,
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
      field: 'monto_original',
      headerName: 'Monto Original',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <span>
          ${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      field: 'debe',
      headerName: 'Debe',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <span>
          ${Number(params.value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      field: 'vencimiento',
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
        legajo: Number(legajo),
        vencimiento: selectedDeudas[selectedDeudas.length - 1].vencimiento,
        monto_cedulon: Number(selectedDeudas.reduce((sum, deuda) => sum + Number(deuda.debe), 0).toFixed(2)),
        listadeuda: selectedDeudas.map(deuda => ({
          periodo: deuda.periodo,
          monto_original: Number(Number(deuda.monto_original).toFixed(2)),
          debe: Number(Number(deuda.debe).toFixed(2)),
          vencimiento: deuda.vencimiento,
          desCategoria: deuda.desCategoria,
          pagado: 0,
          nro_transaccion: Number(deuda.nro_transaccion),
          categoria_deuda: 19,
          nro_cedulon_paypertic: 0,
          recargo: 0,
          pago_parcial: false,
          pago_a_cuenta: 0,
          nro_proc: 0
        }))
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_CEDULONES}Credito/EmitoCedulonCredito`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data) {
        const nroCedulonRecibido = Number(response.data);
        // Limpiar estados
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

  // Efecto para cargar deudas cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      recargarDatos();
    }
  }, [idCredito, open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          setSelectedDeudas([]);
          setDeudas([]);
          onClose();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalle de Deuda</DialogTitle>
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