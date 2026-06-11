import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

const LANGUAGE_STORAGE_KEY = 'orbit_language';

const initI18n = async () => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // ignore storage errors, fall back to device locale
  }

  const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'fr';

  await i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: savedLanguage ?? deviceLanguage,
    fallbackLng: 'fr', // French is the default
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });
};

export const changeLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // ignore storage errors
  }
};

initI18n();

export default i18n;
