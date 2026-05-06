import { cn } from '../../lib/utils';

const Select = ({ className, children, ...props }) => (
  <select
    className={cn(
      'h-10 w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/35',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

export { Select };