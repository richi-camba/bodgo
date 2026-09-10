import type { Metadata } from 'next';
import { Bullets, Clause, LegalPage } from '@/components/marketing/legal';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Cómo funciona el servicio de BodGo, qué hace cada parte y cómo se maneja el dinero.',
  alternates: { canonical: '/terminos' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      updated="septiembre de 2026"
      intro="Estas condiciones rigen el uso de BodGo, la plataforma operada por Tamayaz SpA que conecta a PyMEs que necesitan almacenar con personas que tienen espacio disponible. Están escritas para que se entiendan; si algo no queda claro, escríbenos antes de aceptar."
    >
      <Clause title="1. Qué es BodGo y qué no es">
        <p>
          BodGo es una plataforma de intermediación. Ponemos en contacto a una PyME con un
          bodeguero, damos las herramientas para gestionar el inventario y los despachos, y
          administramos el pago entre ambos.
        </p>
        <p>
          <strong className="font-bold text-navy-900">BodGo no es el depositario de tu mercadería.</strong>{' '}
          Quien la guarda es el bodeguero, en su propio espacio. Tampoco somos el transportista: el
          despacho al comprador final lo hace el courier que la PyME contrate.
        </p>
      </Clause>

      <Clause title="2. Cuentas">
        <p>
          Para usar la plataforma necesitas una cuenta y ser mayor de 18 años. Los datos que
          registres deben ser verdaderos y mantenerse al día; si operas a nombre de una empresa,
          declaras tener facultades para obligarla.
        </p>
        <p>
          Eres responsable de tu contraseña y de lo que ocurra con tu cuenta. Si crees que alguien
          más entró, avísanos de inmediato.
        </p>
      </Clause>

      <Clause title="3. Contratación de un espacio">
        <p>
          La PyME contrata una cantidad de metros cuadrados en una microbodega, por mes. El precio
          que ve incluye el arriendo que fija el bodeguero más una comisión de plataforma del 8%.
        </p>
        <p>
          Los metros cuadrados se traducen a una capacidad en metros cúbicos, calculada apilando
          hasta 1,8 metros de altura. Esa capacidad es el límite de lo que se puede almacenar, y la
          plataforma la verifica en cada envío.
        </p>
      </Clause>

      <Clause title="4. Pago en custodia">
        <p>
          El arriendo se cobra por adelantado y queda retenido por BodGo. No se libera al bodeguero
          hasta que confirma haber recibido la mercadería y que coincide con lo declarado.
        </p>
        <p>
          Al bodeguero se le liquida a fin de mes, neto de una comisión del 15% sobre el arriendo.
          Si hay una discrepancia abierta, el pago sigue retenido hasta que se resuelva.
        </p>
      </Clause>

      <Clause title="5. Término anticipado">
        <p>
          La PyME puede terminar el contrato cuando quiera. Se prorratea sobre un mes de 30 días:
          el bodeguero cobra los días efectivamente usados y el resto se devuelve desde la
          custodia, en un plazo de 3 a 5 días hábiles.
        </p>
      </Clause>

      <Clause title="6. Envíos, recepción y diferencias">
        <p>
          Cada envío a bodega lleva un manifiesto con los SKUs y las cantidades que la PyME declara.
          Al recibir, el bodeguero cuenta producto por producto, mide el volumen y deja registro
          fotográfico.
        </p>
        <p>
          Si lo recibido no coincide con lo declarado —en unidades o en volumen— se abre una
          discrepancia, se notifica a la PyME y el pago permanece retenido. El inventario se
          actualiza con lo efectivamente recibido, nunca con lo declarado.
        </p>
        <p>
          Los reclamos por faltantes o daños deben abrirse dentro de las 48 horas siguientes a la
          recepción.
        </p>
      </Clause>

      <Clause title="7. Qué no se puede almacenar">
        <p>Queda prohibido guardar en la red:</p>
        <Bullets
          items={[
            'Sustancias inflamables, explosivas, corrosivas o tóxicas.',
            'Armas, municiones o elementos de uso restringido.',
            'Drogas, medicamentos que requieran receta retenida o precursores químicos.',
            'Alimentos perecibles que necesiten refrigeración, salvo que el espacio la ofrezca.',
            'Seres vivos, animales o restos biológicos.',
            'Bienes de procedencia ilícita, falsificados o cuya tenencia esté prohibida.',
            'Dinero en efectivo, joyas, obras de arte u otros bienes de alto valor unitario.',
          ]}
        />
        <p>
          El bodeguero puede rechazar mercadería que caiga en estas categorías, y BodGo puede
          terminar el contrato sin devolución si se detecta después.
        </p>
      </Clause>

      <Clause title="8. Seguro y límites de responsabilidad">
        <p>
          La mercadería almacenada en espacios publicados está cubierta por el seguro de la red por
          robo e incendio, hasta 2 millones de pesos por PyME. La cobertura no alcanza a los bienes
          del punto 7, ni a daños por embalaje inadecuado, vicio propio del producto o caso
          fortuito ajeno a esas causas.
        </p>
        <p>
          Fuera de esa cobertura, la responsabilidad de BodGo frente a cualquier reclamo se limita
          al total de comisiones que hayas pagado en los últimos 3 meses. No respondemos por lucro
          cesante ni por daños indirectos.
        </p>
      </Clause>

      <Clause title="9. Obligaciones del bodeguero">
        <Bullets
          items={[
            'Mantener el espacio en las condiciones que se verificaron en la visita de habilitación.',
            'Contar y verificar cada recepción contra el manifiesto, con registro fotográfico.',
            'Preparar los pedidos dentro de los plazos acordados.',
            'No abrir, usar ni disponer de la mercadería para ningún fin distinto del acordado.',
            'Dar acceso a la PyME en el horario publicado.',
          ]}
        />
      </Clause>

      <Clause title="10. Suspensión y término">
        <p>
          Podemos suspender o cerrar una cuenta que incumpla estas condiciones, que use la
          plataforma para actividades ilícitas o que ponga en riesgo a otros usuarios de la red. Si
          hay dinero en custodia al momento del cierre, se resuelve según los puntos 4 y 5.
        </p>
      </Clause>

      <Clause title="11. Cambios">
        <p>
          Podemos modificar estas condiciones. Si el cambio es relevante, te avisamos por correo con
          al menos 15 días de anticipación. Seguir usando la plataforma después de esa fecha
          significa que aceptas la nueva versión.
        </p>
      </Clause>

      <Clause title="12. Ley aplicable">
        <p>
          Estas condiciones se rigen por la ley chilena. Cualquier controversia se somete a los
          tribunales ordinarios de Santiago, sin perjuicio de los derechos que la Ley 19.496 sobre
          protección de los derechos de los consumidores reconozca a quien corresponda.
        </p>
        <p className="text-[13.5px] text-ink-500">
          Tamayaz SpA · Santiago, Chile · hola@bodgo.cl
        </p>
      </Clause>
    </LegalPage>
  );
}
