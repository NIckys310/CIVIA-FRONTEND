# Despliegue público de la web en Vercel

Requisito: la API ya desplegada en Render (guía en CIVIA-BACKEND `docs/guides/deploy.md`) y su
URL, p. ej. `https://civia-api-XXXX.onrender.com`.

## Cómo funciona

La web llama a la API en su **mismo dominio** (`/api/v1/*`) y Next.js la reenvía al backend
(`rewrites` en `apps/web/next.config.ts`). Ventajas:

- La cookie de sesión (`HttpOnly; Secure; SameSite=Strict`) es de primera parte.
- No hace falta abrir CORS en la API.
- La CSP solo permite `connect-src 'self'`.

## Pasos (una vez)

1. Entra en <https://vercel.com> con tu cuenta de GitHub y autoriza el repo `CIVIA-FRONTEND`.
2. **Add New → Project → Import** `CIVIA-FRONTEND`.
3. Configuración:
   - **Root Directory:** `apps/web` (Vercel detecta Next.js y los workspaces de npm).
   - **Environment Variables:** `API_PROXY_TARGET` = `https://civia-api-XXXX.onrender.com`
     (sin `/` final).
   - **Production Branch:** `main` (Settings → Git).
4. **Deploy**. Al terminar tendrás `https://<proyecto>.vercel.app`.
5. En Render, pon esa URL en `WEB_BASE_URL` (enlaces de los correos).

Cada push a `main` despliega producción; cada PR recibe una URL de vista previa.

## App móvil contra la API pública

En `apps/mobile/eas.json`, perfil `preview`/`production`: `EXPO_PUBLIC_API_URL` = URL de Render
(la app nativa no usa cookies ni CORS: guarda el refresh token en Keychain/Keystore).

## Problemas frecuentes

| Síntoma | Causa |
|---|---|
| El login tarda ~1 min la primera vez | El plan gratuito de Render duerme la API; se despierta sola |
| `502`/`504` en `/api/v1/*` | `API_PROXY_TARGET` mal escrito o la API aún desplegando |
| Sesión que no se mantiene al recargar | Revisa que la web se abre por `https://` (la cookie es `Secure`) |
