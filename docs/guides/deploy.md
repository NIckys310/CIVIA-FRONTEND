# Despliegue público de la web en Vercel

Requisito: la API ya desplegada en Render (guía en CIVIA-BACKEND `docs/guides/deploy.md`) y su
URL, p. ej. `https://civia-api-XXXX.onrender.com`.

## Cómo funciona

La web llama a la API en su **mismo dominio** (`/api/v1/*`) y una ruta de servidor de Next.js
(`apps/web/src/app/api/v1/[...path]/route.ts`) la reenvía al backend. No se usan `rewrites`:
la capa de borde de Vercel rechaza reenviar a dominios `onrender.com`
(`DNS_HOSTNAME_RESOLVED_PRIVATE`). Ventajas:

- La cookie de sesión (`HttpOnly; Secure; SameSite=Strict`) es de primera parte.
- No hace falta abrir CORS en la API.
- La CSP solo permite `connect-src 'self'`.

## Pasos con la CLI (como se hizo el primer despliegue)

```bash
vercel login
vercel project add civia
vercel project update civia --root-directory apps/web --framework nextjs --node-version 24.x --yes
vercel link --yes --project civia                       # desde la raíz del repo
printf 'https://civia-api-XXXX.onrender.com' | vercel env add API_PROXY_TARGET production --yes
vercel deploy --prod --yes                             # desde la raíz del repo
```

## Pasos desde el panel (alternativa)

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
