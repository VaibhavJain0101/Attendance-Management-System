import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Download } from 'lucide-react';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import { useGetDailyReportQuery } from '../features/reports/reportsApi';
import { formatDateTime, formatHours } from '../utils/formatters';
import { getStoredToken } from '../utils/storage';
import PageHeader from '../components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow
} from '../components/ui/table';

const ReportsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({ date: '', startDate: '', endDate: '', userId: '', page: 1, limit: 20 });
  const [exportingFormat, setExportingFormat] = useState('');
  const [exportError, setExportError] = useState('');

  const queryParams = {
    page: filters.page,
    limit: filters.limit,
    ...(filters.date ? { date: filters.date } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.userId ? { userId: filters.userId } : {})
  };

  const exportParams = {
    ...(filters.date ? { date: filters.date } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.userId ? { userId: filters.userId } : {})
  };

  const reportsQuery = useGetDailyReportQuery(queryParams);

  const downloadReport = async (format) => {
    setExportError('');
    setExportingFormat(format);

    try {
      const token = getStoredToken();
      const searchParams = new URLSearchParams({ ...exportParams, format });
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/reports/daily/export?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const maybeJson = await response.json().catch(() => null);
        throw new Error(maybeJson?.message || 'Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-attendance-report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error.message || 'Failed to export report');
    } finally {
      setExportingFormat('');
    }
  };

  if (reportsQuery.isLoading) {
    return <Loading label="Generating reports..." />;
  }

  if (reportsQuery.error) {
    return <ErrorMessage message={reportsQuery.error?.data?.message} />;
  }

  const rows = reportsQuery.data?.data || [];

  return (
    <div className="stack">
      <PageHeader title="Daily Attendance Reports" description="Filter attendance reports and export data in CSV, Excel, or PDF format." />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="filters">
            <Input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value, page: 1 }))}
            />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value, page: 1 }))}
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value, page: 1 }))}
            />
            {user?.role !== 'EMPLOYEE' ? (
              <Input
                type="text"
                placeholder="Filter by User ID"
                value={filters.userId}
                onChange={(event) => setFilters((prev) => ({ ...prev, userId: event.target.value, page: 1 }))}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="inline-actions">
            <Button type="button" disabled={Boolean(exportingFormat)} onClick={() => downloadReport('csv')}>
              <Download size={16} />
              {exportingFormat === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
            </Button>
            <Button type="button" variant="secondary" disabled={Boolean(exportingFormat)} onClick={() => downloadReport('xlsx')}>
              <Download size={16} />
              {exportingFormat === 'xlsx' ? 'Exporting Excel...' : 'Export Excel'}
            </Button>
            <Button type="button" variant="secondary" disabled={Boolean(exportingFormat)} onClick={() => downloadReport('pdf')}>
              <Download size={16} />
              {exportingFormat === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
            </Button>
          </div>
          {exportError ? <p className="error-text mt-3">{exportError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Punch In</TableHeaderCell>
                  <TableHeaderCell>Punch Out</TableHeaderCell>
                  <TableHeaderCell>Hours</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Validation</TableHeaderCell>
                  <TableHeaderCell>Location</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {rows.map((row) => (
                  <TableRow key={`${row.employeeId}-${row.date}`}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{formatDateTime(row.punchInTime)}</TableCell>
                    <TableCell>{formatDateTime(row.punchOutTime)}</TableCell>
                    <TableCell>{formatHours(row.totalWorkingHours)}</TableCell>
                    <TableCell>{row.workingStatus}</TableCell>
                    <TableCell>{row.validation?.status || '-'}</TableCell>
                    <TableCell>
                      {row.location?.punchIn
                        ? `${row.location.punchIn.latitude}, ${row.location.punchIn.longitude}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>

          <div className="pagination">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span>Page {filters.page}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;