import { useMemo, useState } from 'react';
import { CircleAlert, ClipboardCheck, FileClock } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import AttendanceTable from '../components/common/AttendanceTable';
import OvertimeTable from '../components/common/OvertimeTable';
import { useGetAttendanceQuery, useValidateAttendanceMutation } from '../features/attendance/attendanceApi';
import { useGetOvertimeQuery, useReviewOvertimeMutation } from '../features/overtime/overtimeApi';
import PageHeader from '../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const ManagerDashboardPage = () => {
  const [attendancePage, setAttendancePage] = useState(1);
  const [overtimePage, setOvertimePage] = useState(1);
  const [validatingId, setValidatingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const attendanceQuery = useGetAttendanceQuery({ page: attendancePage, limit: 10 });
  const overtimeQuery = useGetOvertimeQuery({ page: overtimePage, limit: 10 });

  const [validateAttendance] = useValidateAttendanceMutation();
  const [reviewOvertime] = useReviewOvertimeMutation();

  const stats = useMemo(() => {
    const attendance = attendanceQuery.data?.data || [];
    const overtime = overtimeQuery.data?.data || [];
    return {
      teamRecords: attendance.length,
      pendingOvertime: overtime.filter((item) => item.status === 'PENDING').length,
      invalidMarked: attendance.filter((item) => item.validation?.status === 'INVALID').length
    };
  }, [attendanceQuery.data, overtimeQuery.data]);

  const handleValidate = async (attendanceId, status) => {
    const remarks = window.prompt('Add remarks (optional):', '') || '';
    setValidatingId(attendanceId);
    try {
      await validateAttendance({ attendanceId, body: { status, remarks } }).unwrap();
    } catch (_error) {
      window.alert('Failed to validate attendance');
    } finally {
      setValidatingId(null);
    }
  };

  const handleReview = async (overtimeId, status) => {
    const reviewComment = window.prompt('Add review comment (optional):', '') || '';
    setReviewingId(overtimeId);
    try {
      await reviewOvertime({ overtimeId, body: { status, reviewComment } }).unwrap();
    } catch (_error) {
      window.alert('Failed to review overtime request');
    } finally {
      setReviewingId(null);
    }
  };

  if (attendanceQuery.isLoading || overtimeQuery.isLoading) {
    return <Loading label="Loading manager dashboard..." />;
  }

  if (attendanceQuery.error) {
    return <ErrorMessage message={attendanceQuery.error?.data?.message} />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Manager Dashboard"
        description="Review team attendance, validate records, and handle overtime approvals."
      />

      <div className="stats-grid">
        <StatCard title="Team Records" value={stats.teamRecords} icon={ClipboardCheck} tone="emerald" />
        <StatCard title="Pending Overtime" value={stats.pendingOvertime} icon={FileClock} tone="amber" />
        <StatCard title="Invalid Marked" value={stats.invalidMarked} icon={CircleAlert} tone="rose" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            rows={attendanceQuery.data?.data || []}
            canValidate
            onValidate={handleValidate}
            validatingId={validatingId}
          />
          <div className="pagination">
            <Button type="button" variant="secondary" size="sm" disabled={attendancePage === 1} onClick={() => setAttendancePage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {attendancePage}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setAttendancePage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Overtime Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <OvertimeTable
            rows={overtimeQuery.data?.data || []}
            canReview
            onReview={handleReview}
            reviewingId={reviewingId}
          />
          <div className="pagination">
            <Button type="button" variant="secondary" size="sm" disabled={overtimePage === 1} onClick={() => setOvertimePage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {overtimePage}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setOvertimePage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboardPage;