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
- **CIVIA Copilot:** chat con contexto del proyecto y planos adjuntos, fuentes citadas.
- **Biblioteca:** una sola pregunta → respuesta con citas; 13 categorías, artículos, glosario A–Z, favoritos.
- **Seguridad de la cuenta:** contraseña sin límite de longitud, verificación en dos pasos, sesiones activas.

## Estructura

```
web/                 Interfaz (sin paso de compilación)
  index.html         Shell + splash
  css/app.css        Sistema visual (temas oscuro/claro)
  js/app.js          Arranque, sesión, enrutador, navegación
  js/api.js          Cliente de la API (token en memoria, refresco de vuelo único)
  js/ui.js           Plantillas seguras (escape automático), íconos, Markdown seguro, modales
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
