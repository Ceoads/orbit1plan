import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function CourseHubScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { t } = useTranslation();

  return <ScreenPlaceholder title={t('calendar.todayList', { defaultValue: 'Course Hub' })} description={eventId} />;
}
