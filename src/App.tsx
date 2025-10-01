import { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import axios from 'axios';
import { Container, Typography, IconButton, Box, Button, TextField, InputAdornment, Grid, Tooltip, FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
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
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
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
  cod_categoria?: number; // Nueva propiedad para la categoría
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

export type CategoriaDeuda = {
  cod_categoria: number;
  des_categoria: string;
  id_subrubro: number;
  tipo_deuda: number;
}

/**
 * Parses a date string that might be in "DD/MM/YYYY" format or an ISO format.
 * @param dateString The date string to parse.
 * @returns A Date object if parsing is successful, otherwise null.
 */
const parsePossibleDateString = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  // Try parsing "DD/MM/YYYY"
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // Month is 1-indexed from string
    const year = parseInt(parts[2], 10);
    // Basic validation for day, month, year ranges
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day); // Month for Date constructor is 0-indexed
      // Check if the constructed date is valid and matches the input (e.g. not Feb 30th)
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
      }
    }
  }
  // If not "DD/MM/YYYY" or if parsing failed, try standard Date constructor (for ISO strings etc.)
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
};

function App() {
  // Estado y handlers para actualización de UVA
  const [openUvaModal, setOpenUvaModal] = useState(false);
  const [nuevoValorUva, setNuevoValorUva] = useState('');
  const [loadingUva, setLoadingUva] = useState(false);

  const handleOpenUvaModal = () => {
    setNuevoValorUva('');
    setOpenUvaModal(true);
  };

  const handleCloseUvaModal = () => {
    if (!loadingUva) setOpenUvaModal(false);
  };

  const handleActualizarUva = async () => {
    if (!nuevoValorUva || isNaN(Number(nuevoValorUva))) {
      Swal.fire('Error', 'Ingrese un valor numérico válido para el UVA', 'error');
      return;
    }
    setLoadingUva(true);
    try {
      const payload = {
        id_auditoria: 0,
        fecha: new Date().toISOString(),
        usuario: user?.nombre_completo || 'Usuario',
        proceso: 'actualizacion_valor_uva',
        identificacion: '',
        autorizaciones: '',
        observaciones: 'Actualización de valor UVA',
        detalle: '',
        ip: ''
      };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}CM_UVA/InsertValorUVA?valor_uva=${nuevoValorUva}`, payload);
      Swal.fire('Éxito', 'El valor UVA fue actualizado correctamente', 'success').then(() => {
        window.location.reload();
      });
      setOpenUvaModal(false);
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar el valor UVA', 'error');
    } finally {
      setLoadingUva(false);
    }
  };
  const { isAuthenticated, user } = useAuth();
  const [creditos, setCreditos] = useState<CreditoConResumen[]>([]); // Holds filtered data for display
  const [allCreditos, setAllCreditos] = useState<CreditoConResumen[]>([]); // Holds all fetched and merged data
  const [categorias, setCategorias] = useState<CategoriaDeuda[]>([]); // Holds categorías data
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

  const fetchCategorias = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}CM_Cate_deuda/GetCategoriasDeuda`
      );
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    fetchAllData();
    fetchCategorias();
  }, []);

  const getCategoriaName = (codCategoria: number | undefined): string => {
    if (!codCategoria) return 'Sin categoría';
    const categoria = categorias.find(c => c.cod_categoria === codCategoria);
    return categoria ? categoria.des_categoria : 'Sin categoría';
  };

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

  const handleExportToExcel = () => {
    if (creditos.length === 0) {
      Swal.fire('Nada que exportar', 'La tabla está vacía o no hay datos filtrados.', 'info');
      return;
    }

    // Definir los encabezados y el orden de las columnas explícitamente
    const headers = [
      'ID', 'Legajo', 'Nombre', 'Domicilio', 'Fecha Alta', 'CUIT', 'Categoría',
      'Presupuesto ($)', 'Presupuesto UVA ($)', 'Cuotas', 'Estado Crédito',
      'Importe Adeudado ($)', 'Importe Pagado ($)', 'Importe Vencido ($)',
      'Cuotas Pagadas', 'Cuotas Vencidas', 'Fecha Último Pago'
    ];

    const dataToExport = creditos.map(credito => {
      const rowData: { [key: string]: any } = {};
      rowData[headers[0]] = credito.id_credito_materiales;
      rowData[headers[1]] = credito.legajo;
      rowData[headers[2]] = credito.nombre || 'Sin nombre';
      rowData[headers[3]] = credito.domicilio;
      const parsedFechaAlta = parsePossibleDateString(credito.fecha_alta);
      rowData[headers[4]] = parsedFechaAlta ? parsedFechaAlta.toLocaleDateString('es-AR') : '';
      rowData[headers[5]] = credito.cuit_solicitante;
      rowData[headers[6]] = getCategoriaName(credito.cod_categoria);
      rowData[headers[7]] = credito.presupuesto; // Exportar como número
      rowData[headers[8]] = credito.presupuesto_uva; // Exportar como número
      rowData[headers[9]] = credito.cant_cuotas;
      rowData[headers[10]] = credito.baja ? 'BAJA' : 'VIGENTE';
      rowData[headers[11]] = credito.imp_adeudado ?? null; // null para celdas vacías, Excel lo maneja bien
      rowData[headers[12]] = credito.imp_pagado ?? null;
      rowData[headers[13]] = credito.imp_vencido ?? null;
      rowData[headers[14]] = credito.cuotas_pagadas ?? null;
      rowData[headers[15]] = credito.cuotas_vencidas ?? null;
      const parsedFechaUltimoPago = parsePossibleDateString(credito.fecha_ultimo_pago);
      rowData[headers[16]] = parsedFechaUltimoPago ? parsedFechaUltimoPago.toLocaleDateString('es-AR') : 'N/P';
      return headers.map(header => rowData[header]); // Devuelve un array de valores en el orden de los headers
    });

    // Crear la hoja de cálculo usando aoa_to_sheet para mantener el orden y manejar celdas vacías
    const worksheetData = [headers, ...dataToExport];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ajustar anchos de columnas (opcional pero recomendado)
    const colWidths = headers.map((header, i) => ({
      wch: Math.max(header.length, ...worksheetData.slice(1).map(dataRow => (dataRow[i]?.toString() ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Creditos');

    XLSX.writeFile(workbook, `ListadoCreditos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportAllToExcel = () => {
    if (allCreditos.length === 0) {
      Swal.fire('Nada que exportar', 'No hay datos disponibles.', 'info');
      return;
    }

    // Definir los encabezados y el orden de las columnas explícitamente
    const headers = [
      'ID', 'Legajo', 'Nombre', 'Domicilio', 'Fecha Alta', 'CUIT', 'Categoría',
      'Presupuesto ($)', 'Presupuesto UVA ($)', 'Cuotas', 'Estado Crédito',
      'Importe Adeudado ($)', 'Importe Pagado ($)', 'Importe Vencido ($)',
      'Cuotas Pagadas', 'Cuotas Vencidas', 'Fecha Último Pago'
    ];

    const dataToExport = allCreditos.map(credito => {
      const rowData: { [key: string]: any } = {};
      rowData[headers[0]] = credito.id_credito_materiales;
      rowData[headers[1]] = credito.legajo;
      rowData[headers[2]] = credito.nombre || 'Sin nombre';
      rowData[headers[3]] = credito.domicilio;
      const parsedFechaAlta = parsePossibleDateString(credito.fecha_alta);
      rowData[headers[4]] = parsedFechaAlta ? parsedFechaAlta.toLocaleDateString('es-AR') : '';
      rowData[headers[5]] = credito.cuit_solicitante;
      rowData[headers[6]] = getCategoriaName(credito.cod_categoria);
      rowData[headers[7]] = credito.presupuesto; // Exportar como número
      rowData[headers[8]] = credito.presupuesto_uva; // Exportar como número
      rowData[headers[9]] = credito.cant_cuotas;
      rowData[headers[10]] = credito.baja ? 'BAJA' : 'VIGENTE';
      rowData[headers[11]] = credito.imp_adeudado ?? null; // null para celdas vacías, Excel lo maneja bien
      rowData[headers[12]] = credito.imp_pagado ?? null;
      rowData[headers[13]] = credito.imp_vencido ?? null;
      rowData[headers[14]] = credito.cuotas_pagadas ?? null;
      rowData[headers[15]] = credito.cuotas_vencidas ?? null;
      const parsedFechaUltimoPago = parsePossibleDateString(credito.fecha_ultimo_pago);
      rowData[headers[16]] = parsedFechaUltimoPago ? parsedFechaUltimoPago.toLocaleDateString('es-AR') : 'N/P';
      return headers.map(header => rowData[header]); // Devuelve un array de valores en el orden de los headers
    });

    // Crear la hoja de cálculo usando aoa_to_sheet para mantener el orden y manejar celdas vacías
    const worksheetData = [headers, ...dataToExport];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ajustar anchos de columnas (opcional pero recomendado)
    const colWidths = headers.map((header, i) => ({
      wch: Math.max(header.length, ...worksheetData.slice(1).map(dataRow => (dataRow[i]?.toString() ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Creditos_Completos');

    XLSX.writeFile(workbook, `ListadoCreditosCompleto_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns: GridColDef[] = [
    {
      field: 'legajo',
      headerName: 'Legajo',
      width: 60
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
      headerName: 'Alta',
      width: 90,
      renderCell: (params) => {
        const date = parsePossibleDateString(params.row.fecha_alta);
        return date ? date.toLocaleDateString('es-AR') : '';
      }
    },
    {
      field: 'cuit_solicitante',
      headerName: 'CUIT',
      width: 110
    },
    {
      field: 'cod_categoria',
      headerName: 'Categoría',
      width: 150,
      renderCell: (params) => {
        return getCategoriaName(params.row.cod_categoria);
      }
    },
    {
      field: 'presupuesto',
      headerName: 'Presupuesto',
      width: 120,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return `$${Number(params.row.presupuesto).toLocaleString('es-AR')}`;
      }
    },
    {
      field: 'presupuesto_uva',
      headerName: 'UVA (Presupuesto saldo inicial UVA)',
      width: 100,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return `$${Number(params.row.presupuesto_uva).toLocaleString('es-AR')}`;
      }
    },
    {
      field: 'cant_cuotas',
      headerName: 'Cuotas',
      width: 60,
      renderCell(params) {
        return `${params.row.cuotas_pagadas}/${params.row.cant_cuotas}`;
      }
    },
    {
      field: 'baja',
      headerName: 'Estado',
      width: 70,
      renderCell: (params) => {
        return (
          <span style={{
            color: params.row.baja ? '#d32f2f' : '#2e7d32',
            fontWeight: 'bold',
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
          }}>
            {params.row.baja ? '❌' : '✅'}
          </span>
        );
      }
    },
    {
      field: 'imp_adeudado',
      headerName: 'Adeudado',
      width: 120,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return params.row.imp_adeudado != null ? `$${Number(params.row.imp_adeudado).toLocaleString('es-AR')}` : 'N/A';
      }
    },
    {
      field: 'imp_vencido',
      headerName: 'Vencido',
      width: 110,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        return params.row.imp_vencido != null ? `$${Number(params.row.imp_vencido).toLocaleString('es-AR')}` : 'N/A';
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
            Créditos
          </Typography>
          <Box>
            <Tooltip title="Descargar listado filtrado en Excel" arrow sx={{ mr: 1 }}>
              <Button
                variant="outlined"
                color="success"
                onClick={handleExportToExcel}
                startIcon={<DownloadIcon />}
                sx={{ mr: 1 }}
              >
                Exportar
              </Button>
            </Tooltip>
            <Tooltip title="Descargar listado completo en Excel" arrow sx={{ mr: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleExportAllToExcel}
                startIcon={<DownloadIcon />}
                sx={{ mr: 1 }}
              >
                Exportar Todo
              </Button>
            </Tooltip>
            <Tooltip title="Actualizar valor UVA" arrow>
              <Button
                variant="outlined"
                color="info"
                onClick={handleOpenUvaModal}
                sx={{ mr: 1 }}
                disabled={loadingUva}
              >
                Actualizar UVA
              </Button>
            </Tooltip>
            {/* Modal para actualizar UVA */}
            <Dialog open={openUvaModal} onClose={handleCloseUvaModal} maxWidth="xs" fullWidth>
              <DialogTitle>Actualizar valor UVA</DialogTitle>
              <DialogContent>
                <TextField
                  label="Nuevo valor UVA"
                  value={nuevoValorUva}
                  onChange={e => setNuevoValorUva(e.target.value)}
                  type="number"
                  fullWidth
                  margin="normal"
                  disabled={loadingUva}
                />
                {loadingUva && (
                  <Box display="flex" alignItems="center" justifyContent="center" mt={2} mb={1}>
                    <CircularProgress size={28} sx={{ mr: 2 }} />
                    <Typography variant="body1">Se está ejecutando la operación, por favor espere...</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseUvaModal} disabled={loadingUva}>Cancelar</Button>
                <Button onClick={handleActualizarUva} variant="contained" color="primary" disabled={loadingUva}>
                  Actualizar
                </Button>
              </DialogActions>
            </Dialog>
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
