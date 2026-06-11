import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function PulseScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('nav.pulse')} description={t('pulse.todaySchedule')} />;
}
