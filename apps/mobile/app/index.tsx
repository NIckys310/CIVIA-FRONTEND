import { Redirect } from 'expo-router';

import { LoadingView } from '@/components/loading';
import { useSession } from '@/session';

/** Enrutador inicial según el estado de sesión. */
export default function Index() {
  const status = useSession((s) => s.status);
  if (status === 'loading') return <LoadingView />;
  if (status === 'locked') return <Redirect href="/unlock" />;
  if (status === 'authenticated') return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}
