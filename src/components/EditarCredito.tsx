import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete
} from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';

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
  legajo: number;
  onCreditoEditado: () => void;
}

export default function EditarCredito({ open, onClose, idCredito, legajo, onCreditoEditado }: EditarCreditoProps) {
  const [cuitOptions, setCuitOptions] = useState<BadecData[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    legajo: '',
    domicilio: '',
    cuit_solicitante: '',
    garantes: '',
    presupuesto: '',
    presupuesto_uva: '',
    cant_cuotas: ''
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
            cant_cuotas: creditoData.cant_cuotas.toString()
          });
        } catch (error) {
          console.error('Error al cargar datos del crédito:', error);
        }
      }
    };
    fetchCreditoData();
  }, [idCredito]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        creditoMateriales: {
          id_credito_materiales: idCredito,
          legajo: parseInt(formData.legajo),
          domicilio: formData.domicilio,
          cuit_solicitante: formData.cuit_solicitante,
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
          baja: false,
          fecha_baja: null,
          fecha_alta: new Date().toISOString()
        },
        auditoria: {
          id_auditoria: 0,
          fecha: new Date().toISOString(),
          usuario: "sistema",
          proceso: "actualización",
          identificacion: "web",
          autorizaciones: "",
          observaciones: "",
          detalle: "",
          ip: ""
        }
      };

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/UpdateCredito?legajo=${legajo}&id_credito_materiales=${idCredito}`,
        payload
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
          margin="normal"
          fullWidth
          disabled
          error={!!errors.legajo}
          helperText={errors.legajo}
        />
        <TextField
          label="Domicilio"
          value={formData.domicilio}
          margin="normal"
          fullWidth
          disabled
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
          label="Presupuesto UVA"
          value={formData.presupuesto_uva}
          onChange={(e) => setFormData({ ...formData, presupuesto_uva: e.target.value })}
          margin="normal"
          fullWidth
          type="number"
          error={!!errors.presupuesto_uva}
          helperText={errors.presupuesto_uva}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
} 