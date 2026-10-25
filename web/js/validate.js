// Validación de formularios en tiempo real. Cada regla devuelve { ok, msg, level }:
//   ok=true → campo válido (✓); level 'warn' → aviso que no bloquea; si no, error.
// La validación definitiva siempre la hace el servidor; esto solo ayuda mientras se escribe.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Dominios de correo que se escriben mal a menudo → el correcto. */
const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.co': 'outlook.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'icloud.co': 'icloud.com',
};

/** Correo con un dominio corregido si parece un error de tipeo, o null. */
export function emailSuggestion(value) {
  const v = value.trim().toLowerCase();
  const at = v.lastIndexOf('@');
  if (at < 1) return null;
  const fixed = DOMAIN_TYPOS[v.slice(at + 1)];
  return fixed ? `${v.slice(0, at)}@${fixed}` : null;
}

export const rules = {
  required: (label) => (v) => (v.trim() ? { ok: true } : { ok: false, msg: `${label} es obligatorio.` }),

  fullName: (v) => {
    const t = v.trim().replace(/\s+/g, ' ');
    if (!t) return { ok: false, msg: 'Escribe tu nombre.' };
    if (t.length < 3) return { ok: false, msg: 'El nombre es muy corto.' };
    if (/[0-9<>{}@]/.test(t)) return { ok: false, msg: 'El nombre no debe tener números ni símbolos.' };
    if (!t.includes(' ')) return { ok: true, level: 'warn', msg: 'Sugerencia: agrega tu apellido.' };
    return { ok: true };
  },

  email: (v) => {
    const t = v.trim();
    if (!t) return { ok: false, msg: 'Escribe tu correo electrónico.' };
    if (/\s/.test(t)) return { ok: false, msg: 'El correo no puede tener espacios.' };
    if (!t.includes('@')) return { ok: false, msg: 'Falta la @ del correo.' };
    if (!EMAIL.test(t)) return { ok: false, msg: 'Revisa el correo: debe ser como nombre@dominio.com' };
    const suggestion = emailSuggestion(t);
    if (suggestion) return { ok: true, level: 'warn', msg: `¿Quisiste decir ${suggestion}?`, suggestion };
    return { ok: true };
  },

  loginPassword: (v) => (v ? { ok: true } : { ok: false, msg: 'Escribe tu contraseña.' }),

  /** Mismas reglas básicas que el servidor (las comunes y filtradas las revisa el servidor). */
  newPassword: (min, context = () => ({})) => (v) => {
    const { email = '' } = context();
    const checks = passwordChecks(v, min, email);
    const failed = checks.find((c) => !c.ok);
    return failed ? { ok: false, msg: failed.label, checks } : { ok: true, checks };
  },

  same: (other, msg) => (v) => (v && v === other() ? { ok: true } : { ok: false, msg: v ? msg : 'Repite la contraseña.' }),

  mfa: (v) => {
    const t = v.replace(/\s/g, '');
    if (!t) return { ok: false, msg: 'Escribe el código de verificación.' };
    if (/^\d+$/.test(t) && t.length !== 6) return { ok: false, msg: 'El código de la app tiene 6 dígitos.' };
    return { ok: true };
  },
};

// ------------------------------------------------------------------ números en formato colombiano

/** "1.250.000,5" o "1250000.5" → 1250000.5 (NaN si no es un número). Vacío → null. */
export function parseNumber(value) {
  let s = String(value ?? '').trim().replace(/\s|\$|COP|m²/gi, '');
  if (!s) return null;
  // Con coma: es el separador decimal y los puntos son de miles. Sin coma, un solo punto seguido
  // de 1 o 2 cifras es decimal ("2.9"); si no, los puntos son de miles ("1.250.000").
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

const nf = (dec) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: dec });
/** 1250000.5 → "1.250.000,5" */
export const formatNumber = (n, dec = 2) => (n == null || Number.isNaN(n) ? '' : nf(dec).format(n));

/**
 * Agrupa las cifras con puntos de miles mientras se escribe, sin mover el cursor de sitio.
 * Para montos en pesos (enteros).
 */
export function liveThousands(input) {
  input.addEventListener('input', () => {
    const before = input.value;
    const caret = input.selectionStart ?? before.length;
    const digitsBefore = before.slice(0, caret).replace(/\D/g, '').length;
    const digits = before.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const formatted = digits ? nf(0).format(Number(digits)) : '';
    if (formatted === before) return;
    input.value = formatted;
    let pos = 0;
    for (let seen = 0; pos < formatted.length && seen < digitsBefore; pos++) if (/\d/.test(formatted[pos])) seen++;
    input.setSelectionRange(pos, pos);
  });
}

/** Reglas para formularios de proyecto y similares. Mensajes en tono prudente y con la corrección. */
export const fieldRules = {
  text: (label, { min = 1, max = 200, required = true } = {}) => (v) => {
    const t = v.trim();
    if (!t) return required ? { ok: false, msg: `${label} es obligatorio.` } : { ok: true };
    if (t.length < min) return { ok: false, msg: `Usa al menos ${min} caracteres (${t.length} de ${min}).` };
    if (t.length > max) return { ok: false, msg: `Máximo ${max} caracteres (sobran ${t.length - max}).` };
    return { ok: true };
  },

  /** Número mayor que 0 (área, longitud…). `warn(n)` puede devolver un aviso que no bloquea. */
  positive: (label, { unit = '', required = false, warn } = {}) => (v) => {
    const n = parseNumber(v);
    if (n === null) return required ? { ok: false, msg: `${label} es obligatorio.` } : { ok: true };
    if (Number.isNaN(n)) return { ok: false, msg: 'Escribe solo números (usa coma para los decimales: 120,5).' };
    if (n <= 0) return { ok: false, msg: `${label} debe ser mayor que 0.` };
    const w = warn?.(n);
    if (w) return { ok: true, level: 'warn', msg: w };
    return { ok: true, msg: unit ? `${formatNumber(n)} ${unit}` : '' };
  },

  /** Entero ≥ 1, sin tope (pisos). */
  integer: (label, { warnAbove } = {}) => (v) => {
    const t = v.trim();
    if (!t) return { ok: true };
    const n = Number(t);
    if (!Number.isInteger(n) || n < 1) return { ok: false, msg: `${label}: usa un número entero de 1 en adelante.` };
    if (warnAbove && n > warnAbove) return { ok: true, level: 'warn', msg: `Más de ${warnAbove}: requiere un estudio estructural especial.` };
    return { ok: true };
  },

  /** Pesos colombianos. `perUnit()` devuelve el área para avisar si el valor por m² parece bajo. */
  money: ({ perUnit } = {}) => (v) => {
    const n = parseNumber(v);
    if (n === null) return { ok: true };
    if (Number.isNaN(n) || n <= 0) return { ok: false, msg: 'Escribe un valor en pesos mayor que 0.' };
    const area = perUnit?.();
    if (area > 0 && n / area < 300000) {
      return { ok: true, level: 'warn', msg: `Equivale a $ ${formatNumber(n / area, 0)} por m²; confirma la cifra.` };
    }
    return { ok: true, msg: `$ ${formatNumber(n, 0)} COP` };
  },

  /** Fecha que debe ser posterior a otra (entrega después del inicio). */
  dateAfter: (otherLabel, other) => (v) => {
    const start = other();
    if (!v || !start) return { ok: true };
    if (v <= start) return { ok: false, msg: `Debe ser posterior a ${otherLabel.toLowerCase()} (${start.split('-').reverse().join('/')}).` };
    return { ok: true };
  },
};

/** Lista de requisitos de la contraseña, para mostrarlos marcados mientras se escribe. */
export function passwordChecks(pw, min = 8, email = '') {
  const lower = pw.toLowerCase();
  const local = email.split('@')[0].toLowerCase();
  return [
    { id: 'len', ok: pw.length >= min, label: `Al menos ${min} caracteres` },
    { id: 'mix', ok: pw.length >= 12 || (/\p{L}/u.test(pw) && /[\d\W_]/.test(pw)), label: 'Letras con números o símbolos (o una frase de 12+)' },
    { id: 'variety', ok: new Set(lower).size >= 4, label: 'Variedad de caracteres' },
    { id: 'email', ok: !(local.length >= 3 && lower.includes(local)), label: 'Que no incluya tu correo' },
  ];
}

/**
 * Conecta un campo: valida mientras se escribe y al salir de él. El ✓ aparece apenas el valor es
 * válido; los errores, cuando la persona hace una pausa al escribir (no a cada tecla), al salir del
 * campo o al enviar.
 */
export function live(input, rule, { onResult, delay = 350 } = {}) {
  const field = input.closest('.field');
  const msg = field?.querySelector('.field-msg');
  let touched = false;
  let timer;
  const apply = (show) => {
    const r = rule(input.value);
    const showError = !r.ok && (show || touched);
    field?.classList.toggle('valid', r.ok && !!input.value.trim());
    field?.classList.toggle('invalid', showError);
    field?.classList.toggle('warn', r.ok && r.level === 'warn');
    input.setAttribute('aria-invalid', String(showError));
    // Errores y avisos siempre; un valor válido puede traer una confirmación ("1.250 m²").
    if (msg) msg.textContent = showError || (r.ok && r.msg && input.value.trim()) ? r.msg : '';
    onResult?.(r);
    return r;
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    // El ✓ aparece al instante; los errores esperan a que la persona haga una pausa.
    const quick = rule(input.value);
    if (quick.ok) apply(false);
    else timer = setTimeout(() => apply(input.value.length > 0), delay + 350);
  });
  input.addEventListener('blur', () => { if (input.value) touched = true; apply(false); });
  // Autocompletado del navegador o del gestor de contraseñas.
  input.addEventListener('change', () => apply(false));
  return {
    check: () => { touched = true; return apply(true); },
    refresh: () => apply(false),
  };
}

/** Valida todos los campos al enviar; enfoca el primero con error. Devuelve true si todo está bien. */
export function validateAll(fields) {
  let first = null;
  for (const [input, ctl] of fields) {
    if (!ctl.check().ok && !first) first = input;
  }
  first?.focus();
  return !first;
}
