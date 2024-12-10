import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import axios from 'axios';
import { Container, Typography, IconButton, Box, Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DetalleDeuda from './components/DetalleDeuda';
import NuevoCredito from './components/NuevoCredito';
import MainLayout from './layouts/MainLayout';

interface Credito {
  id_credito_materiales: number;
  legajo: number;
  domicilio: string;
  fecha_alta: string;
  baja: boolean;
  fecha_baja: string;
  cuit_solicitante: string;
  garantes: string;
  presupuesto: number;
  presupuesto_uva: number;
  cant_cuotas: number;
  valor_cuota_uva: number;
  id_uva: number;
  id_estado: number;
  per_ultimo: string;
  con_deuda: number;
  saldo_adeudado: number;
  proximo_vencimiento: string;
}

function App() {
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredito, setSelectedCredito] = useState<number | null>(null);
  const [openDetalleDeuda, setOpenDetalleDeuda] = useState(false);
  const [openNuevoCredito, setOpenNuevoCredito] = useState(false);
  const [selectedGarantes, setSelectedGarantes] = useState<string>('');
  const [selectedVencimiento, setSelectedVencimiento] = useState<string>('');
  const [selectedSaldoAdeudado, setSelectedSaldoAdeudado] = useState<number>(0);
  const [selectedValorCuotaUva, setSelectedValorCuotaUva] = useState<number>(0);
  const [selectedLegajo, setSelectedLegajo] = useState<number>(0);
  const [selectedCuit, setSelectedCuit] = useState<string>('');

  const fetchCreditos = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/GetCreditoMPaginado`,
        {
          params: {
            buscarPor: 'legajo',
            pagina: 1,
            registros_por_pagina: 10
          }
        }
      );

      if (Array.isArray(response.data.resultado)) {
        const creditosFormateados = response.data.resultado.map((credito: Credito) => {
          return {
            ...credito,
            presupuesto: Number(credito.presupuesto),
            presupuesto_uva: Number(credito.presupuesto_uva)
          };
        });
        setCreditos(creditosFormateados);
      }
    } catch (error) {
      console.error('Error al cargar los créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditos();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id_credito_materiales', headerName: 'ID', width: 90 },
    { field: 'legajo', headerName: 'Legajo', width: 100 },
    { field: 'domicilio', headerName: 'Domicilio', width: 200 },
    {
      field: 'fecha_alta',
      headerName: 'Fecha Alta',
      width: 150,
      renderCell: (params) => {
        if (params.row.fecha_alta) {
          return new Date(params.row.fecha_alta).toLocaleDateString('es-AR');
        }
        return '';
      }
    },
    { field: 'cuit_solicitante', headerName: 'CUIT', width: 130 },
    {
      field: 'presupuesto',
      headerName: 'Presupuesto',
      width: 130,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return `$${Number(params.row.presupuesto).toLocaleString('es-AR')}`;
      }
    },
    {
      field: 'presupuesto_uva',
      headerName: 'Presupuesto UVA',
      width: 130,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return `$${Number(params.row.presupuesto_uva).toLocaleString('es-AR')}`;
      }
    },
    { field: 'cant_cuotas', headerName: 'Cuotas', width: 100 },
    {
      field: 'acciones',
      headerName: 'Acc.',
      width: 70,
      renderCell: (params) => {
        return (
          <IconButton
            onClick={() => {
              setSelectedCredito(params.row.id_credito_materiales);
              setSelectedLegajo(params.row.legajo);
              setSelectedCuit(params.row.cuit_solicitante);
              setOpenDetalleDeuda(true);
              setSelectedGarantes(params.row.garantes);
              setSelectedVencimiento(params.row.proximo_vencimiento);
              setSelectedSaldoAdeudado(params.row.saldo_adeudado);
              setSelectedValorCuotaUva(params.row.valor_cuota_uva);
            }}
          >
            <VisibilityIcon />
          </IconButton>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Listado de Créditos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenNuevoCredito(true)}
          >
            Nuevo Crédito
          </Button>
        </Box>
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={creditos}
            columns={columns}
            getRowId={(row) => row.id_credito_materiales}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
          />
        </div>
        <DetalleDeuda
          open={openDetalleDeuda}
          onClose={() => setOpenDetalleDeuda(false)}
          idCredito={selectedCredito || 0}
          legajo={selectedLegajo}
          cuit={selectedCuit}
          garantes={selectedGarantes}
          proximoVencimiento={selectedVencimiento}
          saldoAdeudado={selectedSaldoAdeudado}
          valorCuotaUva={selectedValorCuotaUva}
        />
        <NuevoCredito
          open={openNuevoCredito}
          onClose={() => setOpenNuevoCredito(false)}
          onCreditoCreado={() => {
            fetchCreditos();
          }}
        />
      </Container>
    </MainLayout>
  );
}

export default App;
