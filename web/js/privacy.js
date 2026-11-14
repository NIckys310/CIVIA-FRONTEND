// Consola silenciosa: la aplicación no escribe nada en la consola del navegador (ni errores con
// mensajes del servidor, ni objetos con datos de la cuenta), y los errores no capturados tampoco se
// imprimen. Solo queda un aviso contra el «self-XSS»: si alguien pide pegar algo aquí, es una estafa.
//
// Para depurar en desarrollo: en la consola, localStorage.setItem('civia-debug', '1') y recargar
// (solo en localhost).
//
// Importante: esto evita que la aplicación exponga datos por su cuenta. Lo que viaja por la red va
// cifrado aparte (js/seal.js); las contraseñas nunca se guardan en el navegador.

const METHODS = ['log', 'info', 'debug', 'warn', 'error', 'table', 'dir', 'dirxml', 'trace', 'group', 'groupCollapsed', 'groupEnd', 'count', 'countReset', 'time', 'timeLog', 'timeEnd', 'assert', 'profile', 'profileEnd'];

function debugAllowed() {
  try {
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    return local && localStorage.getItem('civia-debug') === '1';
  } catch { return false; }
}

export function lockConsole() {
  if (debugAllowed() || globalThis.__civiaConsoleLocked) return;
  const c = globalThis.console;
  if (!c) return;
  // Aviso único antes de silenciar (los grandes servicios web muestran uno igual).
  try {
    c.log('%cDetente', 'color:#e2b071;font:600 42px system-ui,sans-serif;text-shadow:0 2px 12px rgba(214,164,108,.45)');
    c.log('%cEsta consola es una herramienta para desarrolladores. Si alguien te pidió copiar o pegar algo aquí, es una estafa para entrar a tu cuenta de CIVIA. CIVIA no muestra datos personales en este espacio.', 'font:15px system-ui,sans-serif;color:#c9ccd3;line-height:1.5');
  } catch { /* consola no disponible */ }
  const noop = () => {};
  for (const m of METHODS) {
    try { Object.defineProperty(c, m, { value: noop, writable: false, configurable: false }); } catch { /* propiedad bloqueada */ }
  }
  Object.defineProperty(globalThis, '__civiaConsoleLocked', { value: true });

  // Errores no capturados y promesas rechazadas: el navegador los imprimiría con su mensaje (que puede
  // incluir respuestas del servidor). Se marcan como atendidos para que no salgan en la consola.
  addEventListener('error', (e) => { if (e.error || e.message) e.preventDefault(); }, true);
  addEventListener('unhandledrejection', (e) => { e.preventDefault(); });
}

/** Borra los valores de los campos sensibles de un formulario (tras enviar o al salir de la vista). */
export function wipeSensitive(root) {
  root?.querySelectorAll?.('input[type=password], input[data-private], input[autocomplete="one-time-code"]').forEach((i) => {
    i.value = '';
  });
}

lockConsole();
