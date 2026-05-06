import { formatDateTime, formatHours } from '../../utils/formatters';

const AttendanceTable = ({ rows = [], canValidate = false, onValidate, validatingId }) => {
  if (!rows.length) {
    return <div className="card">No attendance records found.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Punch In</th>
            <th>Punch Out</th>
            <th>Hours</th>
            <th>Status</th>
            <th>Validation</th>
            <th>Selfie</th>
            <th>Location</th>
            {canValidate ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row.user?.name || '-'}</td>
              <td>{row.dateKey}</td>
              <td>{formatDateTime(row.punchIn?.time)}</td>
              <td>{formatDateTime(row.punchOut?.time)}</td>
              <td>{formatHours(row.totalWorkingHours)}</td>
              <td>{row.workingStatus}</td>
              <td>
                {row.validation?.status}
                {row.validation?.remarks ? <div className="small">{row.validation.remarks}</div> : null}
              </td>
              <td>
                {row.punchIn?.selfie ? (
                  <a href={row.punchIn.selfie} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td>
                {row.punchIn?.location
                  ? `${row.punchIn.location.latitude}, ${row.punchIn.location.longitude}`
                  : '-'}
              </td>
              {canValidate ? (
                <td>
                  <div className="inline-actions">
                    <button
                      type="button"
                      disabled={validatingId === row._id}
                      onClick={() => onValidate(row._id, 'VALID')}
                    >
                      Valid
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={validatingId === row._id}
                      onClick={() => onValidate(row._id, 'INVALID')}
                    >
                      Invalid
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
