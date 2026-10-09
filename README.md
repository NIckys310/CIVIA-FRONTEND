# CIVIA — Frontend

Interfaz de **CIVIA AI**, el copiloto digital del ingeniero civil: aplicación web a pantalla
completa (escritorio, tableta y móvil, instalable como PWA) y app nativa para Android/iOS.

> Toda salida de CIVIA requiere revisión y aprobación del profesional responsable.

| Repositorio | Contenido |
|---|---|
| **CIVIA-FRONTEND** (este) | Web (Next.js, PWA) y app móvil (Expo) |
| [CIVIA-BACKEND](https://github.com/NIckys310/CIVIA-BACKEND) | API, base de datos, infraestructura |
| [CIVIA-IA](https://github.com/NIckys310/CIVIA-IA) | Visión, OCR, RAG con citas y LLM |

## Estructura

```
apps/web               Next.js 16 · PWA · CSP con nonce
apps/mobile            Expo SDK 57 · Android (APK/AAB) e iOS (IPA)
packages/ui            Design tokens (test de contraste WCAG AA) + iconos de ingeniería
packages/shared-types  Tipos generados del contrato OpenAPI de CIVIA-BACKEND
packages/api-client    Cliente tipado: refresco de sesión de vuelo único, MFA
```

## Diseño

"El cuaderno de obra del siglo XXI": papel de plano, ejes A-B-C / 1-2-3, líneas de cota,
azul plano para la marca, naranja seguridad solo para la acción principal, datos técnicos en
monoespaciada (`C-01`, `30×30 cm`, `8Ø16`). Modo claro y oscuro; el estado nunca depende solo
del color.

## Requisitos

- Node.js ≥ 22 (probado con 24)
- La API de [CIVIA-BACKEND](https://github.com/NIckys310/CIVIA-BACKEND) en marcha

## Puesta en marcha

```bash
npm install
cp .env.example apps/web/.env.local      # API_PROXY_TARGET: dónde corre la API
npm run dev -w @civia/web                # http://localhost:3000
npm run dev -w @civia/mobile             # Expo Go o development build
```

APK / AAB / IPA: ver [docs/guides/mobile-builds.md](docs/guides/mobile-builds.md).
Despliegue público en Vercel: [docs/guides/deploy.md](docs/guides/deploy.md).

## Contrato con la API

Después de un cambio en la API (con CIVIA-BACKEND clonado al lado de este repo):

```bash
npm run contract:sync
# o desde la API en marcha:
npm run contract:sync -- http://localhost:8000/api/v1/openapi.json
```

## Calidad

```bash
npx turbo run typecheck test
npm run lint -w @civia/web
npm run build -w @civia/web
```

## Seguridad en el cliente

- Access token solo en memoria; refresh en cookie `HttpOnly; Secure; SameSite=Strict` (web) o
  Keychain/Keystore (móvil).
- Login en dos pasos con TOTP o código de recuperación.
- CSP estricta con nonce, cabeceras de seguridad, service worker que nunca cachea la API.
- Móvil: desbloqueo biométrico y bloqueo tras 5 min de inactividad, `allowBackup=false`.

[Cómo contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md) · [ADRs](docs/adr/)
