import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function TasksScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('tasks.pageTitle')} />;
}
