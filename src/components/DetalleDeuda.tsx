import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface DetalleDeudaProps {
  open: boolean;
  onClose: () => void;
  idCredito: number;
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

function DetalleDeuda({ open, onClose, idCredito, garantes, proximoVencimiento, saldoAdeudado, valorCuotaUva }: DetalleDeudaProps) {

  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: GridColDef[] = [
    { field: 'periodo', headerName: 'Período', width: 120 },
    {
      field: 'monto_original',
      headerName: 'Monto Original',
      width: 150,
      valueFormatter: (params: { value: number | null }) => {
        if (params.value != null) {
          return `$${params.value.toLocaleString('es-AR')}`;
        }
        return '';
      }
    },
    {
      field: 'debe',
      headerName: 'Debe',
      width: 150,
      valueFormatter: (params: { value: number | null }) => {
        if (params.value != null) {
          return `$${params.value.toLocaleString('es-AR')}`;
        }
        return '';
      }
    },
    {
      field: 'vencimiento',
      headerName: 'Vencimiento',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString();
        }
        return '';
      }
    },
    { field: 'desCategoria', headerName: 'Categoría', width: 200 },
  ];

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Detalle de Deudas
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Garantes:</strong> {garantes || '-'}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Próximo Vencimiento:</strong> {
              proximoVencimiento
                ? new Date(proximoVencimiento).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
                : '-'
            }
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Saldo Adeudado:</strong> {saldoAdeudado ? `$${saldoAdeudado.toLocaleString('es-AR')}` : '$0'}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Valor Cuota UVA:</strong> {valorCuotaUva ? `$${valorCuotaUva.toLocaleString('es-AR')}` : '$0'}
          </Typography>
        </Box>
        <div style={{ height: 400, width: '100%' }}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DetalleDeuda; 