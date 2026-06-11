import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenPlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Temporary placeholder used while screens are migrated from the web app
 * folder by folder. Confirms theming + navigation wiring end-to-end.
 */
export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="font-display text-2xl font-semibold text-foreground">{title}</Text>
        {description ? (
          <Text className="text-center text-base text-muted-foreground">{description}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
