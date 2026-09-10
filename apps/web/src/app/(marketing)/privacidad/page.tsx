import type { Metadata } from 'next';
import { Bullets, Clause, LegalPage } from '@/components/marketing/legal';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Qué datos guarda BodGo, para qué los usa, con quién los comparte y cómo ejercer tus derechos según la Ley 19.628.',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      updated="septiembre de 2026"
      intro="Qué datos guardamos, para qué los usamos y qué puedes pedirnos. Escrito según la Ley 19.628 sobre protección de la vida privada."
    >
      <Clause title="Quién trata tus datos">
        <p>
          Tamayaz SpA, con domicilio en Santiago de Chile, es responsable del tratamiento. Puedes
          contactarnos en{' '}
          <a href="mailto:hola@bodgo.cl" className="font-bold text-brand-600 hover:underline">
            hola@bodgo.cl
          </a>
          .
        </p>
      </Clause>

      <Clause title="Qué datos guardamos">
        <p>Sólo lo necesario para que la plataforma funcione:</p>
        <Bullets
          items={[
            'De tu cuenta: nombre, correo, teléfono y contraseña (cifrada, nunca en texto plano).',
            'De tu negocio o espacio: razón social, RUT, giro, comuna y dirección.',
            'De tu operación: productos, inventario, contratos, envíos, pedidos y mensajes con tu contraparte.',
            'De tus pagos: marca de la tarjeta y últimos cuatro dígitos. El número completo lo maneja el procesador de pagos; nosotros no lo vemos ni lo guardamos.',
            'Fotos de respaldo: bultos al despachar, mercadería al recibir, comprobantes de courier.',
            'Datos técnicos mínimos: dirección IP y registros de acceso, para seguridad.',
          ]}
        />
      </Clause>

      <Clause title="Para qué los usamos">
        <Bullets
          items={[
            'Operar el servicio: contratar espacios, mover inventario, procesar pagos y despachos.',
            'Resolver diferencias entre una PyME y un bodeguero, cuando lo recibido no coincide con lo declarado.',
            'Avisarte de lo que le pasa a tu operación: pagos, recepciones, cambios de estado.',
            'Cumplir obligaciones legales y tributarias.',
          ]}
        />
        <p>
          No vendemos tus datos, no los cedemos con fines publicitarios y no los usamos para
          perfilarte.
        </p>
      </Clause>

      <Clause title="Con quién se comparten">
        <p>Sólo con quien hace falta para que la operación funcione:</p>
        <Bullets
          items={[
            'Tu contraparte en un contrato: el bodeguero ve el contacto de la PyME cuya mercadería guarda, y la PyME ve el del bodeguero. Nada más.',
            'El comprador de un pedido recibe un enlace de seguimiento con el estado de su envío. No accede a datos de la PyME ni a la dirección de la bodega.',
            'Nuestros proveedores de infraestructura: Supabase (base de datos, alojada en São Paulo) y Vercel (aplicación).',
            'El procesador de pagos, para cobrar y devolver.',
            'Autoridades, cuando una ley o una resolución judicial lo exija.',
          ]}
        />
      </Clause>

      <Clause title="Qué NO mostramos">
        <p>La plataforma está construida para que cierta información no circule:</p>
        <Bullets
          items={[
            'La dirección exacta de una microbodega sólo aparece con el contrato firmado. En el buscador se ve el sector.',
            'El costo real que una PyME pagó al courier no viaja al comprador.',
            'Los datos de contacto de un bodeguero no son visibles para PyMEs sin contrato vigente con él.',
          ]}
        />
      </Clause>

      <Clause title="Cuánto tiempo los guardamos">
        <p>
          Mientras tengas cuenta activa. Al cerrarla, borramos tus datos personales dentro de 30
          días, salvo lo que debamos conservar por obligación legal —registros tributarios y de
          operaciones, por hasta 6 años— y lo necesario para cerrar una discrepancia en curso.
        </p>
      </Clause>

      <Clause title="Tus derechos">
        <p>
          La Ley 19.628 te reconoce derechos de acceso, rectificación, cancelación y oposición
          sobre tus datos. Puedes ejercerlos escribiendo a{' '}
          <a href="mailto:hola@bodgo.cl" className="font-bold text-brand-600 hover:underline">
            hola@bodgo.cl
          </a>{' '}
          desde el correo de tu cuenta. Respondemos dentro de 10 días hábiles.
        </p>
        <p>
          Puedes pedirnos una copia de todo lo que tenemos sobre ti, corregir lo que esté mal o
          pedir que lo borremos.
        </p>
      </Clause>

      <Clause title="Cookies">
        <p>
          Usamos sólo las cookies necesarias para mantener tu sesión abierta. No hay cookies de
          publicidad ni de seguimiento de terceros, y por eso tampoco te mostramos un banner
          pidiéndote permiso para algo que no hacemos.
        </p>
      </Clause>

      <Clause title="Seguridad">
        <p>
          Las contraseñas se guardan cifradas. El acceso a los datos está restringido fila por fila
          en la base: cada cuenta sólo alcanza lo suyo, y esa restricción se aplica en el servidor,
          no en el navegador. Las fotos de respaldo viven en almacenamiento privado.
        </p>
        <p>
          Si ocurriera una brecha que afecte tus datos, te avisaremos y notificaremos a la
          autoridad competente.
        </p>
      </Clause>

      <Clause title="Cambios">
        <p>
          Si cambiamos esta política de forma relevante, te avisamos por correo antes de que entre
          en vigor.
        </p>
      </Clause>
    </LegalPage>
  );
}
