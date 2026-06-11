import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor ?? '#A89A8C'}
        className={cn(
          'h-12 w-full rounded-xl border border-input bg-card px-4 text-base text-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
