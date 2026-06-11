import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { changeLanguage } from '@/i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom', 'left', 'right']}>
      <View className="flex-1 gap-4 px-6 pt-6">
        <View className="gap-1">
          <Text className="text-sm font-medium text-muted-foreground">{t('settings.profile')}</Text>
          <Text className="text-base text-foreground">{user?.email}</Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">{t('settings.language')}</Text>
          <View className="flex-row gap-2">
            <Button
              variant={i18n.language === 'fr' ? 'default' : 'outline'}
              size="sm"
              onPress={() => changeLanguage('fr')}
            >
              Français
            </Button>
            <Button
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              size="sm"
              onPress={() => changeLanguage('en')}
            >
              English
            </Button>
          </View>
        </View>

        <Button variant="destructive" onPress={signOut} className="mt-4">
          {t('settings.logout')}
        </Button>
      </View>
    </SafeAreaView>
  );
}
