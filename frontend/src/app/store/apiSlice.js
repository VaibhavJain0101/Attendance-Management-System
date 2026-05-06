import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearAuthStorage, getStoredToken } from '../../utils/storage';
import { authLoggedOut } from '../../features/auth/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getStoredToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

const baseQueryWithAuthHandling = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    clearAuthStorage();
    api.dispatch(authLoggedOut());
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ['Attendance', 'Overtime', 'Users', 'Reports', 'Notifications', 'Geofence', 'GeoViolations'],
  endpoints: () => ({})
});
