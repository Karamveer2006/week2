import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 focus:ring-indigo-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-slate-800 dark:text-gray-100 dark:hover:bg-slate-700 shadow-sm',
    destructive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/30 hover:shadow-lg hover:-translate-y-0.5 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white/50 backdrop-blur-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-900/50 dark:text-gray-100 dark:hover:bg-slate-800 focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-gray-100 focus:ring-gray-500'
  };
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg',
    icon: 'h-10 w-10'
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
