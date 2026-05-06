import { apiSlice } from '../../app/store/apiSlice';

export const overtimeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    requestOvertime: builder.mutation({
      query: (payload) => ({
        url: '/overtime/request',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['Overtime', 'Attendance', 'Reports']
    }),
    reviewOvertime: builder.mutation({
      query: ({ overtimeId, body }) => ({
        url: `/overtime/${overtimeId}/review`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Overtime', 'Attendance', 'Reports']
    }),
    getOvertime: builder.query({
      query: (params) => ({
        url: '/overtime',
        params
      }),
      providesTags: ['Overtime']
    })
  })
});

export const { useRequestOvertimeMutation, useReviewOvertimeMutation, useGetOvertimeQuery } = overtimeApi;
