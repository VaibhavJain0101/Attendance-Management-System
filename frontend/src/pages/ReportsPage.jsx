import { useState } from 'react';
import { useSelector } from 'react-redux';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import { useGetDailyReportQuery } from '../features/reports/reportsApi';
import { formatDateTime, formatHours } from '../utils/formatters';
import { getStoredToken } from '../utils/storage';

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
      <h2>Daily Attendance Reports</h2>
      <section className="card">
        <div className="filters">
          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value, page: 1 }))}
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value, page: 1 }))}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value, page: 1 }))}
          />
          {user?.role !== 'EMPLOYEE' ? (
            <input
              type="text"
              placeholder="Filter by User ID"
              value={filters.userId}
              onChange={(event) => setFilters((prev) => ({ ...prev, userId: event.target.value, page: 1 }))}
            />
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="inline-actions">
          <button type="button" disabled={Boolean(exportingFormat)} onClick={() => downloadReport('csv')}>
            {exportingFormat === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
          </button>
          <button type="button" disabled={Boolean(exportingFormat)} onClick={() => downloadReport('xlsx')}>
            {exportingFormat === 'xlsx' ? 'Exporting Excel...' : 'Export Excel'}
          </button>
          <button type="button" disabled={Boolean(exportingFormat)} onClick={() => downloadReport('pdf')}>
            {exportingFormat === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
          </button>
        </div>
        {exportError ? <p className="error-text">{exportError}</p> : null}
      </section>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Validation</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.employeeId}-${row.date}`}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.date}</td>
                  <td>{formatDateTime(row.punchInTime)}</td>
                  <td>{formatDateTime(row.punchOutTime)}</td>
                  <td>{formatHours(row.totalWorkingHours)}</td>
                  <td>{row.workingStatus}</td>
                  <td>{row.validation?.status || '-'}</td>
                  <td>
                    {row.location?.punchIn
                      ? `${row.location.punchIn.latitude}, ${row.location.punchIn.longitude}`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            type="button"
            disabled={filters.page === 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span>Page {filters.page}</span>
          <button type="button" onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;
