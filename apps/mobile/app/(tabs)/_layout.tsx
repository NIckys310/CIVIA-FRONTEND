import type { IconName } from '@civia/ui';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

const TABS: Array<{ name: string; title: string; icon: IconName }> = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'projects', title: 'Proyectos', icon: 'projects' },
  { name: 'measure', title: 'Medir', icon: 'measure' },
  { name: 'copilot', title: 'Copilot', icon: 'copilot' },
  { name: 'profile', title: 'Perfil', icon: 'user' },
];

export default function TabsLayout() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const status = useSession((s) => s.status);
  if (status === 'locked') return <Redirect href="/unlock" />;
  if (status !== 'authenticated') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.bg },
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: 64 + insets.bottom,
          paddingTop: 6,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color, focused }) =>
              tab.name === 'measure' ? (
                // Acción de campo destacada: botón grande naranja de seguridad.
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    marginTop: -22,
                    backgroundColor: c.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 4,
                    borderColor: c.surface,
                  }}
                >
                  <Icon name="measure" color={c.onAccent} size={24} strokeWidth={1.75} />
                </View>
              ) : (
                <Icon name={tab.icon} color={String(color)} size={24} strokeWidth={focused ? 1.9 : 1.5} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}
