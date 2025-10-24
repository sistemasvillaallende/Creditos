import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';
import { createAuditoriaData } from '../utils/auditoria';
import { useAuth } from '../contexts/AuthContext';

interface BadecData {
  nro_bad: number;
  nombre: string;
  nombre_calle: string;
  nro_dom: number;
  cuit: string;
}

interface CategoriaDeuda {
  cod_categoria: number;
  des_categoria: string;
  id_subrubro: number;
  tipo_deuda: number;
}

interface RubroCredito {
  cod_rubro: number;
  descripcion: string;
  rubro: string;
  id_subrubro: number;
  tipo_deuda: number;
}

interface RubroCredito {
  cod_rubro: number;
  descripcion: string;
  rubro: string;
  id_subrubro: number;
  tipo_deuda: number;
}

interface EditarCreditoProps {
  open: boolean;
  onClose: () => void;
  idCredito: number;
  onCreditoEditado: () => void;
}

export default function EditarCredito({ open, onClose, idCredito, onCreditoEditado }: EditarCreditoProps) {
  const { user } = useAuth();
  const [cuitOptions, setCuitOptions] = useState<BadecData[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDeuda[]>([]);
  const [rubros, setRubros] = useState<RubroCredito[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCuitOption, setSelectedCuitOption] = useState<BadecData | null>(null);
  const [formData, setFormData] = useState({
    legajo: '',
    domicilio: '',
    cuit_solicitante: '',
    garantes: '',
    presupuesto: '',
    presupuesto_uva: '',
    cant_cuotas: '',
    cod_categoria: '',
    cod_rubro: '',
    circunscripcion: '',
    seccion: '',
    manzana: '',
    parcela: '',
    p_h: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchBadecData = async (cuit: string) => {
    if (cuit.length < 3) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}Badec/GetBadecByCuit?cuit=${cuit}`
      );
      setCuitOptions(response.data);
    } catch (error) {
      console.error('Error al buscar CUIT:', error);
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

  const fetchRubros = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}CM_rubros_credito/GetRubros`
      );
      setRubros(response.data);
    } catch (error) {
      console.error('Error al cargar rubros:', error);
    }
  };

  const handleCuitChange = (_: React.SyntheticEvent, newValue: BadecData | null) => {
    if (newValue) {
      setSelectedCuitOption(newValue);
      setFormData({
        ...formData,
        cuit_solicitante: newValue.cuit,
        legajo: newValue.nro_bad.toString(),
        domicilio: `${newValue.nombre_calle} ${newValue.nro_dom}`
      });
    } else {
      setSelectedCuitOption(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cuit_solicitante) newErrors.cuit_solicitante = 'El CUIT es obligatorio';
    if (!formData.legajo) newErrors.legajo = 'El legajo es obligatorio';
    if (!formData.domicilio) newErrors.domicilio = 'El domicilio es obligatorio';
    if (!formData.garantes) newErrors.garantes = 'Los garantes son obligatorios';
    if (!formData.presupuesto) newErrors.presupuesto = 'El presupuesto es obligatorio';
    if (!formData.presupuesto_uva) newErrors.presupuesto_uva = 'El presupuesto UVA es obligatorio';
    if (!formData.cant_cuotas) newErrors.cant_cuotas = 'La cantidad de cuotas es obligatoria';
    // if (!formData.cod_categoria) newErrors.cod_categoria = 'La categoría es obligatoria'; // Campo no obligatorio
    if (!formData.cod_rubro) newErrors.cod_rubro = 'El rubro es obligatorio';
    if (!formData.circunscripcion) newErrors.circunscripcion = 'La circunscripción es obligatoria';
    if (!formData.seccion) newErrors.seccion = 'La sección es obligatoria';
    if (!formData.manzana) newErrors.manzana = 'La manzana es obligatoria';
    if (!formData.parcela) newErrors.parcela = 'La parcela es obligatoria';
    if (!formData.p_h) newErrors.p_h = 'El p_h es obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Cargar datos actuales del crédito
  useEffect(() => {
    const fetchCreditoData = async () => {
      if (idCredito) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/GetCreditoById?id_credito_materiales=${idCredito}`
          );
          const creditoData = response.data;

          // Buscar los datos del CUIT para establecer la opción seleccionada
          if (creditoData.cuit_solicitante) {
            try {
              const badecResponse = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}Badec/GetBadecByCuit?cuit=${creditoData.cuit_solicitante}`
              );
              if (badecResponse.data && badecResponse.data.length > 0) {
                setSelectedCuitOption(badecResponse.data[0]);
                setCuitOptions(badecResponse.data);
              }
            } catch (error) {
              console.error('Error al cargar datos del CUIT:', error);
            }
          }

          setFormData({
            legajo: creditoData.legajo.toString(),
            domicilio: creditoData.domicilio,
            cuit_solicitante: creditoData.cuit_solicitante,
            garantes: creditoData.garantes,
            presupuesto: creditoData.presupuesto.toString(),
            presupuesto_uva: creditoData.presupuesto_uva.toString(),
            cant_cuotas: creditoData.cant_cuotas.toString(),
            cod_categoria: creditoData.cod_categoria ? creditoData.cod_categoria.toString() : '',
            cod_rubro: creditoData.cod_rubro ? creditoData.cod_rubro.toString() : '',
            circunscripcion: creditoData.circunscripcion.toString(),
            seccion: creditoData.seccion.toString(),
            manzana: creditoData.manzana.toString(),
            parcela: creditoData.parcela.toString(),
            p_h: creditoData.p_h.toString()
          });
        } catch (error) {
          console.error('Error al cargar datos del crédito:', error);
        }
      }
    };

    if (open) {
      fetchCreditoData();
      fetchCategorias();
      fetchRubros();
    } else {
      // Limpiar estados cuando se cierre el modal
      setSelectedCuitOption(null);
      setCuitOptions([]);
      setFormData({
        legajo: '',
        domicilio: '',
        cuit_solicitante: '',
        garantes: '',
        presupuesto: '',
        presupuesto_uva: '',
        cant_cuotas: '',
        cod_categoria: '',
        cod_rubro: '',
        circunscripcion: '',
        seccion: '',
        manzana: '',
        parcela: '',
        p_h: ''
      });
      setErrors({});
    }
  }, [open, idCredito]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      // Obtener el nombre del solicitante
      let nombreSolicitante = '';
      try {
        const badecResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}Badec/GetBadecByCuit?cuit=${formData.cuit_solicitante}`
        );
        if (badecResponse.data && badecResponse.data.length > 0) {
          nombreSolicitante = badecResponse.data[0].nombre;
        }
      } catch (error) {
        console.error('Error al obtener nombre por CUIT:', error);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/UpdateCredito?legajo=${formData.legajo}&id_credito_materiales=${idCredito}`,
        {
          creditoMateriales: {
            id_credito_materiales: idCredito,
            legajo: parseInt(formData.legajo),
            domicilio: formData.domicilio,
            fecha_alta: new Date().toISOString(),
            baja: false,
            fecha_baja: null,
            cuit_solicitante: formData.cuit_solicitante,
            nombre: nombreSolicitante,
            garantes: formData.garantes,
            presupuesto: parseFloat(formData.presupuesto),
            presupuesto_uva: parseFloat(formData.presupuesto_uva),
            cant_cuotas: parseInt(formData.cant_cuotas),
            valor_cuota_uva: 0,
            id_uva: 0,
            id_estado: 0,
            per_ultimo: "string",
            con_deuda: 0,
            saldo_adeudado: 0,
            proximo_vencimiento: new Date().toISOString(),
            cod_categoria: formData.cod_categoria ? parseInt(formData.cod_categoria) : null,
            cod_rubro: parseInt(formData.cod_rubro),
            circunscripcion: parseInt(formData.circunscripcion),
            seccion: parseInt(formData.seccion),
            manzana: parseInt(formData.manzana),
            parcela: parseInt(formData.parcela),
            p_h: parseInt(formData.p_h)
          },
          auditoria: createAuditoriaData(
            'modificacion_credito',
            `Modificación del crédito ${idCredito}`,
            user?.nombre_completo || 'Usuario no identificado'
          )
        }
      );

      // Verificar si la respuesta contiene un mensaje específico
      const responseData = response.data;
      let successMessage = 'El crédito ha sido actualizado correctamente';

      if (responseData && responseData.message) {
        successMessage = responseData.message;
        if (responseData.nota) {
          successMessage += `\n\nNota: ${responseData.nota}`;
        }
      }

      Swal.fire({
        title: 'Éxito',
        text: successMessage,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      onCreditoEditado();
      onClose();
    } catch (error) {
      console.error('Error al actualizar el crédito:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al actualizar el crédito. Por favor, intente nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Crédito</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Autocomplete
            options={cuitOptions}
            value={selectedCuitOption}
            getOptionLabel={(option) => `${option.cuit} - ${option.nombre}`}
            isOptionEqualToValue={(option, value) => option.cuit === value.cuit}
            loading={loading}
            onInputChange={(_, newInputValue) => {
              fetchBadecData(newInputValue);
            }}
            onChange={handleCuitChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="CUIT Solicitante"
                margin="normal"
                fullWidth
                error={!!errors.cuit_solicitante}
                helperText={errors.cuit_solicitante}
              />
            )}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Legajo"
                value={formData.legajo}
                onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
                margin="normal"
                fullWidth
                error={!!errors.legajo}
                helperText={errors.legajo}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Domicilio"
                value={formData.domicilio}
                onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                margin="normal"
                fullWidth
                error={!!errors.domicilio}
                helperText={errors.domicilio}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Garantes"
                value={formData.garantes}
                onChange={(e) => setFormData({ ...formData, garantes: e.target.value })}
                margin="normal"
                fullWidth
                error={!!errors.garantes}
                helperText={errors.garantes}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.cod_categoria}
              >
                <InputLabel id="categoria-label">Categoría</InputLabel>
                <Select
                  labelId="categoria-label"
                  value={formData.cod_categoria}
                  label="Categoría"
                  onChange={(e) => setFormData({ ...formData, cod_categoria: e.target.value })}
                >
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.cod_categoria} value={categoria.cod_categoria.toString()}>
                      {categoria.des_categoria}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cod_categoria && (
                  <FormHelperText>{errors.cod_categoria}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.cod_rubro}
              >
                <InputLabel id="rubro-label">Rubro</InputLabel>
                <Select
                  labelId="rubro-label"
                  value={formData.cod_rubro}
                  label="Rubro"
                  onChange={(e) => setFormData({ ...formData, cod_rubro: e.target.value })}
                >
                  {rubros.map((rubro) => (
                    <MenuItem key={rubro.cod_rubro} value={rubro.cod_rubro.toString()}>
                      {rubro.rubro}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cod_rubro && (
                  <FormHelperText>{errors.cod_rubro}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Presupuesto"
                value={formData.presupuesto}
                onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.presupuesto}
                helperText={errors.presupuesto}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Presupuesto UVA"
                value={formData.presupuesto_uva}
                onChange={(e) => setFormData({ ...formData, presupuesto_uva: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.presupuesto_uva}
                helperText={errors.presupuesto_uva}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Cantidad de Cuotas"
                value={formData.cant_cuotas}
                onChange={(e) => setFormData({ ...formData, cant_cuotas: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.cant_cuotas}
                helperText={errors.cant_cuotas}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Circunscripción"
                value={formData.circunscripcion}
                onChange={(e) => setFormData({ ...formData, circunscripcion: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.circunscripcion}
                helperText={errors.circunscripcion}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Sección"
                value={formData.seccion}
                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.seccion}
                helperText={errors.seccion}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Manzana"
                value={formData.manzana}
                onChange={(e) => setFormData({ ...formData, manzana: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.manzana}
                helperText={errors.manzana}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Parcela"
                value={formData.parcela}
                onChange={(e) => setFormData({ ...formData, parcela: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.parcela}
                helperText={errors.parcela}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="P.H."
                value={formData.p_h}
                onChange={(e) => setFormData({ ...formData, p_h: e.target.value })}
                margin="normal"
                fullWidth
                type="number"
                error={!!errors.p_h}
                helperText={errors.p_h}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(e as any);
          }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
} 