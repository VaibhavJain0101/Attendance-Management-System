import { useMemo } from 'react';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import AttendanceTable from '../components/common/AttendanceTable';
import OvertimeTable from '../components/common/OvertimeTable';
import { useGetAttendanceQuery } from '../features/attendance/attendanceApi';
import { useGetOvertimeQuery } from '../features/overtime/overtimeApi';

const EmployeeDashboardPage = () => {
  const attendanceQuery = useGetAttendanceQuery({ page: 1, limit: 10 });
  const overtimeQuery = useGetOvertimeQuery({ page: 1, limit: 10 });

  const stats = useMemo(() => {
    const rows = attendanceQuery.data?.data || [];
    const completed = rows.filter((item) => item.workingStatus === 'COMPLETED').length;
    const incomplete = rows.filter((item) => item.workingStatus === 'INCOMPLETE').length;
    const totalHours = rows.reduce((sum, item) => sum + (item.totalWorkingHours || 0), 0);
    return { completed, incomplete, totalHours };
  }, [attendanceQuery.data]);

  if (attendanceQuery.isLoading || overtimeQuery.isLoading) {
    return <Loading label="Loading employee dashboard..." />;
  }

  if (attendanceQuery.error) {
    return <ErrorMessage message={attendanceQuery.error?.data?.message} />;
  }

  return (
    <div className="stack">
      <h2>Employee Dashboard</h2>
      <div className="stats-grid">
        <StatCard title="Completed Days" value={stats.completed} />
        <StatCard title="Incomplete Days" value={stats.incomplete} />
        <StatCard title="Total Logged Hours" value={stats.totalHours.toFixed(2)} />
      </div>

      <section className="card">
        <h3>Recent Attendance</h3>
        <AttendanceTable rows={attendanceQuery.data?.data || []} />
      </section>

      <section className="card">
        <h3>Overtime Requests</h3>
        <OvertimeTable rows={overtimeQuery.data?.data || []} />
      </section>
    </div>
  );
};

export default EmployeeDashboardPage;
