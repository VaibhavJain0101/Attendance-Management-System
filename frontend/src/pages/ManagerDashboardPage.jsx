import { useMemo, useState } from 'react';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import AttendanceTable from '../components/common/AttendanceTable';
import OvertimeTable from '../components/common/OvertimeTable';
import { useGetAttendanceQuery, useValidateAttendanceMutation } from '../features/attendance/attendanceApi';
import { useGetOvertimeQuery, useReviewOvertimeMutation } from '../features/overtime/overtimeApi';

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
      <h2>Manager Dashboard</h2>
      <div className="stats-grid">
        <StatCard title="Team Records" value={stats.teamRecords} />
        <StatCard title="Pending Overtime" value={stats.pendingOvertime} />
        <StatCard title="Invalid Marked" value={stats.invalidMarked} />
      </div>

      <section className="card">
        <h3>Team Attendance</h3>
        <AttendanceTable
          rows={attendanceQuery.data?.data || []}
          canValidate
          onValidate={handleValidate}
          validatingId={validatingId}
        />
        <div className="pagination">
          <button type="button" disabled={attendancePage === 1} onClick={() => setAttendancePage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {attendancePage}</span>
          <button type="button" onClick={() => setAttendancePage((p) => p + 1)}>
            Next
          </button>
        </div>
      </section>

      <section className="card">
        <h3>Team Overtime Requests</h3>
        <OvertimeTable
          rows={overtimeQuery.data?.data || []}
          canReview
          onReview={handleReview}
          reviewingId={reviewingId}
        />
        <div className="pagination">
          <button type="button" disabled={overtimePage === 1} onClick={() => setOvertimePage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {overtimePage}</span>
          <button type="button" onClick={() => setOvertimePage((p) => p + 1)}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
};

export default ManagerDashboardPage;
