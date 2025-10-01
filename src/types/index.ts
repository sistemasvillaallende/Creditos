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