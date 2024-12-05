import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface NuevoCreditoProps {
  open: boolean;
  onClose: () => void;
  onCreditoCreado: () => void;
}

function NuevoCredito({ open, onClose, onCreditoCreado }: NuevoCreditoProps) {
  const [formData, setFormData] = useState({
    legajo: '',
    domicilio: '',
    cuit_solicitante: '',
    garantes: '',
    presupuesto: '',
    cant_cuotas: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        creditoMateriales: {
          id_credito_materiales: 0,
          legajo: parseInt(formData.legajo),
          domicilio: formData.domicilio,
          baja: false,
          cuit_solicitante: formData.cuit_solicitante,
          garantes: formData.garantes,
          presupuesto: parseFloat(formData.presupuesto),
          presupuesto_uva: parseFloat(formData.presupuesto) * 1.2, // Ejemplo
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
          fecha: "string",
          usuario: "string",
          proceso: "string",
          identificacion: "string",
          autorizaciones: "string",
          observaciones: "string",
          detalle: "string",
          ip: "string"
        }
      };

      await axios.post(
        'http://10.0.0.24/webapicreditos24/CM_Credito_materiales/InsertNuevoCredito',
        payload
      );
      
      onCreditoCreado();
      onClose();
    } catch (error) {
      console.error('Error al crear el crédito:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Nuevo Crédito
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Legajo"
              name="legajo"
              value={formData.legajo}
              onChange={handleChange}
              required
              type="number"
            />
            <TextField
              label="Domicilio"
              name="domicilio"
              value={formData.domicilio}
              onChange={handleChange}
              required
            />
            <TextField
              label="CUIT Solicitante"
              name="cuit_solicitante"
              value={formData.cuit_solicitante}
              onChange={handleChange}
              required
            />
            <TextField
              label="Garantes"
              name="garantes"
              value={formData.garantes}
              onChange={handleChange}
              required
            />
            <TextField
              label="Presupuesto"
              name="presupuesto"
              value={formData.presupuesto}
              onChange={handleChange}
              required
              type="number"
            />
            <TextField
              label="Cantidad de Cuotas"
              name="cant_cuotas"
              value={formData.cant_cuotas}
              onChange={handleChange}
              required
              type="number"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default NuevoCredito; 