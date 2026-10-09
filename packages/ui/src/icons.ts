/**
 * Set de iconos propio de CIVIA: línea fina (1.5), rejilla 24×24, extremos redondeados.
 * Definidos como datos (`d` de SVG) para renderizarse igual en web (<svg>) y móvil (react-native-svg).
 * Símbolos de ingeniería: columna, viga, zapata, pilote, losa, muro, nivel, eje, cota,
 * escuadra, nivel de burbuja, casco, plomada, teodolito.
 */

const circle = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const icons = {
  // --- Navegación -------------------------------------------------------------------
  home: ['M3.5 10.5 12 3.5l8.5 7', 'M5.5 9v11h13V9', 'M10 20v-5.5h4V20'],
  projects: [
    'M3 7a1.5 1.5 0 0 1 1.5-1.5H9l2 2h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z',
    'M7 13.5h10',
    'M7 16.5h6',
  ],
  plan: ['M3.5 5h17v14h-17z', 'M8.5 5v14', 'M3.5 10h17', 'M12.5 14.5h5', 'M15 12.5v4'],
  analyze: [
    'M4 20V4h12',
    'M4 9h6',
    'M9 4v6',
    circle(15.5, 15, 3.75),
    'M18.3 17.8 21 20.5',
  ],
  measure: [
    'M3 16.5 16.5 3 21 7.5 7.5 21z',
    'M7.2 12.3l1.8 1.8',
    'M10 9.5l1.2 1.2',
    'M12.8 6.7l1.8 1.8',
  ],
  copilot: [
    'M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4 4v-4h-.5A1.5 1.5 0 0 1 4 14.5z',
    'M12 6.8v5.4',
    'M9.3 9.5h5.4',
  ],
  model3d: ['M12 3 20 7.5v9L12 21l-8-4.5v-9z', 'M4 7.5 12 12l8-4.5', 'M12 12v9'],
  library: ['M4 4h4v16H4z', 'M10 4h4v16h-4z', 'M16 5.2l3.4-.9 3 15.3-3.4.9z', 'M4 8h4', 'M10 8h4'],
  report: ['M6 3h9l4 4v14H6z', 'M15 3v4h4', 'M9 9h3', 'M9 12.5h7', 'M9 16h7'],
  calc: ['M5 3h14v18H5z', 'M8 6.5h8v3H8z', 'M8.5 13h.01', 'M12 13h.01', 'M15.5 13h.01', 'M8.5 16.5h.01', 'M12 16.5h.01', 'M15.5 16.5h.01'],
  soil: ['M3 6h18', 'M3 10.5h18', 'M3 15h18', 'M3 19.5h18', 'M7 6v4.5', 'M15 10.5V15', 'M10 15v4.5'],
  observation: ['M5 21V4', 'M5 4.5h11l-2 3.5 2 3.5H5'],
  evidence: ['M3.5 7.5h4l1.5-2h6l1.5 2h4v11h-17z', circle(12, 13, 3.5)],
  versions: ['M12 7v5l3 2', 'M3.5 12a8.5 8.5 0 1 0 2.5-6', 'M3.5 4v4h4'],
  camera: ['M3.5 7.5h4l1.5-2h6l1.5 2h4v11h-17z', circle(12, 13, 3.5)],

  // --- Elementos estructurales -------------------------------------------------------
  column: ['M7 3.5h10v2H7z', 'M9 5.5v13', 'M15 5.5v13', 'M7 18.5h10v2H7z'],
  beam: ['M3 8.5h18v4H3z', 'M5 12.5V20', 'M19 12.5V20', 'M3 20h4', 'M17 20h4'],
  footing: ['M10 3v9', 'M14 3v9', 'M5 12h14v4H5z', 'M3 20h18', 'M6 20l2-2', 'M11 20l2-2', 'M16 20l2-2'],
  pile: ['M6.5 3h11v3h-11z', 'M10 6v11.5l2 3 2-3V6'],
  slab: ['M3 11h12l6-4H9z', 'M3 11v3h12l6-4V7', 'M15 11v3'],
  wall: [
    'M3 5h18v14H3z',
    'M3 9.7h18',
    'M3 14.3h18',
    'M9 5v4.7',
    'M15 5v4.7',
    'M6 9.7v4.6',
    'M12 9.7v4.6',
    'M18 9.7v4.6',
    'M9 14.3V19',
    'M15 14.3V19',
  ],
  level: ['M3 14h18', 'M12 14 8.5 8.5h7z', 'M12 14v6'],
  axis: [circle(12, 6, 3), 'M12 9v3', 'M12 14v1.5', 'M12 17.5V21'],
  dimension: ['M3 8v8', 'M21 8v8', 'M3 12h18', 'M6 10l-3 2 3 2', 'M18 10l3 2-3 2'],
  square: ['M4 3.5V20h16.5z', 'M8 11.5V16h4.5z'],
  bubbleLevel: ['M2.5 9h19v6h-19z', 'M10 9v6', 'M14 9v6', circle(12, 12, 1.25)],
  helmet: ['M3 17h18v2H3z', 'M5 17a7 7 0 0 1 14 0', 'M10 10.5V7.5h4v3'],
  plumb: ['M12 2.5v6', 'M8.5 8.5h7L12 20.5z'],
  theodolite: ['M9 3h6v5.5H9z', 'M15 5.5h2.5', 'M12 8.5v2.5', 'M12 11 6.5 21', 'M12 11l5.5 10', 'M12 11v10'],

  // --- Estados (semáforo de revisión) -----------------------------------------------
  statusOk: [circle(12, 12, 9), 'M8 12.5l2.7 2.7L16 9.8'],
  statusWarn: ['M12 3.5 21.5 20h-19z', 'M12 10v4.5', 'M12 17.25v.25'],
  statusDanger: ['M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z', 'M9.5 9.5l5 5', 'M14.5 9.5l-5 5'],
  statusInfo: [circle(12, 12, 9), 'M12 11v5.5', 'M12 7.75V8'],

  // --- Interfaz ---------------------------------------------------------------------
  search: [circle(10.5, 10.5, 6.5), 'M15.5 15.5 20.5 20.5'],
  plus: ['M12 5v14', 'M5 12h14'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  chevronRight: ['M9.5 6l6 6-6 6'],
  chevronDown: ['M6 9.5l6 6 6-6'],
  arrowRight: ['M4.5 12h15', 'M13.5 6l6 6-6 6'],
  sidebar: ['M3.5 4.5h17v15h-17z', 'M9 4.5v15'],
  sun: [circle(12, 12, 4), 'M12 2.5v2', 'M12 19.5v2', 'M2.5 12h2', 'M19.5 12h2', 'M5.3 5.3l1.4 1.4', 'M17.3 17.3l1.4 1.4', 'M5.3 18.7l1.4-1.4', 'M17.3 6.7l1.4-1.4'],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'],
  monitor: ['M3 4.5h18v12H3z', 'M8.5 20.5h7', 'M12 16.5v4'],
  bell: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z', 'M10 20.5h4'],
  user: [circle(12, 8, 4), 'M4.5 20.5a7.5 7.5 0 0 1 15 0'],
  organization: ['M4 21V5l8-2v18', 'M12 8.5h8V21', 'M3 21h18', 'M7.5 8h1.5', 'M7.5 12h1.5', 'M7.5 16h1.5', 'M15.5 12h1.5', 'M15.5 16h1.5'],
  shield: ['M12 3 19.5 6v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z', 'M9 12l2.2 2.2L15.5 10'],
  device: ['M7 2.5h10v19H7z', 'M11 18.5h2'],
  logout: ['M14 4h5.5v16H14', 'M10 8l-4 4 4 4', 'M6 12h10'],
  settings: ['M4 7h9', 'M17 7h3', circle(15, 7, 2), 'M4 17h3', 'M11 17h9', circle(9, 17, 2)],
  command: ['M9 9V6.5A2.5 2.5 0 1 0 6.5 9H9zm0 0h6m-6 0v6m6-6V6.5A2.5 2.5 0 1 1 17.5 9H15zm0 0v6m0 0v2.5a2.5 2.5 0 1 0 2.5-2.5H15zm0 0H9m0 0v2.5A2.5 2.5 0 1 1 6.5 15H9z'],
  upload: ['M12 15.5V4', 'M7.5 8.5 12 4l4.5 4.5', 'M4 15v5h16v-5'],
  activity: ['M3 12h4l2.5-6 5 12 2.5-6h4'],
  lock: ['M5.5 10.5h13v10h-13z', 'M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', circle(12, 12, 3)],
  eyeOff: ['M3.5 3.5l17 17', 'M10 5.7a9.9 9.9 0 0 1 2-.2c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4', 'M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 5.4-1.6', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  mapPin: ['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z', circle(12, 10, 2.25)],
  globe: [circle(12, 12, 9), 'M3 12h18', 'M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z'],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof icons;
