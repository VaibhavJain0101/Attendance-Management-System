import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/35',
      className
    )}
    {...props}
  />
));

Input.displayName = 'Input';

export { Input };
