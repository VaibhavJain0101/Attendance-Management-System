import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-28 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/35',
      className
    )}
    {...props}
  />
));

Textarea.displayName = 'Textarea';

export { Textarea };
