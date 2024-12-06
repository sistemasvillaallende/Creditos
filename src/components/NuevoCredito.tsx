import { useState, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import axios from 'axios';

interface BadecData {
  nro_bad: number;
  nombre: string;
  nombre_calle: string;
  nro_dom: number;
  cuit: string;
}

interface NuevoCreditoProps {
  open: boolean;
  onClose: () => void;
}

function NuevoCredito({ open, onClose }: NuevoCreditoProps) {
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

  const handleCuitChange = (event: any, newValue: BadecData | null) => {
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const creditoData = {
        creditoMateriales: {
          id_credito_materiales: 0,
          legajo: parseInt(formData.legajo),
          domicilio: formData.domicilio,
          baja: false,
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
          proximo_vencimiento: new Date().toISOString()
        },
        auditoria: {
          id_auditoria: 0,
          fecha: new Date().toISOString(),
          usuario: "string",
          proceso: "string",
          identificacion: "string",
          autorizaciones: "string",
          observaciones: "string",
          detalle: "string",
          ip: "string"
        }
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}CM_Credito_materiales/InsertNuevoCredito`, creditoData);
      onClose();
    } catch (error) {
      console.error('Error al crear crédito:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo Crédito</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={cuitOptions}
          getOptionLabel={(option) => `${option.cuit} - ${option.nombre}`}
          loading={loading}
          onInputChange={(event, newInputValue) => {
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

export default NuevoCredito; 