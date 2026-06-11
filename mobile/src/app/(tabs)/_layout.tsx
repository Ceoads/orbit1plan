import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, FolderOpen, CheckSquare, GraduationCap, Brain } from 'lucide-react-native';

// Matches --primary / --muted-foreground from src/global.css (light theme)
const ACTIVE_COLOR = '#F2966B';
const INACTIVE_COLOR = '#8C7E73';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.pulse'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: t('nav.vault'),
          tabBarIcon: ({ color, size }) => <FolderOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('nav.tasks'),
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: t('nav.exams'),
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lab"
        options={{
          title: t('nav.lab'),
          tabBarIcon: ({ color, size }) => <Brain color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
