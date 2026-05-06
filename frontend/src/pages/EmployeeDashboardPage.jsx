import { useMemo } from 'react';
import { CalendarCheck2, CircleAlert, Clock3 } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import AttendanceTable from '../components/common/AttendanceTable';
import OvertimeTable from '../components/common/OvertimeTable';
import { useGetAttendanceQuery } from '../features/attendance/attendanceApi';
import { useGetOvertimeQuery } from '../features/overtime/overtimeApi';
import PageHeader from '../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

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
      <PageHeader
        title="Employee Dashboard"
        description="Track attendance progress, working hours, and overtime activity in one place."
      />

      <div className="stats-grid">
        <StatCard title="Completed Days" value={stats.completed} icon={CalendarCheck2} tone="emerald" />
        <StatCard title="Incomplete Days" value={stats.incomplete} icon={CircleAlert} tone="amber" />
        <StatCard title="Total Logged Hours" value={stats.totalHours.toFixed(2)} subtitle="This period" icon={Clock3} tone="blue" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceTable rows={attendanceQuery.data?.data || []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overtime Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <OvertimeTable rows={overtimeQuery.data?.data || []} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboardPage;