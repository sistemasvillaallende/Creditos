import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Grid
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

interface EditarCreditoProps {
  open: boolean;
  onClose: () => void;
  idCredito: number;
  onCreditoEditado: () => void;
}

export default function EditarCredito({ open, onClose, idCredito, onCreditoEditado }: EditarCreditoProps) {
  const { user } = useAuth();
  const [cuitOptions, setCuitOptions] = useState<BadecData[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  const handleCuitChange = (_: React.SyntheticEvent, newValue: BadecData | null) => {
    if (newValue) {
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
          setFormData({
            legajo: creditoData.legajo.toString(),
            domicilio: creditoData.domicilio,
            cuit_solicitante: creditoData.cuit_solicitante,
            garantes: creditoData.garantes,
            presupuesto: creditoData.presupuesto.toString(),
            presupuesto_uva: creditoData.presupuesto_uva.toString(),
            cant_cuotas: creditoData.cant_cuotas.toString(),
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
    fetchCreditoData();
  }, [idCredito]);

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

      await axios.put(
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

      Swal.fire({
        title: 'Éxito',
        text: 'El crédito ha sido actualizado correctamente',
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