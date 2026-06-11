import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        Alert.alert(t('auth.resetEmailError'), error.message);
        return;
      }
      Alert.alert(t('auth.checkEmail'), `${t('auth.resetEmailSent')} ${email}`);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-4 px-8">
        <Text className="font-display text-2xl font-bold text-foreground">
          {t('auth.resetPassword')}
        </Text>
        <Text className="text-base text-muted-foreground">
          {t('auth.resetPasswordDescription')}
        </Text>

        <Input
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.email')}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Button size="lg" onPress={handleSendResetLink} disabled={loading}>
          {t('auth.sendResetLink')}
        </Button>

        <Button variant="ghost" onPress={() => router.back()}>
          {t('auth.backToSignIn')}
        </Button>
      </View>
    </SafeAreaView>
  );
}
