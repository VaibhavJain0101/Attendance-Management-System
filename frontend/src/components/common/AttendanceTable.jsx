import { MapPin, UserRoundCheck } from 'lucide-react';
import { formatDateTime, formatHours } from '../../utils/formatters';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow
} from '../ui/table';
import { Card } from '../ui/card';

const getStatusVariant = (value) => {
  const status = String(value || '').toUpperCase();
  if (status.includes('COMPLETE') || status.includes('VALID')) return 'default';
  if (status.includes('PENDING')) return 'info';
  if (status.includes('INCOMPLETE')) return 'warning';
  if (status.includes('INVALID')) return 'danger';
  return 'neutral';
};

const AttendanceTable = ({ rows = [], canValidate = false, onValidate, validatingId }) => {
  if (!rows.length) {
    return (
      <Card>
        <p className="small">No attendance records found.</p>
      </Card>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Punch In</TableHeaderCell>
            <TableHeaderCell>Punch Out</TableHeaderCell>
            <TableHeaderCell>Hours</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Validation</TableHeaderCell>
            <TableHeaderCell>Selfie</TableHeaderCell>
            <TableHeaderCell>Location</TableHeaderCell>
            {canValidate ? <TableHeaderCell>Actions</TableHeaderCell> : null}
          </tr>
        </TableHead>
        <tbody>
          {rows.map((row) => (
            <TableRow key={row._id}>
              <TableCell>{row.user?.name || '-'}</TableCell>
              <TableCell>{row.dateKey}</TableCell>
              <TableCell>{formatDateTime(row.punchIn?.time)}</TableCell>
              <TableCell>{formatDateTime(row.punchOut?.time)}</TableCell>
              <TableCell>{formatHours(row.totalWorkingHours)}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(row.workingStatus)}>{row.workingStatus || '-'}</Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Badge variant={getStatusVariant(row.validation?.status)}>{row.validation?.status || '-'}</Badge>
                  {row.validation?.remarks ? <div className="small">{row.validation.remarks}</div> : null}
                </div>
              </TableCell>
              <TableCell>
                {row.punchIn?.selfie ? (
                  <a href={row.punchIn.selfie} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-600">
                    <UserRoundCheck size={14} />
                    View
                  </a>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {row.punchIn?.location ? (
                  <span className="inline-flex items-start gap-1 text-sm">
                    <MapPin size={14} className="mt-0.5 text-slate-400" />
                    {`${row.punchIn.location.latitude}, ${row.punchIn.location.longitude}`}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              {canValidate ? (
                <TableCell>
                  <div className="inline-actions">
                    <Button
                      type="button"
                      size="sm"
                      disabled={validatingId === row._id}
                      onClick={() => onValidate(row._id, 'VALID')}
                    >
                      Valid
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={validatingId === row._id}
                      onClick={() => onValidate(row._id, 'INVALID')}
                    >
                      Invalid
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default AttendanceTable;