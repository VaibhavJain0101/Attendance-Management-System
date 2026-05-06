import { formatDateOnly } from '../../utils/formatters';
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
  if (status === 'APPROVED') return 'default';
  if (status === 'PENDING') return 'info';
  if (status === 'REJECTED') return 'danger';
  return 'neutral';
};

const OvertimeTable = ({ rows = [], canReview = false, onReview, reviewingId }) => {
  if (!rows.length) {
    return (
      <Card>
        <p className="small">No overtime requests found.</p>
      </Card>
    );
  }

  return (
    <TableContainer>
      <Table className="min-w-[760px]">
        <TableHead>
          <tr>
            <TableHeaderCell>Employee</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Requested Hours</TableHeaderCell>
            <TableHeaderCell>Reason</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Comment</TableHeaderCell>
            {canReview ? <TableHeaderCell>Actions</TableHeaderCell> : null}
          </tr>
        </TableHead>
        <tbody>
          {rows.map((row) => (
            <TableRow key={row._id}>
              <TableCell>{row.employee?.name || '-'}</TableCell>
              <TableCell>{formatDateOnly(row.dateKey)}</TableCell>
              <TableCell>{row.requestedHours}</TableCell>
              <TableCell>{row.reason}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(row.status)}>{row.status || '-'}</Badge>
              </TableCell>
              <TableCell>{row.reviewComment || '-'}</TableCell>
              {canReview ? (
                <TableCell>
                  {row.status === 'PENDING' ? (
                    <div className="inline-actions">
                      <Button
                        type="button"
                        size="sm"
                        disabled={reviewingId === row._id}
                        onClick={() => onReview(row._id, 'APPROVED')}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={reviewingId === row._id}
                        onClick={() => onReview(row._id, 'REJECTED')}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default OvertimeTable;