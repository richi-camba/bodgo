import { ImageResponse } from 'next/og';

export const alt = 'BodGo · Red de microbodegas urbanas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Tarjeta que se ve al compartir el enlace en WhatsApp, LinkedIn o Slack.
 *
 * Se dibuja en el servidor con las mismas piezas de la marca —el isotipo, el
 * navy, el azul del acento— en vez de mandar una captura de la portada, que
 * quedaría ilegible al tamaño de una miniatura.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0F2742',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Resplandor de acento, igual que el del hero. */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -140,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: '#2C72B7',
            opacity: 0.28,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
            <path d="M12 1.8l8.8 5.1v10.2L12 22.2l-8.8-5.1V6.9z" fill="#fff" />
            <circle cx="12" cy="12" r="3.1" fill="#0F2742" />
          </svg>
          <span style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
            Bod<span style={{ color: '#7FB3E6' }}>Go</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 3,
              color: '#7FB3E6',
              textTransform: 'uppercase',
            }}
          >
            Chile · Red de microbodegas urbanas
          </span>
          <span
            style={{
              marginTop: 22,
              fontSize: 76,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 900,
            }}
          >
            Tu inventario, más cerca de tus clientes
          </span>
        </div>

        <div style={{ display: 'flex', gap: 56 }}>
          {[
            ['Pago en custodia', 'hasta confirmar la recepción'],
            ['Seguro incluido', 'robo e incendio'],
            ['Sin bodega propia', 'pagas por m² y por mes'],
          ].map(([title, detail]) => (
            <div key={title} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{title}</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                {detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
