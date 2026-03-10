import React from 'react';
import { createRipple } from '../../lib/animations';

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
  secondary: 'bg-primary-bg text-primary hover:bg-purple-200',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  ghost: 'text-text-secondary hover:bg-gray-100 hover:text-text',
};

const rippleColors: Record<string, string> = {
  primary: 'rgba(255,255,255,0.35)',
  secondary: 'rgba(124,58,237,0.2)',
  danger: 'rgba(255,255,255,0.35)',
  ghost: 'rgba(124,58,237,0.15)',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, onClick, ...props }: ButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    createRipple(e, rippleColors[variant] || 'rgba(255,255,255,0.3)');
    onClick?.(e);
  }

  return (
    <button
      className={`relative inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
