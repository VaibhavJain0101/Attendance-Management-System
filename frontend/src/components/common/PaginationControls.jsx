import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

const PaginationControls = ({ page, limit, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  return (
    <div className="pagination">
      <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} />
        Previous
      </Button>
      <span className="text-sm font-semibold text-slate-700">
        Page {page} of {totalPages}
      </span>
      <Button type="button" variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
        <ChevronRight size={14} />
      </Button>
    </div>
  );
};

export default PaginationControls;