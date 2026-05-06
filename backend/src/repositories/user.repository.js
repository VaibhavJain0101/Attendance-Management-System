import { User } from '../models/User.js';

export const createUser = (payload) => User.create(payload);

export const findUserByEmail = (email, includePassword = false) => {
  const query = User.findOne({ email });
  if (includePassword) {
    query.select('+password');
  }
  return query;
};

export const findUserById = (id) => User.findById(id);

export const findUsers = ({ role, managerId, page = 1, limit = 10 }) => {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (managerId) {
    filter.manager = managerId;
  }

  const skip = (page - 1) * limit;

  return Promise.all([
    User.find(filter)
      .select('-password')
      .populate('manager', 'name email role')
      .populate('assignedOffice', 'officeName latitude longitude radiusInMeters')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);
};

export const updateUserById = (id, payload) =>
  User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  })
    .select('-password')
    .populate('manager', 'name email role')
    .populate('assignedOffice', 'officeName latitude longitude radiusInMeters');
