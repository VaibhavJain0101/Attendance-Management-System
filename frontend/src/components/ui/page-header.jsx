import { cn } from '../../lib/utils';

const PageHeader = ({ title, description, className, actions }) => (
  <header className={cn('flex flex-col gap-4 rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-white/75 to-emerald-50/70 p-6 shadow-[0_20px_60px_-35px_rgba(5,150,105,0.45)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between', className)}>
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description ? <p className="mt-1 text-sm text-slate-600 sm:text-base">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
);

export default PageHeader;