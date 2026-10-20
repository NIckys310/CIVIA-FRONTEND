# CIVIA — Frontend

Interfaz de **CIVIA AI · Arquitectura inteligente**: aplicación web instalable (PWA) para
escritorio, tableta y móvil, con estética de lujo derivada del logo (negro profundo, cristal
cromado, resplandor ámbar y acero azulado).

> Toda salida de CIVIA requiere revisión y aprobación del profesional responsable.

| Repositorio | Contenido | Tecnología |
|---|---|---|
| [CIVIA-FRONTEND](https://github.com/NIckys310/CIVIA-FRONTEND) | Interfaz web (PWA, escritorio y móvil) y su servidor | HTML/CSS/JS + Three.js · servidor Java 21 |
| [CIVIA-BACKEND](https://github.com/NIckys310/CIVIA-BACKEND) | API, CIVIA Auth, base de datos, archivos | Java 21 · Spring Boot 3.5 · H2/PostgreSQL |
| [CIVIA-IA](https://github.com/NIckys310/CIVIA-IA) | Copilot, análisis de planos y modelos 3D, biblioteca | Java 21 · Claude (opcional) + motor local |

## Qué incluye

- **Proyectos:** revisión de la IA ("lo que hace falta"), fases, archivos con versiones y vista
  previa, kanban de tareas, presupuesto con AIU y exportación CSV, programa de espacios, equipo y bitácora.
- **Planos:** subida de PDF, DWG, DXF e imágenes; análisis con IA (escala, norte, rótulo, cotas,
  niveles, ejes, áreas, vanos, escaleras, accesibilidad…).
- **Modelado 3D (Three.js):** GLB, glTF, OBJ y STL con sombras, medición, notas ancladas, corte de
  sección, estudio solar, captura, análisis con IA y **volumetría con IA** exportable a GLB.
- **Cámara:** fotos de obra con ubicación opcional, fotos de planos con análisis inmediato y
  medición con objeto de referencia.
- **CIVIA Copilot:** responde en tiempo real (streaming) como un experto en ingeniería civil, con
  contexto del proyecto, planos adjuntos y fuentes citadas. Detener, regenerar, copiar y valorar
  respuestas; historial con búsqueda, fijadas, renombrar, exportar a Markdown y borrar.
- **Biblioteca de ingeniería civil:** una sola pregunta → respuesta con citas; 19 categorías
  (geotecnia, hidráulica, vías, topografía, puentes, seguridad en obra…), 144 artículos, 265
  términos, artículo del día, búsquedas recientes, glosario por área y artículos propios editables.
- **Seguridad de la cuenta:** contraseña sin límite de longitud, verificación en dos pasos, sesiones activas.

## Movimiento y efectos

Discretos y coherentes con la marca (líneas de plano, brillo dorado), en `js/motion.js` y la
sección *movimiento* de `css/app.css`:

- Entrada escalonada de tarjetas, transición entre secciones e indicador deslizante del menú.
- Onda dorada al pulsar, brillo que sigue al cursor en las tarjetas y hundimiento al presionar.
- Portadas de proyecto que se dibujan trazo a trazo, cifras que cuentan desde cero, barras y
  anillos que se llenan.
- Chat con cursor de escritura, mensajes que entran desde su lado y botón para volver al final.
- Avisos con cuenta regresiva, diálogos y paneles con animación de salida, cambio de tema en
  círculo y vibración corta en el móvil.
- Todo se desactiva con "reducir movimiento" del sistema operativo.

## Estructura

```
web/                 Interfaz (sin paso de compilación)
  index.html         Shell + splash
  css/app.css        Sistema visual (temas oscuro/claro)
  js/app.js          Arranque, sesión, enrutador, navegación
  js/api.js          Cliente de la API (token en memoria, refresco de vuelo único)
  js/ui.js           Plantillas seguras (escape automático), íconos, Markdown seguro, modales
  js/motion.js       Efectos de movimiento (respetan "reducir movimiento")
  js/views/*.js      Vistas cargadas bajo demanda
  vendor/three/      Three.js r170 local (sin CDN)
  sw.js              Service worker (nunca cachea /api)
server/CiviaWeb.java Servidor estático + proxy de la API (solo JDK 21)
```

## Puesta en marcha

Lo más simple es arrancar [CIVIA-BACKEND](https://github.com/NIckys310/CIVIA-BACKEND), que ya sirve
esta interfaz en `http://localhost:8080`. Para servirla por separado:

```bash
java server/CiviaWeb.java --port 3000 --api http://localhost:8080
```

La cámara necesita HTTPS (o `localhost`) y permiso del navegador.

[Arquitectura](docs/architecture.md) · [Despliegue](docs/guides/deploy.md) ·
[Cómo contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md)
