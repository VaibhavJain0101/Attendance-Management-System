import { cn } from '../../lib/utils';

const FormRow = ({ className, ...props }) => <div className={cn('grid gap-2', className)} {...props} />;
const Label = ({ className, ...props }) => (
  <label className={cn('text-sm font-medium text-slate-700', className)} {...props} />
);
const FieldMessage = ({ className, tone = 'muted', ...props }) => {
  const toneClass =
    tone === 'error'
      ? 'text-rose-600'
      : tone === 'success'
        ? 'text-emerald-600'
        : 'text-slate-500';
  return <p className={cn('text-sm', toneClass, className)} {...props} />;
};

export { FormRow, Label, FieldMessage };