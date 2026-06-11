import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function StudyHubScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const { t } = useTranslation();

  return <ScreenPlaceholder title={t('studyHub.title', { defaultValue: 'Study Hub' })} description={fileId} />;
}
