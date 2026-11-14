// Canal sellado con la API: los cuerpos JSON (correo, contraseña, datos de proyectos, respuestas del
// servidor) viajan cifrados con AES-256-GCM por encima de TLS. En las herramientas del navegador solo se
// ve {"iv": …, "data": …}.
//
// Saludo: ECDH P-256 con claves efímeras (una por pestaña) → HKDF-SHA256 → clave AES. La clave se crea
// como no exportable: ni este código ni la consola pueden leer sus bytes. Cada mensaje queda atado a su
// método, ruta y sentido (texto asociado), así que no se puede reutilizar en otra petición.
//
// Si el navegador no tiene WebCrypto (contexto no seguro) o el saludo falla, las peticiones siguen
// funcionando solo con TLS y se vuelve a intentar el saludo en la siguiente.

const SEAL_PATH = '/api/v1/seal';
const INFO = 'civia-seal-v1';
const enc = new TextEncoder();
const dec = new TextDecoder();

let pending = null;

const b64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const sealSupported = () => Boolean(globalThis.crypto?.subtle) && globalThis.isSecureContext !== false;

async function handshake() {
  const subtle = crypto.subtle;
  const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const mine = await subtle.exportKey('raw', pair.publicKey);
  const res = await fetch(SEAL_PATH, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey: b64(mine) }),
  });
  if (!res.ok) throw new Error('seal');
  const { id, publicKey } = await res.json();
  const theirs = await subtle.importKey('raw', unb64(publicKey), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const bits = await subtle.deriveBits({ name: 'ECDH', public: theirs }, pair.privateKey, 256);
  const hkdf = await subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(id), info: enc.encode(INFO) },
    hkdf, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
  return Object.freeze({ id, key });
}

/** Canal abierto (o null si no se pudo abrir). Una sola negociación aunque lo pidan varias peticiones. */
export function channel() {
  if (!sealSupported()) return Promise.resolve(null);
  pending ||= handshake().catch(() => { pending = null; return null; });
  return pending;
}

/** Olvida el canal actual (por ejemplo, si el servidor se reinició y responde 428). */
export function resetChannel() {
  pending = null;
}

/** Ruta tal como la ve el servidor (sin consulta) para el texto asociado. */
const route = (method, url) => `${method.toUpperCase()} ${new URL(url, location.origin).pathname}`;

/** Cifra un cuerpo JSON (texto) para esa petición. */
export async function seal(ch, method, url, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(`req|${route(method, url)}`) }, ch.key, enc.encode(text),
  );
  return JSON.stringify({ iv: b64(iv), data: b64(data) });
}

/** Descifra el sobre {iv, data} de una respuesta y devuelve el JSON original. */
export async function unseal(ch, method, url, envelope) {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(envelope.iv), additionalData: enc.encode(`res|${route(method, url)}`) },
    ch.key, unb64(envelope.data),
  );
  const text = dec.decode(plain);
  try { return JSON.parse(text); } catch { return text; }
}
