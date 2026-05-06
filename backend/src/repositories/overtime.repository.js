import { OvertimeRequest } from '../models/OvertimeRequest.js';

export const createOvertime = (payload) => OvertimeRequest.create(payload);

export const findOvertimeById = (id) =>
  OvertimeRequest.findById(id)
    .populate('employee', 'name email role manager')
    .populate('attendance')
    .populate('reviewedBy', 'name email role');

export const findOvertimeByAttendanceEmployee = (attendanceId, employeeId) =>
  OvertimeRequest.findOne({ attendance: attendanceId, employee: employeeId });

export const listOvertime = ({ filter, page = 1, limit = 10, sort = { createdAt: -1 } }) => {
  const skip = (page - 1) * limit;

  return Promise.all([
    OvertimeRequest.find(filter)
      .populate('employee', 'name email role manager')
      .populate('attendance')
      .populate('reviewedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    OvertimeRequest.countDocuments(filter)
  ]);
};
