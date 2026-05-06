import { Attendance } from '../models/Attendance.js';

export const createAttendance = (payload) => Attendance.create(payload);

export const findAttendanceByUserDate = (userId, dateKey) =>
  Attendance.findOne({ user: userId, dateKey }).populate('user', 'name email role manager assignedOffice');

export const findAttendanceById = (attendanceId) =>
  Attendance.findById(attendanceId)
    .populate('user', 'name email role manager assignedOffice')
    .populate('geofence.officeLocation', 'officeName latitude longitude radiusInMeters address city state country');

export const listAttendance = ({ filter, page = 1, limit = 10, sort = { dateKey: -1 } }) => {
  const skip = (page - 1) * limit;

  return Promise.all([
    Attendance.find(filter)
      .populate('user', 'name email role manager assignedOffice')
      .populate('validation.validatedBy', 'name email role')
      .populate('geofence.officeLocation', 'officeName latitude longitude radiusInMeters address city state country')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter)
  ]);
};

export const listAttendanceWithoutPagination = ({ filter, sort = { dateKey: -1 } }) =>
  Attendance.find(filter)
    .populate('user', 'name email role manager assignedOffice')
    .populate('validation.validatedBy', 'name email role')
    .populate('geofence.officeLocation', 'officeName latitude longitude radiusInMeters address city state country')
    .sort(sort);
