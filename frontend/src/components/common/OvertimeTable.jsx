import { formatDateOnly } from '../../utils/formatters';

const OvertimeTable = ({ rows = [], canReview = false, onReview, reviewingId }) => {
  if (!rows.length) {
    return <div className="card">No overtime requests found.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Requested Hours</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Comment</th>
            {canReview ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row.employee?.name || '-'}</td>
              <td>{formatDateOnly(row.dateKey)}</td>
              <td>{row.requestedHours}</td>
              <td>{row.reason}</td>
              <td>{row.status}</td>
              <td>{row.reviewComment || '-'}</td>
              {canReview ? (
                <td>
                  {row.status === 'PENDING' ? (
                    <div className="inline-actions">
                      <button
                        type="button"
                        disabled={reviewingId === row._id}
                        onClick={() => onReview(row._id, 'APPROVED')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={reviewingId === row._id}
                        onClick={() => onReview(row._id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OvertimeTable;
