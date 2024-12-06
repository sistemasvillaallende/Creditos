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
import CloseIcon from '@mui/icons-material/Close';
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
  const [loading, setLoading] = useState(true);
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
      // Encontrar la fecha de vencimiento ms lejana
      const maxVencimiento = selectedDeudas.reduce((maxDate, deuda) => {
        const [day, month, year] = deuda.vencimiento.split('/');
        const currentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return currentDate > maxDate ? currentDate : maxDate;
      }, new Date(2000, 0, 1));

      const formattedVencimiento = `${maxVencimiento.getDate()}/${maxVencimiento.getMonth() + 1}/${maxVencimiento.getFullYear()}`;

      const body = {
        legajo: Number(legajo),
        vencimiento: formattedVencimiento,
        monto_cedulon: selectedDeudas.reduce((sum, deuda) => sum + Number(deuda.debe), 0),
        listadeuda: selectedDeudas.map(deuda => {
          const deudaFormateada = {
            periodo: deuda.periodo,
            monto_original: Number(deuda.monto_original),
            debe: Number(deuda.debe),
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
          };
          return deudaFormateada;
        })
      };

      console.log('Body del request:', JSON.stringify(body, null, 2));

      const response = await axios.post(
        `${import.meta.env.VITE_API_CEDULONES}Credito/EmitoCedulonCredito`,
        body,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Respuesta del servidor:', response.data);

      if (response.data) {
        const nroCedulonRecibido = Number(response.data);
        setNroCedulon(nroCedulonRecibido);
        setShowCedulon(true);
        onClose();
        console.log('Estado showCedulon:', true);
        console.log('Estado nroCedulon:', nroCedulonRecibido);
      } else {
        alert('No se recibió el número de cedulón del servidor');
      }

    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error al generar cedulón:', error);
        console.error('Detalles del error:', error.response?.data);
        alert(`Error al generar cedulón: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  useEffect(() => {
    const fetchDeudas = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}CM_Ctasctes/getListDeudaCredito`,
          { params: { id_credito_materiales: idCredito } }
        );
        setDeudas(response.data);
      } catch (error) {
        console.error('Error al cargar las deudas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchDeudas();
    }
  }, [idCredito, open]);

  console.log('Render - showCedulon:', showCedulon);
  console.log('Render - nroCedulon:', nroCedulon);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
          onClose={() => {
            console.log('Cerrando Cedulon');
            setShowCedulon(false);
            setNroCedulon(null);
          }}
          nroCedulon={nroCedulon}
        />
      )}
    </>
  );
}

export default DetalleDeuda; 