import type { components, paths } from './schema';

export type { components, paths };

type Schemas = components['schemas'];

export type User = Schemas['UserOut'];
export type Me = Schemas['MeOut'];
export type Membership = Schemas['MembershipOut'];
export type Role = Membership['role'];
export type Project = Schemas['ProjectOut'];
export type ProjectInput = Schemas['ProjectIn'];
export type Session = Schemas['SessionOut'];
export type TokenResponse = Schemas['TokenOut'];
export type RegisterInput = Schemas['RegisterIn'];
export type LoginInput = Schemas['LoginIn'];

/** Etiquetas de rol en español (es-CO) para la interfaz. */
export const roleLabels: Record<Role, { es: string; en: string }> = {
  admin: { es: 'Administrador', en: 'Admin' },
  engineer_in_charge: { es: 'Ingeniero responsable', en: 'Engineer in charge' },
  reviewer: { es: 'Revisor', en: 'Reviewer' },
  collaborator: { es: 'Colaborador', en: 'Collaborator' },
  viewer: { es: 'Lector', en: 'Viewer' },
};
