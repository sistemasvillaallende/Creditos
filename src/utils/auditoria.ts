export interface AuditoriaData {
  id_auditoria: number;
  fecha: string;
  usuario: string;
  proceso: string;
  identificacion: string;
  autorizaciones: string;
  observaciones: string;
  detalle: string;
  ip: string;
}

export const createAuditoriaData = (
  proceso: string,
  observaciones: string = '',
  nombreUsuario: string
): AuditoriaData => {
  return {
    id_auditoria: 0,
    fecha: new Date().toISOString(),
    usuario: nombreUsuario,
    proceso,
    identificacion: 'web',
    autorizaciones: '',
    observaciones,
    detalle: '',
    ip: ''
  };
}; 