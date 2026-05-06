import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-emerald-700 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white shadow-[0_10px_25px_-15px_rgba(5,150,105,0.9)] hover:brightness-110',
        secondary: 'border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-100',
        ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        outline: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100',
        danger:
          'border-rose-700 bg-gradient-to-br from-rose-600 to-red-600 text-white shadow-[0_10px_25px_-15px_rgba(225,29,72,0.9)] hover:brightness-110'
      },
      size: {
        default: 'h-10',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-5 text-base',
        icon: 'h-10 w-10 p-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

const Button = ({ className, variant, size, type = 'button', ...props }) => (
  <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
);

export { Button, buttonVariants };