import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import { getAttendanceList } from './attendance.service.js';
import { getDateKey } from '../utils/date.js';

const toReportRow = (attendance) => ({
  employeeId: attendance.user?._id,
  name: attendance.user?.name,
  email: attendance.user?.email,
  role: attendance.user?.role,
  date: attendance.dateKey,
  punchInTime: attendance.punchIn?.time,
  punchOutTime: attendance.punchOut?.time || null,
  selfie: {
    punchIn: attendance.punchIn?.selfie,
    punchOut: attendance.punchOut?.selfie || null
  },
  location: {
    punchIn: attendance.punchIn?.location,
    punchOut: attendance.punchOut?.location || null
  },
  totalWorkingHours: attendance.totalWorkingHours,
  workingStatus: attendance.workingStatus,
  overtime: attendance.overtime,
  validation: attendance.validation
});

const normalizeReportQuery = (query, usePagination) => {
  const reportQuery = { ...query };

  if (query.date) {
    reportQuery.startDate = query.date;
    reportQuery.endDate = query.date;
  }

  if (!usePagination) {
    delete reportQuery.page;
    delete reportQuery.limit;
  }

  return reportQuery;
};

const toExportRows = (rows) =>
  rows.map((row) => ({
    Name: row.name,
    Email: row.email,
    Role: row.role,
    Date: row.date,
    PunchInTime: row.punchInTime ? new Date(row.punchInTime).toISOString() : '',
    PunchOutTime: row.punchOutTime ? new Date(row.punchOutTime).toISOString() : '',
    TotalWorkingHours: row.totalWorkingHours,
    WorkingStatus: row.workingStatus,
    ValidationStatus: row.validation?.status || 'PENDING',
    ValidationRemarks: row.validation?.remarks || '',
    PunchInLatitude: row.location?.punchIn?.latitude ?? '',
    PunchInLongitude: row.location?.punchIn?.longitude ?? '',
    PunchOutLatitude: row.location?.punchOut?.latitude ?? '',
    PunchOutLongitude: row.location?.punchOut?.longitude ?? '',
    OvertimeRequestedHours: row.overtime?.requestedHours ?? 0,
    OvertimeApprovedHours: row.overtime?.approvedHours ?? 0,
    OvertimeStatus: row.overtime?.status || 'PENDING',
    PunchInSelfie: row.selfie?.punchIn || '',
    PunchOutSelfie: row.selfie?.punchOut || ''
  }));

const buildCsv = (rows) => {
  const exportRows = toExportRows(rows);

  if (!exportRows.length) {
    return 'No data available';
  }

  const headers = Object.keys(exportRows[0]);
  const csvLines = [headers.join(',')];

  for (const row of exportRows) {
    const values = headers.map((header) => {
      const raw = row[header] ?? '';
      const escaped = String(raw).replace(/"/g, '""');
      return `"${escaped}"`;
    });

    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
};

/*const buildXlsxBuffer = (rows) => {
  const exportRows = toExportRows(rows);
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DailyReport');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};
*/
const buildXlsxBuffer = (rows) => {
  const exportRows = toExportRows(rows).map((row) => ({
    ...row,

    PunchInSelfie: row.PunchInSelfie
      ? 'Available'
      : '-',

    PunchOutSelfie: row.PunchOutSelfie
      ? 'Available'
      : '-',
  }));

  const worksheet =
    XLSX.utils.json_to_sheet(exportRows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'DailyReport'
  );

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
};

  /*const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'DailyReport'
  );

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
};
*/
const buildPdfBuffer = async (rows) => {
  const exportRows = toExportRows(rows);
  const document = new PDFDocument({ margin: 30, size: 'A4' });
  const buffers = [];

  document.on('data', (chunk) => buffers.push(chunk));

  const done = new Promise((resolve) => {
    document.on('end', () => resolve(Buffer.concat(buffers)));
  });

  document.fontSize(16).text('Daily Attendance Report', { underline: true });
  document.moveDown();

  if (!exportRows.length) {
    document.fontSize(12).text('No data available for selected filters.');
  } else {
    exportRows.forEach((row, index) => {
      document.fontSize(10).text(`${index + 1}. ${row.Name} (${row.Email})`);
      document.text(
        `Date: ${row.Date} | In: ${row.PunchInTime || '-'} | Out: ${row.PunchOutTime || '-'} | Hours: ${row.TotalWorkingHours}`
      );
      document.text(
        `Status: ${row.WorkingStatus} | Validation: ${row.ValidationStatus} | Overtime: ${row.OvertimeStatus}`
      );
      document.text(`Location(In): ${row.PunchInLatitude}, ${row.PunchInLongitude}`);
      document.text(`Location(Out): ${row.PunchOutLatitude}, ${row.PunchOutLongitude}`);
document.text(
  `Selfie(In): ${
    row.PunchInSelfie ? 'Attached/Available' : '-'
  }`
);

document.text(
  `Selfie(Out): ${
    row.PunchOutSelfie ? 'Attached/Available' : '-'
  }`
);
      document.moveDown();

      if (document.y > 720) {
        document.addPage();
      }
    });
  }

  document.end();
  return done;
};

export const generateDailyReport = async (actor, query) => {
  const reportQuery = normalizeReportQuery(query, true);
  const attendanceResult = await getAttendanceList(actor, reportQuery, true);

  return {
    rows: attendanceResult.data.map(toReportRow),
    meta: {
      total: attendanceResult.total,
      page: attendanceResult.page,
      limit: attendanceResult.limit
    }
  };
};

export const generateDailyReportExport = async (actor, query) => {
  const reportQuery = normalizeReportQuery(query, false);
  const attendanceResult = await getAttendanceList(actor, reportQuery, false);
  const rows = attendanceResult.data.map(toReportRow);

  if (query.format === 'xlsx') {
    return {
      fileName: `attendance-report-${getDateKey(new Date())}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: buildXlsxBuffer(rows)
    };
  }

  if (query.format === 'pdf') {
    return {
      fileName: `attendance-report-${getDateKey(new Date())}.pdf`,
      contentType: 'application/pdf',
      body: await buildPdfBuffer(rows)
    };
  }

  return {
    fileName: `attendance-report-${getDateKey(new Date())}.csv`,
    contentType: 'text/csv; charset=utf-8',
    body: buildCsv(rows)
  };
};
