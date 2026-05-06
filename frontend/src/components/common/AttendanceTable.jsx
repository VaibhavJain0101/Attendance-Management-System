import { useCallback, useMemo, useState } from 'react';
import { Camera, MapPin, UserRoundCheck } from 'lucide-react';
import { formatDateTime, formatHours } from '../../utils/formatters';
import { useLazyGetAttendanceSelfiePreviewQuery } from '../../features/attendance/attendanceApi';
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
import SelfiePreviewDialog from './SelfiePreviewDialog';

const getStatusVariant = (value) => {
  const status = String(value || '').toUpperCase();
  if (status.includes('COMPLETE') || status.includes('VALID')) return 'default';
  if (status.includes('PENDING')) return 'info';
  if (status.includes('INCOMPLETE')) return 'warning';
  if (status.includes('INVALID')) return 'danger';
  return 'neutral';
};

const AttendanceTable = ({ rows = [], canValidate = false, onValidate, validatingId }) => {
  const [selectedSelfie, setSelectedSelfie] = useState(null);
  const [thumbnailErrorByRow, setThumbnailErrorByRow] = useState({});
  const [getFreshSelfieUrl] = useLazyGetAttendanceSelfiePreviewQuery();

  const allowedImageDomains = useMemo(() => {
    const raw = import.meta.env.VITE_SELFIE_ALLOWED_DOMAINS || '';
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, []);

  const handleThumbnailError = useCallback((rowId) => {
    setThumbnailErrorByRow((prev) => ({ ...prev, [rowId]: true }));
  }, []);

  const openSelfiePreview = useCallback((row) => {
    setSelectedSelfie({
      attendanceId: row._id,
      event: 'punchIn',
      fallbackUrl: row.punchIn?.selfie || '',
      employeeName: row.user?.name || 'Employee',
      dateKey: row.dateKey || ''
    });
  }, []);

  const handleRequestFreshUrl = useCallback(async () => {
    if (!selectedSelfie?.attendanceId) {
      return '';
    }

    try {
      const response = await getFreshSelfieUrl({
        attendanceId: selectedSelfie.attendanceId,
        event: selectedSelfie.event || 'punchIn'
      }).unwrap();

      return response?.data?.url || selectedSelfie.fallbackUrl || '';
    } catch {
      return selectedSelfie?.fallbackUrl || '';
    }
  }, [getFreshSelfieUrl, selectedSelfie]);

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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openSelfiePreview(row)}
                    className="group h-auto items-center gap-2 border-emerald-200 bg-emerald-50/70 px-2 py-1.5 text-left text-slate-700 shadow-none hover:border-emerald-300 hover:bg-emerald-100/70"
                  >
                    {!thumbnailErrorByRow[row._id] ? (
                      <img
                        src={row.punchIn.selfie}
                        alt={`${row.user?.name || 'Employee'} selfie thumbnail`}
                        loading="lazy"
                        className="h-10 w-10 rounded-lg border border-emerald-200 object-cover shadow-sm transition group-hover:scale-[1.03]"
                        onError={() => handleThumbnailError(row._id)}
                      />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500">
                        <Camera size={14} />
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:text-emerald-600">
                      <UserRoundCheck size={14} />
                      View Selfie
                    </span>
                  </Button>
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

      <SelfiePreviewDialog
        open={Boolean(selectedSelfie)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedSelfie(null);
          }
        }}
        imageUrl={selectedSelfie?.fallbackUrl || ''}
        title={`${selectedSelfie?.employeeName || 'Employee'} Selfie`}
        description={selectedSelfie?.dateKey ? `Attendance date: ${selectedSelfie.dateKey}` : 'Attendance selfie snapshot'}
        onRequestFreshUrl={handleRequestFreshUrl}
        allowedDomains={allowedImageDomains}
      />
    </TableContainer>
  );
};

export default AttendanceTable;
