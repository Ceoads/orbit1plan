import * as React from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90',
        destructive: 'bg-destructive active:opacity-90',
        outline: 'border border-input bg-background active:bg-accent',
        secondary: 'bg-secondary active:opacity-80',
        ghost: 'active:bg-accent',
        link: '',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ButtonProps
  extends Omit<PressableProps, 'children'>,
    VariantProps<typeof buttonVariants> {
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}

export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, textClassName, variant, size, children, disabled, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        className={cn(buttonVariants({ variant, size }), disabled && 'opacity-50', className)}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text className={cn(buttonTextVariants({ variant }), textClassName)}>{children}</Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
Button.displayName = 'Button';
