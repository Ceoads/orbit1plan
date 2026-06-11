import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function LabScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('lab.title')} description={t('lab.flashcards')} />;
}
