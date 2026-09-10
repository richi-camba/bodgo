/**
 * Constantes del modelo de negocio BodGo.
 *
 * Los valores replican el prototipo de producto (Claude Design, ago-2026).
 * Cualquier cambio acá mueve plata real: tocar con cuidado y con test.
 */

/** Comisión que BodGo suma al arriendo que paga la PyME. */
export const PLATFORM_COMMISSION_RATE = 0.08;

/** Comisión que BodGo retiene del pago al bodeguero. */
export const HOST_COMMISSION_RATE = 0.15;

/**
 * Altura libre típica de una microbodega, en metros.
 * Se usa para el volumen bruto del recinto y para derivar el precio por m³.
 */
export const GROSS_HEIGHT_M = 2.5;

/**
 * Altura máxima de apilado seguro, en metros.
 * La capacidad *contratable* en m³ se calcula con esta altura, no con la del
 * recinto: nadie apila hasta el techo. 12 m² contratados = 21,6 m³ útiles.
 */
export const USABLE_STACK_HEIGHT_M = 1.8;

/** Días que usa el prorrateo mensual (mes comercial). */
export const BILLING_DAYS_PER_MONTH = 30;

/** Ventana para abrir un reclamo tras la recepción, en horas. */
export const CLAIM_WINDOW_HOURS = 48;

/** Cobertura del seguro de la red, por PyME, en CLP. */
export const INSURANCE_COVERAGE_CLP = 2_000_000;

/** Máximos de la carga masiva de inventario por CSV. */
export const CSV_MAX_ROWS = 500;
export const CSV_MAX_BYTES = 2 * 1024 * 1024;

/** Reintentos de cobro ante un pago rechazado. */
export const PAYMENT_MAX_ATTEMPTS = 3;
export const PAYMENT_RETRY_HOURS = 24;

/**
 * Bajo qué fracción del stock objetivo hay que reponer.
 *
 * Un tercio deja margen para que un envío llegue antes de quedarse en cero:
 * con reposiciones que tardan días, avisar recién al agotarse llega tarde.
 */
export const LOW_STOCK_RATIO = 0.3;
