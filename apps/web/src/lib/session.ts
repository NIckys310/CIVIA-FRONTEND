import type { Me } from '@civia/shared-types';
import { create } from 'zustand';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  status: Status;
  me: Me | null;
  setMe(me: Me): void;
  expire(): void;
}

/** Estado de sesión en memoria (nunca persistido): se reconstruye con el refresh de cookie. */
export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  me: null,
  setMe: (me) => set({ me, status: 'authenticated' }),
  expire: () => set({ me: null, status: 'anonymous' }),
}));
