import { apiSlice } from '../../app/store/apiSlice';

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    punchIn: builder.mutation({
      query: (payload) => ({
        url: '/attendance/checkin',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Attendance', 'Reports']
    }),
    punchOut: builder.mutation({
      query: (payload) => ({
        url: '/attendance/checkout',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Attendance', 'Reports']
    }),
    getAttendance: builder.query({
      query: (params) => ({
        url: '/attendance',
        params
      }),
      providesTags: ['Attendance']
    }),
    validateAttendance: builder.mutation({
      query: ({ attendanceId, body }) => ({
        url: `/attendance/${attendanceId}/validate`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Attendance', 'Reports']
    })
  })
});

export const {
  usePunchInMutation,
  usePunchOutMutation,
  useGetAttendanceQuery,
  useValidateAttendanceMutation
} = attendanceApi;
