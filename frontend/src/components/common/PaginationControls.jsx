const PaginationControls = ({ page, limit, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
};

export default PaginationControls;
