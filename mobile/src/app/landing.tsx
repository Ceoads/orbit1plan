import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export default function LandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text className="font-display text-4xl font-bold text-foreground text-center">
          {t('landing.heroTitle1')}
        </Text>
        <Text className="font-display text-3xl font-bold text-primary text-center">
          {t('landing.heroTitle2')}
        </Text>
        <Text className="text-center text-base text-muted-foreground mt-2">
          {t('landing.heroSubtitle')}
        </Text>
      </View>

      <View className="gap-3 px-8 pb-8">
        <Button size="lg" onPress={() => router.push('/auth')}>
          {t('landing.startFree')}
        </Button>
        <Button variant="outline" size="lg" onPress={() => router.push('/auth')}>
          {t('landing.connection')}
        </Button>
      </View>
    </SafeAreaView>
  );
}
