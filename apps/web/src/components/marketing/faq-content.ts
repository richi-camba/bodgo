/**
 * Las preguntas frecuentes, en un solo lugar.
 *
 * Las lee el acordeón de la portada y también el JSON-LD que ve Google: si
 * vivieran en dos archivos, tarde o temprano el buscador mostraría una
 * respuesta que la página ya no dice.
 */
export const FAQ = [
  {
    q: '¿Cómo se cobra el arriendo?',
    a: 'Se cobra por adelantado al contratar y el monto queda en custodia. Al bodeguero se le paga a fin de mes por los días efectivamente usados. Si terminas antes, te devolvemos la parte proporcional de los días que no ocupaste.',
  },
  {
    q: '¿Qué pasa si llega menos mercadería de la que declaré?',
    a: 'El bodeguero cuenta producto por producto contra tu manifiesto al recibir. Si algo no calza, se abre una discrepancia al instante, te llega el aviso con el detalle y el pago sigue retenido hasta que se resuelva.',
  },
  {
    q: '¿Puedo guardar más volumen del que contraté?',
    a: 'La capacidad se mide en m³ apilables, no sólo en m². Al armar un envío te mostramos cuánto ocupa contra tu capacidad contratada. Si te pasas, puedes ampliar el contrato o dividir el envío; si llega igual, el bodeguero puede rechazar el excedente.',
  },
  {
    q: '¿Está asegurada mi mercadería?',
    a: 'Sí. Todo espacio publicado queda cubierto por el seguro de la red, que responde por robo e incendio hasta 2 millones de pesos por PyME.',
  },
  {
    q: '¿Quién entrega los pedidos a mis compradores?',
    a: 'El courier que tú elijas: Chilexpress, Starken, Uber Flash o el que prefieras. El bodeguero prepara el pedido, tú registras con quién se despacha y el número de seguimiento, y el comprador recibe un enlace para seguirlo sin necesidad de crear una cuenta.',
  },
  {
    q: '¿Qué necesito para publicar mi espacio como bodeguero?',
    a: 'Un espacio despejado con acceso independiente y cierre seguro. Publicas el aviso, un evaluador de BodGo agenda una visita de habilitación en 3 a 5 días hábiles y verifica el checklist antes de que aparezca en la red. No hay costo de inscripción.',
  },
  {
    q: '¿Puedo usar mis propios canales de venta?',
    a: 'Sí. Las ventas de Mercado Libre y Shopify entran a tu bandeja de pedidos, y también puedes crear despachos a mano desde la plataforma.',
  },
] as const;
