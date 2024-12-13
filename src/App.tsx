import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import axios from 'axios';
import { Container, Typography, IconButton, Box, Button, TextField, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import DetalleDeuda from './components/DetalleDeuda';
import NuevoCredito from './components/NuevoCredito';
import EditarCredito from './components/EditarCredito';
import MainLayout from './layouts/MainLayout';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';

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
  const [openEditarCredito, setOpenEditarCredito] = useState(false);
  const [searchLegajo, setSearchLegajo] = useState<string>('');

  const fetchCreditos = async (legajo?: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/GetCreditoMPaginado`,
        {
          params: {
            buscarPor: 'legajo',
            strParametro: legajo,
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
      setCreditos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditos();
  }, []);

  const handleDelete = async (legajo: number, id_credito_materiales: number) => {
    const { value: observaciones } = await Swal.fire({
      title: '¿Está seguro de eliminar este crédito?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      input: 'text',
      inputLabel: 'Auditoría',
      inputPlaceholder: 'Ingrese el motivo de la eliminación',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo para la eliminación';
        }
        return null;
      }
    });

    if (observaciones) {
      try {
        const payload = {
          id_auditoria: 0,
          fecha: new Date().toISOString(),
          usuario: "sistema",
          proceso: "baja",
          identificacion: "web",
          autorizaciones: "",
          observaciones: observaciones,
          detalle: "",
          ip: ""
        };

        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/BajaCredito?legajo=${legajo}&id_credito_materiales=${id_credito_materiales}`,
          payload
        );

        Swal.fire(
          'Eliminado',
          'El crédito ha sido eliminado correctamente',
          'success'
        );

        fetchCreditos(); // Actualizar la tabla
      } catch (error) {
        console.error('Error al eliminar el crédito:', error);
        Swal.fire(
          'Error',
          'Hubo un error al eliminar el crédito',
          'error'
        );
      }
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const legajo = event.target.value;
    setSearchLegajo(legajo);

    // Solo llamar a la API si hay un legajo para buscar
    if (legajo.trim()) {
      fetchCreditos(legajo);
    } else {
      fetchCreditos();
    }
  };

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
      headerName: 'Presupuesto UVA (saldo inicial UVA)',
      width: 130,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return `$${Number(params.row.presupuesto_uva).toLocaleString('es-AR')}`;
      }
    },
    { field: 'cant_cuotas', headerName: 'Cuotas', width: 100 },
    {
      field: 'baja',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => {
        return (
          <span style={{
            color: params.row.baja ? '#d32f2f' : '#2e7d32',
            fontWeight: 'bold'
          }}>
            {params.row.baja ? 'BAJA' : 'VIGENTE'}
          </span>
        );
      }
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 160,
      renderCell: (params) => {
        const handleAltaBaja = async (id_credito_materiales: number) => {
          if (params.row.baja) {
            const { value: observaciones } = await Swal.fire({
              title: '¿Está seguro de dar de alta este crédito?',
              text: "Esta acción volverá a activar el crédito",
              icon: 'warning',
              input: 'text',
              inputLabel: 'Auditoría',
              inputPlaceholder: 'Ingrese el motivo del alta',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, dar de alta',
              cancelButtonText: 'Cancelar',
              inputValidator: (value) => {
                if (!value) {
                  return 'Debe ingresar un motivo para el alta';
                }
                return null;
              }
            });

            if (observaciones) {
              try {
                const payload = {
                  id_auditoria: 0,
                  fecha: new Date().toISOString(),
                  usuario: "sistema",
                  proceso: "alta",
                  identificacion: "web",
                  autorizaciones: "",
                  observaciones: observaciones,
                  detalle: "",
                  ip: ""
                };

                await axios.put(
                  `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/AltaCredito?id_credito_materiales=${id_credito_materiales}`,
                  payload
                );

                Swal.fire('Éxito', 'El crédito ha sido dado de alta correctamente', 'success');
                fetchCreditos();
              } catch (error) {
                console.error('Error al dar de alta el crédito:', error);
                Swal.fire('Error', 'Hubo un error al dar de alta el crédito', 'error');
              }
            }
          } else {
            handleDelete(params.row.legajo, id_credito_materiales);
          }
        };

        return (
          <>
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
              color="primary"
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              onClick={() => {
                setSelectedCredito(params.row.id_credito_materiales);
                setSelectedLegajo(params.row.legajo);
                setOpenEditarCredito(true);
              }}
              color="warning"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => handleAltaBaja(params.row.id_credito_materiales)}
              color={params.row.baja ? "success" : "error"}
            >
              {params.row.baja ? <UploadIcon /> : <DeleteIcon />}
            </IconButton>
          </>
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

        <Box mb={2}>
          <TextField
            fullWidth
            variant="outlined"
            label="Buscar por legajo"
            value={searchLegajo}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Ingrese el número de legajo"
          />
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
        <EditarCredito
          open={openEditarCredito}
          onClose={() => setOpenEditarCredito(false)}
          idCredito={selectedCredito || 0}
          legajo={selectedLegajo}
          onCreditoEditado={() => {
            fetchCreditos();
          }}
        />
      </Container>
    </MainLayout>
  );
}

export default App;
