/**
 * Las preguntas frecuentes, en un solo lugar y repartidas por audiencia.
 *
 * Las lee el acordeón y también el JSON-LD que ve Google: si vivieran en dos
 * archivos, tarde o temprano el buscador mostraría una respuesta que la página
 * ya no dice.
 *
 * El reparto importa. La portada muestra sólo lo que le sirve a cualquiera que
 * llega; lo de precios vive en /precios y lo de anfitriones en
 * /para-bodegueros, cerca de la decisión que cada uno está tomando.
 */
export type FaqTema = 'general' | 'pymes' | 'precios' | 'bodegueros';

export type Pregunta = { tema: FaqTema; q: string; a: string };

export const FAQ: Pregunta[] = [
  {
    tema: 'general',
    q: '¿Qué pasa si llega menos mercadería de la que declaré?',
    a: 'El bodeguero cuenta producto por producto contra tu manifiesto al recibir. Si algo no calza, se abre una discrepancia al instante, te llega el aviso con el detalle y el pago sigue retenido hasta que se resuelva.',
  },
  {
    tema: 'general',
    q: '¿Está asegurada mi mercadería?',
    a: 'Sí. Todo espacio publicado queda cubierto por el seguro de la red, que responde por robo e incendio hasta 2 millones de pesos por PyME.',
  },
  {
    tema: 'pymes',
    q: '¿Quién entrega los pedidos a mis compradores?',
    a: 'El courier que tú elijas: Chilexpress, Starken, Uber Flash o el que prefieras. El bodeguero prepara el pedido, tú registras con quién se despacha y el número de seguimiento, y el comprador recibe un enlace para seguirlo sin necesidad de crear una cuenta.',
  },
  {
    tema: 'pymes',
    q: '¿Puedo usar mis propios canales de venta?',
    a: 'Sí. Las ventas de Mercado Libre y Shopify entran a tu bandeja de pedidos, y también puedes crear despachos a mano desde la plataforma.',
  },
  {
    tema: 'precios',
    q: '¿Cómo se cobra el arriendo?',
    a: 'Se cobra por adelantado al contratar y el monto queda en custodia. Al bodeguero se le paga a fin de mes por los días efectivamente usados. Si terminas antes, te devolvemos la parte proporcional de los días que no ocupaste.',
  },
  {
    tema: 'precios',
    q: '¿Puedo guardar más volumen del que contraté?',
    a: 'La capacidad se mide en m³ apilables, no sólo en m². Al armar un envío te mostramos cuánto ocupa contra tu capacidad contratada. Si te pasas, puedes ampliar el contrato o dividir el envío; si llega igual, el bodeguero puede rechazar el excedente.',
  },
  {
    tema: 'precios',
    q: '¿Hay plazo mínimo o multa por irse?',
    a: 'No. El arriendo es mensual y puedes terminarlo cuando quieras. Se prorratea sobre un mes de 30 días: pagas los días que usaste y el resto vuelve a tu tarjeta en 3 a 5 días hábiles.',
  },
  {
    tema: 'bodegueros',
    q: '¿Qué necesito para publicar mi espacio?',
    a: 'Entre 8 y 15 m² libres con acceso independiente, piso despejado, cierre seguro y extintor al día. Publicas el aviso, un evaluador de BodGo agenda una visita de habilitación en 3 a 5 días hábiles y verifica el checklist antes de que aparezca en la red. No hay costo de inscripción.',
  },
  {
    tema: 'bodegueros',
    q: '¿Cuándo y cómo me pagan?',
    a: 'A fin de mes, por transferencia a tu cuenta bancaria, el arriendo del periodo neto del 15% de comisión. El dinero de la PyME ya está retenido desde que contrató, así que no dependes de que te pague nadie.',
  },
  {
    tema: 'bodegueros',
    q: '¿Respondo yo si le pasa algo a la mercadería?',
    a: 'No con tu patrimonio. El seguro de la red cubre robo e incendio hasta 2 millones por PyME. Lo que sí te corresponde es contar bien lo que recibes: esa verificación es la que protege a las dos partes.',
  },
];

/**
 * Las preguntas de los temas pedidos, en el orden en que se piden.
 *
 * El orden importa: en /precios lo primero que se abre tiene que ser una
 * pregunta sobre el precio, no la genérica del seguro.
 */
export const preguntasDe = (...temas: FaqTema[]): Pregunta[] =>
  temas.flatMap((tema) => FAQ.filter((p) => p.tema === tema));
