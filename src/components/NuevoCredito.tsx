import { useState, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
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

interface NuevoCreditoProps {
  open: boolean;
  onClose: () => void;
  onCreditoCreado: () => void;
}

const initialFormData = {
  legajo: '',
  domicilio: '',
  cuit_solicitante: '',
  garantes: '',
  presupuesto: '',
  presupuesto_uva: '',
  cant_cuotas: '',
  circunscripcion: '',
  seccion: '',
  manzana: '',
  parcela: '',
  p_h: '',
  cod_categoria: ''
};

function NuevoCredito({ open, onClose, onCreditoCreado }: NuevoCreditoProps) {
  const { user } = useAuth();
  const [cuitOptions, setCuitOptions] = useState<BadecData[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDeuda[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valorUva, setValorUva] = useState<number>(0);
  const [selectedNombre, setSelectedNombre] = useState('');

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

  const handleCuitChange = (_: React.SyntheticEvent, newValue: BadecData | null) => {
    if (newValue) {
      setSelectedNombre(newValue.nombre);
      setFormData({
        ...formData,
        cuit_solicitante: newValue.cuit,
        legajo: newValue.nro_bad.toString(),
        domicilio: `${newValue.nombre_calle} ${newValue.nro_dom}`
      });
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
    if (!formData.cod_categoria) newErrors.cod_categoria = 'La categoría es obligatoria';
    if (!formData.circunscripcion) newErrors.circunscripcion = 'La circunscripción es obligatoria';
    if (!formData.seccion) newErrors.seccion = 'La sección es obligatoria';
    if (!formData.manzana) newErrors.manzana = 'La manzana es obligatoria';
    if (!formData.parcela) newErrors.parcela = 'La parcela es obligatoria';
    if (!formData.p_h) newErrors.p_h = 'El P.H. es obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/InsertNuevoCredito`,
        {
          creditoMateriales: {
            id_credito_materiales: 0,
            legajo: parseInt(formData.legajo),
            domicilio: formData.domicilio,
            baja: false,
            cuit_solicitante: formData.cuit_solicitante,
            nombre: selectedNombre,
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
            cod_categoria: parseInt(formData.cod_categoria),
            circunscripcion: parseInt(formData.circunscripcion),
            seccion: parseInt(formData.seccion),
            manzana: parseInt(formData.manzana),
            parcela: parseInt(formData.parcela),
            p_h: parseInt(formData.p_h)
          },
          auditoria: createAuditoriaData(
            'alta_credito',
            'Alta de nuevo crédito',
            user?.nombre_completo || 'Usuario no identificado'
          )
        }
      );

      Swal.fire({
        title: 'Éxito',
        text: 'El crédito ha sido creado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      setFormData(initialFormData);
      setCuitOptions([]);
      setErrors({});

      onCreditoCreado();
      onClose();
    } catch (error) {
      console.error('Error al crear crédito:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al crear el crédito. Por favor, intente nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  useEffect(() => {
    const fetchValorUva = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}CM_UVA/GetValorUva`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          setValorUva(response.data[0].valor_uva);
        }
      } catch (error) {
        console.error('Error al obtener valor UVA:', error);
      }
    };

    fetchValorUva();
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (formData.presupuesto && valorUva) {
      const presupuestoUva = Number(formData.presupuesto) / valorUva;
      setFormData(prev => ({
        ...prev,
        presupuesto_uva: presupuestoUva.toFixed(2)
      }));
    }
  }, [formData.presupuesto, valorUva]);

  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setCuitOptions([]);
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disablePortal={false}
      keepMounted={false}
      aria-modal={true}
    >
      <DialogTitle>Nuevo Crédito</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={cuitOptions}
          getOptionLabel={(option) => `${option.cuit} - ${option.nombre}`}
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
        <TextField
          label="Legajo"
          value={formData.legajo}
          onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
          margin="normal"
          fullWidth
          error={!!errors.legajo}
          helperText={errors.legajo}
        />
        <TextField
          label="Domicilio"
          value={formData.domicilio}
          onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
          margin="normal"
          fullWidth
          error={!!errors.domicilio}
          helperText={errors.domicilio}
        />
        <TextField
          label="Garantes"
          value={formData.garantes}
          onChange={(e) => setFormData({ ...formData, garantes: e.target.value })}
          margin="normal"
          fullWidth
          error={!!errors.garantes}
          helperText={errors.garantes}
        />
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
        <TextField
          label="Presupuesto UVA (saldo inicial UVA)"
          value={valorUva}
          margin="normal"
          fullWidth
          disabled
          helperText={`Valor UVA actual: $${valorUva.toLocaleString('es-AR')}`}
        />
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
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Nomenclatura Catastral
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          variant="contained"
          color="primary"
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NuevoCredito; 