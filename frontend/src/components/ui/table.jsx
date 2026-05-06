import { cn } from '../../lib/utils';

const TableContainer = ({ className, ...props }) => (
  <div className={cn('overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70', className)} {...props} />
);

const Table = ({ className, ...props }) => <table className={cn('w-full min-w-[920px] border-collapse text-sm', className)} {...props} />;
const TableHead = ({ className, ...props }) => <thead className={cn('sticky top-0 z-10 bg-slate-100/90 backdrop-blur', className)} {...props} />;
const TableHeaderCell = ({ className, ...props }) => (
  <th className={cn('whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500', className)} {...props} />
);
const TableRow = ({ className, ...props }) => <tr className={cn('transition hover:bg-emerald-50/50', className)} {...props} />;
const TableCell = ({ className, ...props }) => <td className={cn('border-b border-slate-100 px-4 py-3 align-top text-slate-700', className)} {...props} />;

export { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell };