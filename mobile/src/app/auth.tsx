import { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!EMAIL_REGEX.test(email)) {
      Alert.alert(t('auth.emailValidation'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('auth.passwordValidation'));
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            Alert.alert(t('auth.alreadyRegistered'));
          } else {
            Alert.alert(t('auth.authFailed'), error.message);
          }
          return;
        }
        Alert.alert(t('auth.accountCreated'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          Alert.alert(t('auth.authFailed'), error.message);
          return;
        }
      }
      // Successful auth redirects automatically via the root layout's auth gate.
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow justify-center px-8 gap-4">
          <View className="mb-6 items-center gap-1">
            <Text className="font-display text-3xl font-bold text-foreground">
              {t('auth.welcomeBack')}
            </Text>
            <Text className="text-base text-muted-foreground">{t('auth.tagline')}</Text>
          </View>

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            secureTextEntry
            textContentType="password"
          />

          {!isSignUp && (
            <Pressable onPress={() => router.push('/reset-password')}>
              <Text className="text-sm text-primary text-right">{t('auth.forgotPassword')}</Text>
            </Pressable>
          )}

          <Button size="lg" onPress={handleSubmit} disabled={loading}>
            {isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </Button>

          <Pressable onPress={() => setIsSignUp((v) => !v)}>
            <Text className="text-center text-sm text-muted-foreground">
              {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
              <Text className="font-medium text-primary">
                {isSignUp ? t('auth.signInLink') : t('auth.signUpLink')}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
