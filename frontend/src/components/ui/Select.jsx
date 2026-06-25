import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'block h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-50',
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';
