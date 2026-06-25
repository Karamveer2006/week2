import React from 'react';
import { cn } from '../../utils/cn';

export const Table = ({ className, ...props }) => (
  <div className="w-full overflow-auto">
    <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b border-gray-200 dark:border-gray-800', className)} {...props} />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr className={cn('border-b border-gray-200 transition-colors hover:bg-gray-100/50 dark:border-gray-800 dark:hover:bg-gray-800/50', className)} {...props} />
);

export const TableHead = ({ className, ...props }) => (
  <th className={cn('h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400', className)} {...props} />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn('p-4 align-middle', className)} {...props} />
);
