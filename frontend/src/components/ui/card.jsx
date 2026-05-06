import { cn } from '../../lib/utils';

const Card = ({ className, ...props }) => (
  <section
    className={cn(
      'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-6',
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }) => <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...props} />;
const CardTitle = ({ className, ...props }) => <h3 className={cn('text-lg font-semibold tracking-tight text-slate-900', className)} {...props} />;
const CardDescription = ({ className, ...props }) => <p className={cn('text-sm text-slate-500', className)} {...props} />;
const CardContent = ({ className, ...props }) => <div className={cn('space-y-4', className)} {...props} />;

export { Card, CardHeader, CardTitle, CardDescription, CardContent };