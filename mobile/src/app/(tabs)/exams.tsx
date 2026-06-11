import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function ExamsScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('exams.title')} description={t('exams.upcoming')} />;
}
