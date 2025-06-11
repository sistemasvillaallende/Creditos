import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import axios from 'axios';
import { Container, Typography, IconButton, Box, Button, TextField, InputAdornment, Grid, Tooltip, FormControlLabel, Switch } from '@mui/material';
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
import { useAuth } from './contexts/AuthContext';
import AccessDenied from './components/AccessDenied';
import { createAuditoriaData } from './utils/auditoria';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CuentaCorriente from './components/CuentaCorriente';

export type Credito = {
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
  nombre: string; // Made non-optional as it's defaulted
}

export type ResumenImporte = {
  legajo: number;
  imp_pagado: number;
  imp_adeudado: number;
  imp_vencido: number;
  cuotas_vencidas: number;
  cuotas_pagadas: number;
  fecha_ultimo_pago: string | null;
}

export type CreditoConResumen = Credito & Partial<ResumenImporte>;

function App() {
  const { isAuthenticated, user } = useAuth();
  const [creditos, setCreditos] = useState<CreditoConResumen[]>([]); // Holds filtered data for display
  const [allCreditos, setAllCreditos] = useState<CreditoConResumen[]>([]); // Holds all fetched and merged data
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openCuentaCorriente, setOpenCuentaCorriente] = useState(false);
  const [filterConDeudaImp, setFilterConDeudaImp] = useState<boolean>(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [creditosResponse, resumenesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/GetAllCreditos`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}CM_Ctasctes/resumenImportes`)
      ]);

      let fetchedCreditos: Credito[] = [];
      if (Array.isArray(creditosResponse.data)) {
        fetchedCreditos = creditosResponse.data.map((credito: any) => ({
          ...credito,
          presupuesto: Number(credito.presupuesto),
          presupuesto_uva: Number(credito.presupuesto_uva),
          nombre: credito.nombre || 'Sin nombre'
        }));
      }

      let resumenesData: ResumenImporte[] = [];
      if (Array.isArray(resumenesResponse.data)) {
        resumenesData = resumenesResponse.data.map((r: any) => ({
          legajo: Number(r.legajo),
          imp_pagado: Number(r.imp_pagado),
          imp_adeudado: Number(r.imp_adeudado),
          imp_vencido: Number(r.imp_vencido),
          cuotas_vencidas: Number(r.cuotas_vencidas),
          cuotas_pagadas: Number(r.cuotas_pagadas),
          fecha_ultimo_pago: r.fecha_ultimo_pago || null,
        }));
      }

      const resumenesMap = new Map<number, ResumenImporte>();
      resumenesData.forEach(resumen => resumenesMap.set(resumen.legajo, resumen));

      const mergedCreditos: CreditoConResumen[] = fetchedCreditos.map(credito => {
        const resumen = resumenesMap.get(credito.legajo);
        return {
          ...credito,
          ...(resumen ? {
            imp_pagado: resumen.imp_pagado,
            imp_adeudado: resumen.imp_adeudado,
            imp_vencido: resumen.imp_vencido,
            cuotas_vencidas: resumen.cuotas_vencidas,
            cuotas_pagadas: resumen.cuotas_pagadas,
            fecha_ultimo_pago: resumen.fecha_ultimo_pago,
          } : {}),
        };
      });

      setAllCreditos(mergedCreditos);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      setAllCreditos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    let filteredData = [...allCreditos];

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.trim().toLowerCase();
      filteredData = filteredData.filter(credito => {
        const fieldsToSearch = [
          credito.id_credito_materiales?.toString(),
          credito.legajo?.toString(),
          credito.nombre,
          credito.domicilio,
          credito.cuit_solicitante,
          credito.garantes,
        ];
        return fieldsToSearch.some(field => field?.toLowerCase().includes(lowerSearchTerm));
      });
    }

    if (filterConDeudaImp) {
      filteredData = filteredData.filter(
        credito => typeof credito.imp_vencido === 'number' && credito.imp_vencido > 0
      );
    }

    setCreditos(filteredData);
  }, [searchTerm, filterConDeudaImp, allCreditos]);

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
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/BajaCredito?legajo=${legajo}&id_credito_materiales=${id_credito_materiales}`,
          createAuditoriaData(
            'baja_credito',
            observaciones,
            user?.nombre_completo || 'Usuario no identificado'
          )
        );

        Swal.fire(
          'Eliminado',
          'El crédito ha sido eliminado correctamente',
          'success'
        );

        fetchAllData(); // Actualizar la tabla
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

  const handleAltaBaja = async (id_credito_materiales: number) => {
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
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/AltaCredito?id_credito_materiales=${id_credito_materiales}`,
          createAuditoriaData('alta_credito', observaciones, user?.nombre_completo || 'Usuario no identificado')
        );

        Swal.fire('Éxito', 'El crédito ha sido dado de alta correctamente', 'success');
        fetchAllData();
      } catch (error) {
        console.error('Error al dar de alta el crédito:', error);
        Swal.fire('Error', 'Hubo un error al dar de alta el crédito', 'error');
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id_credito_materiales', headerName: 'ID', width: 50 },
    {
      field: 'legajo',
      headerName: 'Legajo',
      width: 80
    },
    {
      field: 'nombre',
      headerName: 'Nombre',
      width: 250,
      renderCell: (params) => (
        params.value || 'Sin nombre'
      )
    },
    { field: 'domicilio', headerName: 'Domicilio', width: 150 },
    {
      field: 'fecha_alta',
      headerName: 'Fecha Alta',
      width: 100,
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
      width: 100,
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
      field: 'imp_adeudado',
      headerName: 'Adeudado',
      width: 150,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return params.row.imp_adeudado != null ? `$${Number(params.row.imp_adeudado).toLocaleString('es-AR')}` : 'N/A';
      }
    },
    {
      field: 'imp_pagado',
      headerName: 'Pagado',
      width: 150,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return params.row.imp_pagado != null ? `$${Number(params.row.imp_pagado).toLocaleString('es-AR')}` : 'N/A';
      }
    },
    {
      field: 'imp_vencido',
      headerName: 'Vencido',
      width: 150,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return params.row.imp_vencido != null ? `$${Number(params.row.imp_vencido).toLocaleString('es-AR')}` : 'N/A';
      }
    },
    {
      field: 'cuotas_pagadas',
      headerName: 'Pagadas',
      width: 100,
      renderCell: (params) => {
        // Check if the property exists and is not null/undefined
        return params.row.cuotas_pagadas != null ? params.row.cuotas_pagadas : 'N/A';
      }
    },
    {
      field: 'cuotas_vencidas',
      headerName: 'Vencidas',
      width: 100,
      renderCell: (params) => {
        // Check if the property exists and is not null/undefined
        return params.row.cuotas_vencidas != null ? params.row.cuotas_vencidas : 'N/A';
      }
    },
    {
      field: 'fecha_ultimo_pago',
      headerName: 'Último Pago',
      width: 120,
      renderCell: (params) => {
        if (params.row.fecha_ultimo_pago) {
          return new Date(params.row.fecha_ultimo_pago).toLocaleDateString('es-AR');
        }
        return 'N/P';
      }
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 200,
      renderCell: (params) => {
        const currentCreditoRow = params.row as CreditoConResumen;
        return (
          <>
            <Tooltip title="Ver detalles de deuda" arrow>
              <IconButton
                onClick={() => {
                  setSelectedCredito(params.row.id_credito_materiales);
                  setSelectedLegajo(params.row.legajo);
                  setSelectedCuit(params.row.cuit_solicitante);
                  setOpenDetalleDeuda(true);
                  setSelectedGarantes(params.row.garantes);
                  setSelectedVencimiento(params.row.proximo_vencimiento);
                  setSelectedSaldoAdeudado(currentCreditoRow.imp_adeudado ?? currentCreditoRow.saldo_adeudado ?? 0);
                  setSelectedValorCuotaUva(currentCreditoRow.valor_cuota_uva);
                }}
                color="primary"
              >
                <AccountBalanceIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver cuenta corriente" arrow>
              <IconButton
                onClick={() => {
                  setSelectedCredito(params.row.id_credito_materiales);
                  setSelectedLegajo(params.row.legajo);
                  setSelectedCuit(params.row.cuit_solicitante);
                  setOpenCuentaCorriente(true);
                }}
                color="info"
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar crédito" arrow>
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
            </Tooltip>
            <Tooltip title={params.row.baja ? "Dar de alta" : "Dar de baja"} arrow>
              <IconButton
                onClick={() => params.row.baja ?
                  handleAltaBaja(params.row.id_credito_materiales) :
                  handleDelete(params.row.legajo, params.row.id_credito_materiales)
                }
                color={params.row.baja ? "success" : "error"}
              >
                {params.row.baja ? <UploadIcon /> : <DeleteIcon />}
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
  ];

  //autenticación
  if (!isAuthenticated) {
    return <AccessDenied />;
  }

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Listado de Créditos
          </Typography>
          <Tooltip title="Crear un nuevo crédito" arrow>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenNuevoCredito(true)}
            >
              Nuevo Crédito
            </Button>
          </Tooltip>
        </Box>

        <Box mb={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8} md={9}>
              <TextField
                fullWidth
                variant="outlined"
                label="Buscar en créditos..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Ingrese término de búsqueda (legajo, nombre, CUIT, etc.)"
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filterConDeudaImp}
                    onChange={(e) => setFilterConDeudaImp(e.target.checked)}
                  />
                }
                label="Vencido"
              />
            </Grid>
          </Grid>
        </Box>

        <div style={{ height: '100%', width: '100%' }}>
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
          legajo={selectedLegajo || 0}
          cuit={selectedCuit || ''}
          garantes={selectedGarantes || ''}
          proximoVencimiento={selectedVencimiento || ''}
          saldoAdeudado={selectedSaldoAdeudado || 0}
          valorCuotaUva={selectedValorCuotaUva || 0}
        />
        <NuevoCredito
          open={openNuevoCredito}
          onClose={() => setOpenNuevoCredito(false)}
          onCreditoCreado={() => {
            fetchAllData();
          }}
        />
        <EditarCredito
          open={openEditarCredito}
          onClose={() => setOpenEditarCredito(false)}
          idCredito={selectedCredito || 0}
          onCreditoEditado={() => {
            fetchAllData();
          }}
        />
        <CuentaCorriente
          open={openCuentaCorriente}
          onClose={() => setOpenCuentaCorriente(false)}
          idCredito={selectedCredito || 0}
          legajo={selectedLegajo || 0}
          cuit={selectedCuit || ''}
          nombre={creditos.find(c => c.id_credito_materiales === selectedCredito)?.nombre || ''}
        />
      </Container>
    </MainLayout>
  );
}

export default App;
